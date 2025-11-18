// src/run-workflow.ts
import { mastra } from "./mastra";

async function runContentWorkflow() {
  console.log("🚀 Running workflow programmatically...\n");

  try {
    // Get the workflow instance
    const workflow = mastra.getWorkflow("contentWorkflow");

    if (!workflow) {
      throw new Error("Workflow not found");
    }

    // Create a run instance
    const run = await workflow.createRunAsync();

    // Execute with test data
    const result = await run.start({
      inputData: {
        content:
          "Climate change is one of the most pressing challenges of our time, requiring immediate action from governments, businesses, and individuals worldwide.",
        type: "blog",
      },
    });

    if (result.status === "success") {
      console.log("✅ Success!");
      console.log(
        "📊 Reading time:",
        result.result.metadata.readingTime,
        "minutes",
      );
      console.log("🎯 Difficulty:", result.result.metadata.difficulty);
      console.log("📅 Processed at:", result.result.metadata.processedAt);
    }
  } catch (error) {
    console.error("❌ Error:", (error as Error).message);
  }
}

// Run the workflow
runContentWorkflow();
