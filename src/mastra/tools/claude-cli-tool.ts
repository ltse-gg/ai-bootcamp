import { createTool } from "@mastra/core/tools";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import { z } from "zod";

const execAsync = promisify(exec);

const claudeCliResponseSchema = z.object({
  type: z.string().optional(),
  subtype: z.string().optional(),
  is_error: z.boolean().optional(),
  duration_ms: z.number().optional(),
  duration_api_ms: z.number().optional(),
  num_turns: z.number().optional(),
  result: z.string().optional(),
  session_id: z.string().optional(),
  total_cost_usd: z.number().optional(),
  usage: z
    .object({
      input_tokens: z.number().optional(),
      cache_creation_input_tokens: z.number().optional(),
      cache_read_input_tokens: z.number().optional(),
      output_tokens: z.number().optional(),
      server_tool_use: z
        .object({
          web_search_requests: z.number().optional(),
          web_fetch_requests: z.number().optional(),
        })
        .optional(),
      service_tier: z.string().optional(),
      cache_creation: z
        .object({
          ephemeral_1h_input_tokens: z.number().optional(),
          ephemeral_5m_input_tokens: z.number().optional(),
        })
        .optional(),
    })
    .optional(),
  modelUsage: z
    .record(
      z.string(),
      z.object({
        inputTokens: z.number().optional(),
        outputTokens: z.number().optional(),
        cacheReadInputTokens: z.number().optional(),
        cacheCreationInputTokens: z.number().optional(),
        webSearchRequests: z.number().optional(),
        costUSD: z.number().optional(),
        contextWindow: z.number().optional(),
      }),
    )
    .optional(),
  permission_denials: z.array(z.any()).optional(),
  uuid: z.string().optional(),
});

const CLAUDE_CLI_SANDBOX_DIR = process.env.CLAUDE_CLI_SANDBOX_DIR || "/tmp/claude-cli-sandbox";
const CLAUDE_CLI_ALLOWED_TOOLS = "Bash,Read,Write,Edit,Glob,Grep";
const CLAUDE_CLI_MODEL = "haiku";

/**
 * Tool for executing Claude Code CLI in headless mode
 * Uses `claude -p` flag for non-interactive execution
 */
export const claudeCliTool = createTool({
  id: "claude-cli-headless",
  description:
    "Executes Claude Code CLI in headless mode to generate scripts for client and appointment data management. Claude CLI has full access to all client information, appointment data, and can perform file operations, bash commands, and code generation. Use this to create scripts that filter, analyze, or report on client/appointment data based on business requirements.",
  inputSchema: z.object({
    prompt: z.string().describe("The task or question to send to Claude CLI"),
    sessionId: z.string().optional().describe("Resume a specific session by ID"),
    systemPrompt: z.string().optional().describe("Additional system instructions to append"),
  }),
  outputSchema: claudeCliResponseSchema.extend({
    success: z.boolean().describe("Whether the command executed successfully"),
    error: z.string().optional().describe("Error message if command failed or stderr output"),
  }),
  execute: async ({ context }) => {
    const { prompt, sessionId, systemPrompt } = context;

    // Build the command
    let command = `claude -p "${prompt.replace(/"/g, '\\"')}" --output-format json --model ${CLAUDE_CLI_MODEL}`;

    // Add session management flags
    if (sessionId) {
      command += ` --resume "${sessionId}"`;
    }

    // Add system prompt if provided
    if (systemPrompt) {
      command += ` --append-system-prompt "${systemPrompt.replace(/"/g, '\\"')}"`;
    }

    // Tool restrictions
    command += ` --allowedTools = ${CLAUDE_CLI_ALLOWED_TOOLS}`;

    // Allow edits
    command += ` --permission-mode acceptEdits`;

    // Redirect stdin from /dev/null to prevent hanging
    command += ` < /dev/null`;

    try {
      console.log(`[Claude CLI Tool] Executing command: ${command}`);

      const { stdout, stderr } = await execAsync(command, {
        cwd: CLAUDE_CLI_SANDBOX_DIR,
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer for large outputs
        encoding: "utf8",
      });

      console.log(`[Claude CLI Tool] Command completed`);

      // Check if stderr has warnings or errors
      const stderrWarning = stderr ? `stderr: ${stderr.trim()}` : undefined;

      // Parse and validate JSON response from Claude CLI
      try {
        const rawResponse = JSON.parse(stdout);
        const response = claudeCliResponseSchema.parse(rawResponse);

        return {
          ...response,
          success: true,
          error: stderrWarning, // Include stderr as warning if present
        };
      } catch (parseError) {
        // If JSON parsing or validation fails, return raw stdout
        const parseErrorMsg = `JSON parse/validation error: ${parseError instanceof Error ? parseError.message : String(parseError)}`;
        const combinedError = stderrWarning ? `${parseErrorMsg}; ${stderrWarning}` : parseErrorMsg;

        return {
          success: true,
          result: stdout,
          error: combinedError,
        };
      }
    } catch (error: any) {
      // Command execution failed
      const errorMessage = error.stderr || error.message || "Unknown error";
      const stdout = error.stdout || "";

      return {
        success: false,
        result: stdout,
        error: errorMessage,
      };
    }
  },
});
