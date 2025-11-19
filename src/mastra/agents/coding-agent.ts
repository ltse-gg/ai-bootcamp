import { Agent } from "@mastra/core/agent";
import { openai } from "@ai-sdk/openai";
import { anthropic } from "@lib/anthropic";
import { LibSQLStore, LibSQLVector } from "@mastra/libsql";
import { Memory } from "@mastra/memory";
import { claudeCliTool } from "../tools/claude-cli-tool";

/**
 * Memory configuration for the coding agent
 * Tracks conversation history, project context, and coding tasks
 */
const codingMemory = new Memory({
  storage: new LibSQLStore({
    url: "file:../../memory.db",
  }),
  vector: new LibSQLVector({
    connectionUrl: "file:../../vector.db",
  }),
  embedder: openai.embedding("text-embedding-3-small"),
  options: {
    lastMessages: 20,
    semanticRecall: {
      topK: 5,
      messageRange: {
        before: 2,
        after: 1,
      },
    },
    workingMemory: {
      enabled: true,
      template: `
# Coding Session Context

## Project Information
- Project Name:
- Framework/Stack:
- Key Technologies:
- Project Structure:

## Current Work
- Active Files:
- Current Task:
- Related Issues/Features:

## Session Progress
- Completed Tasks:
  - [Task 1]:
    - Changes Made:
    - Files Modified:
    - Claude CLI Session ID:
  - [Task 2]:
    - Changes Made:
    - Files Modified:
    - Claude CLI Session ID:

## Code Context
- Recent Changes:
- Key Functions/Components Modified:
- Dependencies Added/Updated:

## Next Steps
- TODO:
- Pending Issues:
- Follow-up Tasks:

## Notes
- Important Decisions:
- Code Patterns to Follow:
- Known Limitations:
`,
    },
  },
});

/**
 * Coding Agent that uses Claude Code CLI in headless mode
 * to perform code-related tasks
 */
export const codingAgent = new Agent({
  name: "Coding Agent",
  description:
    "An AI agent that uses Claude Code CLI to analyze, modify, and work with code. It can perform file operations, git commands, and other development tasks by delegating to Claude CLI.",
  instructions: `You are an expert coding assistant that uses the Claude Code CLI in headless mode.

CAPABILITIES:
- Delegate coding tasks to Claude CLI, which has comprehensive tools for:
  - File operations (read, write, edit, search)
  - Git operations (status, diff, commit, etc.)
  - Code analysis and modification
  - Running bash commands
  - And more built-in capabilities
- Advanced memory to maintain context across coding sessions

MEMORY USAGE:
- You have access to working memory to track project context and session progress
- When you learn about the project structure, framework, or key technologies, update your working memory
- Track completed tasks, file changes, and Claude CLI session IDs in your working memory
- Use semantic recall to reference previous conversations and decisions
- Maintain continuity by referring to past changes and context

WORKFLOW:
1. When the user asks you to perform a coding task, use the claude-cli-headless tool
2. Pass a clear, specific prompt to the tool describing what needs to be done
3. The tool will return the response from Claude CLI including:
   - The result text
   - Session ID (for continuing multi-turn conversations)
   - Cost and duration metadata
4. Interpret the response and relay it to the user
5. Store important context (task completion, session IDs, changes made) in working memory
6. For follow-up requests, you can pass the sessionId to continue the Claude CLI conversation
7. Use your memory to provide context-aware assistance across multiple interactions

BEST PRACTICES:
- Be specific in your prompts to Claude CLI
- Use session management for multi-turn interactions with Claude CLI
- Update working memory after significant changes or task completions
- Reference previous work and decisions from memory when relevant
- Track Claude CLI session IDs in working memory for complex multi-turn tasks
- Relay cost and duration information to the user when relevant
- If Claude CLI encounters an error, explain it clearly to the user

CONSTRAINTS:
- Always use the claude-cli-headless tool for coding tasks
- Do not attempt to perform file operations directly
- Let Claude CLI handle all the actual code manipulation`,

  model: anthropic("claude-sonnet-4-5-20250929"),

  tools: {
    claudeCliTool,
  },

  memory: codingMemory,
});
