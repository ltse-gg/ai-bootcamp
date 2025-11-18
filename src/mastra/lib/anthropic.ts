import { createAnthropic } from "@ai-sdk/anthropic";

// Configure Anthropic client to use MASTRA_ANTHROPIC_API_KEY
export const anthropic = createAnthropic({
  apiKey: process.env.MASTRA_ANTHROPIC_API_KEY,
});
