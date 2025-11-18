import { sleep } from "@lib/utils";
import { createStep, createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";

const validateContentStep = createStep({
  id: "validate-content",
  description: "Validates incoming text content",
  inputSchema: z.object({
    content: z.string().min(1, "Content cannot be empty"),
    type: z.enum(["article", "blog", "social"]).default("article"),
  }),
  outputSchema: z.object({
    content: z.string(),
    type: z.string(),
    wordCount: z.number(),
    isValid: z.boolean(),
  }),
  execute: async ({ inputData }) => {
    const { content, type } = inputData;

    const wordCount = content.trim().split(/\s+/).length;
    const isValid = wordCount >= 5; // Minimum 5 words

    if (!isValid) {
      throw new Error(`Content too short: ${wordCount} words`);
    }

    await sleep(500);

    return {
      content: content.trim(),
      type,
      wordCount,
      isValid,
    };
  },
});

const enhanceContentStep = createStep({
  id: "enhance-content",
  description: "Adds metadata to validated content",
  inputSchema: z.object({
    content: z.string(),
    type: z.string(),
    wordCount: z.number(),
    isValid: z.boolean(),
  }),
  outputSchema: z.object({
    content: z.string(),
    type: z.string(),
    wordCount: z.number(),
    metadata: z.object({
      readingTime: z.number(),
      difficulty: z.enum(["easy", "medium", "hard"]),
      processedAt: z.string(),
    }),
  }),
  execute: async ({ inputData }) => {
    const { content, type, wordCount } = inputData;

    // Calculate reading time (200 words per minute)
    const readingTime = Math.ceil(wordCount / 200);

    // Determine difficulty based on word count
    let difficulty: "easy" | "medium" | "hard" = "easy";
    if (wordCount > 100) difficulty = "medium";
    if (wordCount > 300) difficulty = "hard";

    await sleep(500);

    return {
      content,
      type,
      wordCount,
      metadata: {
        readingTime,
        difficulty,
        processedAt: new Date().toISOString(),
      },
    };
  },
});

const generateSummaryStep = createStep({
  id: "generate-summary",
  description: "Creates a summary of the content",
  inputSchema: z.object({
    content: z.string(),
    type: z.string(),
    wordCount: z.number(),
    metadata: z.object({
      readingTime: z.number(),
      difficulty: z.enum(["easy", "medium", "hard"]),
      processedAt: z.string(),
    }),
  }),
  outputSchema: z.object({
    content: z.string(),
    type: z.string(),
    wordCount: z.number(),
    metadata: z.object({
      readingTime: z.number(),
      difficulty: z.enum(["easy", "medium", "hard"]),
      processedAt: z.string(),
    }),
    summary: z.string(),
  }),
  execute: async ({ inputData }) => {
    const { content, type, wordCount, metadata } = inputData;

    // Create a simple summary from first sentence
    const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const firstSentence = sentences[0]?.trim() + ".";

    // Generate summary based on content length
    let summary = firstSentence;
    if (wordCount > 50) {
      summary += ` This ${type} contains ${wordCount} words and takes approximately ${metadata.readingTime} minute(s) to read.`;
    }

    console.log(`📝 Generated summary: ${summary.length} characters`);

    return {
      content,
      type,
      wordCount,
      metadata,
      summary: "",
    };
  },
});

export const contentWorkflow = createWorkflow({
  id: "content-processing-workflow",
  description: "Validates, enhances, and summarizes content",
  inputSchema: z.object({
    content: z.string(),
    type: z.enum(["article", "blog", "social"]).default("article"),
  }),
  outputSchema: z.object({
    content: z.string(),
    type: z.string(),
    wordCount: z.number(),
    metadata: z.object({
      readingTime: z.number(),
      difficulty: z.enum(["easy", "medium", "hard"]),
      processedAt: z.string(),
    }),
    summary: z.string(),
  }),
})
  .then(validateContentStep)
  .then(enhanceContentStep)
  .then(generateSummaryStep)
  .commit();
