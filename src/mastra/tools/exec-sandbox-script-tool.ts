import { createTool } from "@mastra/core/tools";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import { z } from "zod";

const execAsync = promisify(exec);

const CLAUDE_CLI_SANDBOX_DIR = process.env.CLAUDE_CLI_SANDBOX_DIR || "/tmp/claude-cli-sandbox";
const DEFAULT_TIMEOUT = 60000; // 60 seconds

/**
 * Tool for executing generated .tsx TypeScript scripts in a sandboxed environment
 * Uses ./node_modules/.bin/tsx to execute the script
 * Retrieves businessToken and authToken from runtime context
 */
export const execSandboxScriptTool = createTool({
  id: "exec-sandbox-script",
  description:
    "Executes a generated .tsx TypeScript script in a sandboxed environment with business and auth tokens. The script is executed using ./node_modules/.bin/tsx (which must be installed in the sandbox). Use this after a .tsx script has been generated to run it and return the results to the business owner. The script has access to all client and appointment data via businessToken and authToken environment variables.",
  inputSchema: z.object({
    scriptPath: z
      .string()
      .describe("Path to the .tsx script file to execute (relative to sandbox directory)"),
    args: z.array(z.string()).optional().describe("Optional arguments to pass to the script"),
  }),
  outputSchema: z.object({
    success: z.boolean().describe("Whether the script executed successfully"),
    stdout: z.string().describe("Standard output from the script"),
    stderr: z.string().optional().describe("Standard error output if any"),
    exitCode: z.number().optional().describe("Script exit code"),
    error: z.string().optional().describe("Error message if execution failed"),
  }),
  execute: async ({ context, runtimeContext }) => {
    const { scriptPath, args = [] } = context;

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

    // Build the command
    const escapedArgs = args.map((arg) => `${arg.replace(/"/g, '\\"')}`);
    const command = `./node_modules/.bin/tsx "${scriptPath}" "${escapedArgs.join(" ")}"`;

    console.log(`[Exec Sandbox Script] Executing: ${command}`);
    console.log(`[Exec Sandbox Script] Working directory: ${CLAUDE_CLI_SANDBOX_DIR}`);
    console.log(`[Exec Sandbox Script] Tokens available: businessToken, authToken`);

    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: CLAUDE_CLI_SANDBOX_DIR,
        timeout: DEFAULT_TIMEOUT,
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer for large outputs
        encoding: "utf8",
        env: {
          ...process.env, // Include system PATH and other essential env vars
          businessToken,
          authToken,
        },
      });

      console.log(`[Exec Sandbox Script] Execution completed successfully`);

      return {
        success: true,
        stdout: stdout.trim(),
        stderr: stderr ? stderr.trim() : undefined,
        exitCode: 0,
      };
    } catch (error: any) {
      // exec throws on non-zero exit codes or timeout
      console.error(`[Exec Sandbox Script] Execution failed:`, error.message);

      return {
        success: false,
        stdout: error.stdout?.trim() || "",
        stderr: error.stderr?.trim() || "",
        exitCode: error.code || -1,
        error: error.message,
      };
    }
  },
});
