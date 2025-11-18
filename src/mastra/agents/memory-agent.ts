import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";
import { LibSQLStore, LibSQLVector } from "@mastra/libsql";
import { anthropic } from "@ai-sdk/anthropic";

// Create a memory instance with custom conversation history settings
const memory = new Memory({
  storage: new LibSQLStore({
    url: "file:../../memory.db", // relative path from the `.mastra/output` directory
  }),
  vector: new LibSQLVector({
    connectionUrl: "file:../../vector.db", // relative path from the `.mastra/output` directory
  }),
  options: {
    lastMessages: 20, // Include the last 20 messages in the context instead of the default 10
  },
});

// Create an agent with memory
export const memoryAgent = new Agent({
  name: "MemoryAgent",
  instructions: `
    You are a helpful assistant with memory capabilities.
    You can remember previous conversations and user preferences.
    When a user shares information about themselves, acknowledge it and remember it for future reference.
    If asked about something mentioned earlier in the conversation, recall it accurately.
  `,
  model: anthropic("claude-haiku-4-5-20251001"),
  memory: memory,
});
