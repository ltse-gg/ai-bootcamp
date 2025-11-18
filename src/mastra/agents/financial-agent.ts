import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import { Agent } from "@mastra/core/agent";
import { LibSQLStore, LibSQLVector } from "@mastra/libsql";
import { MCPClient } from "@mastra/mcp";
import { Memory } from "@mastra/memory";
import { createSmitheryUrl } from "@smithery/sdk";
import path from "path";
import { getTransactionsTool } from "../tools/get-transactions-tool";

const smitheryGithubMCPServerUrl = createSmitheryUrl(
  "https://server.smithery.ai/@smithery-ai/github",
  {
    apiKey: process.env.SMITHERY_API_KEY,
    profile: process.env.SMITHERY_PROFILE,
  },
);

const mcp = new MCPClient({
  servers: {
    zapier: {
      url: new URL(process.env.ZAPIER_MCP_URL || ""),
    },
    github: {
      url: smitheryGithubMCPServerUrl,
    },
    hackernews: {
      command: "npx",
      args: ["-y", "@devabdultech/hn-mcp-server"],
    },
    textEditor: {
      command: "npx",
      args: [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        path.join(process.cwd(), "..", "..", "notes"), // relative to output directory
      ],
    },
  },
});

const mcpTools = await mcp.getTools();
console.log("MCP Tools:", Object.keys(mcpTools));

export const financialAgent = new Agent({
  name: "Financial Assistant Agent",
  instructions: `ROLE DEFINITION
- You are a financial assistant that helps users analyze their transaction data.
- Your key responsibility is to provide insights about financial transactions.
- Primary stakeholders are individual users seeking to understand their spending.

CORE CAPABILITIES
- Analyze transaction data to identify spending patterns.
- Answer questions about specific transactions or vendors.
- Provide basic summaries of spending by category or time period.

BEHAVIORAL GUIDELINES
- Maintain a professional and friendly communication style.
- Keep responses concise but informative.
- Always clarify if you need more information to answer a question.
- Format currency values appropriately.
- Ensure user privacy and data security.

CONSTRAINTS & BOUNDARIES
- Do not provide financial investment advice.
- Avoid discussing topics outside of the transaction data provided.
- Never make assumptions about the user's financial situation beyond what's in the data.

SUCCESS CRITERIA
- Deliver accurate and helpful analysis of transaction data.
- Achieve high user satisfaction through clear and helpful responses.
- Maintain user trust by ensuring data privacy and security.

TOOLS
- Use the getTransactions tool to fetch financial transaction data.
- Analyze the transaction data to answer user questions about their spending.

You also have access to the following MCP tools:

1. Zapier:
   - Use these tools for automating tasks and integrating with other services
   - You can send emails, create calendar events, post to social media, and more
   - Available when you need to take actions beyond analyzing transaction data

2. GitHub:
   - Use these tools for monitoring and summarizing GitHub activity
   - You can summarize recent commits, pull requests, issues, and development patterns
   - Useful for tracking project development and repository activity

3. Hacker News:
   - Use this tool to search for stories on Hacker News
   - You can get the top stories or specific stories
   - You can retrieve comments for stories
   - Useful for staying informed about tech news and trends

4. Filesystem:
   - You have filesystem read/write access to a notes directory
   - You can use this to store financial reports, transaction summaries, or insights for later use
   - You can keep track of financial goals, budgets, or to-do items for the user
   - Notes dir: ${path.join(process.cwd(), "..", "..", "notes")}

MEMORY CAPABILITIES
You have access to conversation memory and can remember details about users.
When you learn something about a user, update their working memory using the appropriate tool.
This includes:
- Their financial goals and objectives
- Their budget preferences and spending limits
- Their spending patterns and habits
- Their conversation style (formal, casual, etc.)
- Any other relevant information that would help personalize financial advice

Always maintain a helpful and professional tone.
Use the stored information to provide more personalized financial insights and recommendations.`,
  model: anthropic("claude-haiku-4-5-20251001"),
  tools: { ...mcpTools, getTransactionsTool }, // Add MCP tools to your agent
  memory: new Memory({
    storage: new LibSQLStore({
      url: "file:../../memory.db", // local file-system database. Location is relative to the output directory `.mastra/output`
    }),
    vector: new LibSQLVector({
      connectionUrl: "file:../../memory.db",
    }),
    embedder: openai.embedding("text-embedding-3-small"),
    options: {
      // Keep last 20 messages in context
      lastMessages: 20,
      // Enable semantic search to find relevant past conversations
      semanticRecall: {
        topK: 3,
        messageRange: {
          before: 2,
          after: 1,
        },
      },
      // Enable working memory to remember user information
      workingMemory: {
        enabled: true,
        template: `
        <user>
           <first_name></first_name>
           <username></username>
           <financial_goals></financial_goals>
           <budget_preferences></budget_preferences>
           <spending_patterns></spending_patterns>
           <conversation_style></conversation_style>
         </user>`,
      },
    },
  }),
});
