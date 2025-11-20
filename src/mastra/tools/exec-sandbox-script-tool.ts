import { createTool } from "@mastra/core/tools";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import { z } from "zod";

const execAsync = promisify(exec);

const CLAUDE_CLI_SANDBOX_DIR = process.env.CLAUDE_CLI_SANDBOX_DIR || "/tmp/claude-cli-sandbox";
const DEFAULT_TIMEOUT = 60000; // 60 seconds

/**
 * Tool for executing generated .tsx TypeScript scripts in an isolated Docker container
 * Uses the 'exec-sandbox' Docker image (node:22-alpine with tsx installed)
 * Retrieves businessToken and authToken from runtime context
 * Containers are kept after execution for debugging (use 'docker logs <container-name>')
 */
export const execSandboxScriptTool = createTool({
  id: "exec-sandbox-script",
  description:
    "Executes a generated .tsx TypeScript script in an isolated Docker container with business and auth tokens. Requires 'exec-sandbox' Docker image to be built from Dockerfile.exec-sandbox. The container persists after execution for debugging - use 'docker logs <container-name>' to inspect output. The script has access to all client and appointment data via businessToken and authToken environment variables. Use 'docker container prune' to clean up stopped containers.",
  inputSchema: z.object({
    scriptPath: z
      .string()
      .describe("Path to the .tsx script file to execute (relative to sandbox directory)"),
  }),
  outputSchema: z.object({
    success: z.boolean().describe("Whether the script executed successfully"),
    stdout: z.string().describe("Standard output from the script"),
    stderr: z.string().optional().describe("Standard error output if any"),
    exitCode: z.number().optional().describe("Script exit code"),
    error: z.string().optional().describe("Error message if execution failed"),
    containerName: z.string().optional().describe("Docker container name for log inspection"),
  }),
  execute: async ({ context, runtimeContext }) => {
    const { scriptPath } = context;

    // Get tokens from runtime context
    const businessToken = runtimeContext?.get<string>("businessToken");
    const authToken = runtimeContext?.get<string>("authToken");

    // Validate that tokens are available
    if (
      !businessToken ||
      !authToken ||
      typeof businessToken !== "string" ||
      typeof authToken !== "string"
    ) {
      return {
        success: false,
        stdout: "",
        error: "Missing required tokens (businessToken or authToken) in runtime context",
        exitCode: -1,
      };
    }

    // Validate script path (prevent path traversal)
    if (scriptPath.includes("..")) {
      return {
        success: false,
        stdout: "",
        error: "Invalid script path: path traversal not allowed",
        exitCode: -1,
      };
    }

    // Generate unique container name with timestamp
    const containerName = `exec-sandbox-${Date.now()}`;

    // Escape tokens for shell
    const escapedBusinessToken = businessToken.replace(/"/g, '\\"');
    const escapedAuthToken = authToken.replace(/"/g, '\\"');

    // Build Docker command
    const dockerArgs = [
      "run",
      `--name ${containerName}`,
      `-e businessToken="${escapedBusinessToken}"`,
      `-e authToken="${escapedAuthToken}"`,
      `-v "${CLAUDE_CLI_SANDBOX_DIR}:/sandbox:ro"`,
      `-w /sandbox`,
      "exec-sandbox",
      "tsx",
      `"${scriptPath}"`,
    ];
    const command = `docker ${dockerArgs.join(" ")}`;

    console.log(`[Exec Sandbox Script] Executing in Docker container: ${containerName}`);
    console.log(`[Exec Sandbox Script] Command: ${command}`);
    console.log(`[Exec Sandbox Script] Sandbox directory: ${CLAUDE_CLI_SANDBOX_DIR}`);
    console.log(`[Exec Sandbox Script] Tokens: businessToken, authToken`);

    try {
      const { stdout, stderr } = await execAsync(command, {
        timeout: DEFAULT_TIMEOUT,
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer for large outputs
        encoding: "utf8",
      });

      console.log(`[Exec Sandbox Script] Container ${containerName} completed successfully`);
      console.log(`[Exec Sandbox Script] Inspect logs: docker logs ${containerName}`);

      return {
        success: true,
        stdout: stdout.trim(),
        stderr: stderr ? stderr.trim() : undefined,
        exitCode: 0,
        containerName,
      };
    } catch (error: any) {
      // exec throws on non-zero exit codes or timeout
      console.error(`[Exec Sandbox Script] Container ${containerName} failed:`, error.message);
      console.error(`[Exec Sandbox Script] Inspect logs: docker logs ${containerName}`);

      return {
        success: false,
        stdout: error.stdout?.trim() || "",
        stderr: error.stderr?.trim() || "",
        exitCode: error.code || -1,
        error: error.message,
        containerName,
      };
    }
  },
});
