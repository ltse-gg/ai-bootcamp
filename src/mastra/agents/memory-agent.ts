import { openai } from "@ai-sdk/openai";
import { anthropic } from "@lib/anthropic";
import { Agent } from "@mastra/core/agent";
import { LibSQLStore, LibSQLVector } from "@mastra/libsql";
import { Memory } from "@mastra/memory";

// Create a memory instance with semantic recall configuration
const memory = new Memory({
  storage: new LibSQLStore({
    url: "file:../../memory.db", // relative path from the `.mastra/output` directory
  }), // Storage for message history
  vector: new LibSQLVector({
    connectionUrl: "file:../../vector.db", // relative path from the `.mastra/output` directory
  }), // Vector database for semantic search
  embedder: openai.embedding("text-embedding-3-small"), // Embedder for message embeddings
  options: {
    lastMessages: 20, // Include the last 20 messages in the context
    semanticRecall: {
      topK: 3,
      messageRange: {
        before: 2,
        after: 1,
      },
    },
    workingMemory: {
      enabled: true,
      template: `
# User Profile

## Personal Info
- Name:
- Location:
- Timezone:
- Occupation:

## Preferences
- Communication Style:
- Topics of Interest:
- Learning Goals:

## Project Information
- Current Projects:
  - [Project 1]:
    - Deadline:
    - Status:
  - [Project 2]:
    - Deadline:
    - Status:

## Session State
- Current Topic:
- Open Questions:
- Action Items:
`,
    },
  },
});

// Create an agent with the configured memory
export const memoryAgent = new Agent({
  name: "MemoryAgent",
  instructions: `
    You are a helpful assistant with advanced memory capabilities.
    You can remember previous conversations and user preferences.

    IMPORTANT: You have access to working memory to store persistent information about the user.
    When you learn something important about the user, update your working memory according to the template.

    Always refer to your working memory before asking for information the user has already provided.
    Use the information in your working memory to provide personalized responses.

    When the user shares personal information such as their name, location, or preferences,
    acknowledge it and update your working memory accordingly.
  `,
  model: anthropic("claude-haiku-4-5-20251001"),
  memory: memory,
});
