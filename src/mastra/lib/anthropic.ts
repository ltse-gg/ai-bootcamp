import { createAnthropic } from "@ai-sdk/anthropic";

// Configure Anthropic client to use APP_ANTHROPIC_API_KEY
export const anthropic = createAnthropic({
  apiKey: process.env.APP_ANTHROPIC_API_KEY,
});
