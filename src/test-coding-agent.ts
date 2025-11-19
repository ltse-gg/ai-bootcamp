// src/test-coding-agent.ts
import "dotenv/config";
import { mastra } from "./mastra";

async function testCodingAgent() {
  console.log("🤖 Testing Coding Agent with Claude Code CLI...\n");

  try {
    // Get the coding agent instance
    const agent = mastra.getAgent("codingAgent");

    if (!agent) {
      throw new Error("Coding agent not found");
    }

    // Test 1: Simple proof-of-concept request
    console.log("📝 Test 1: Check project structure");
    console.log(
      "Prompt: Check the project structure and tell me what framework this codebase uses\n",
    );

    const response = await agent.generate(
      "Check the project structure and tell me what framework this codebase uses",
      {},
    );

    console.log("✅ Response:");
    console.log(response.text);
    console.log();

    console.log("✅ Test completed successfully!");
  } catch (error) {
    console.error("❌ Error:", (error as Error).message);
    console.error(error);
  }
}

// Run the test
testCodingAgent().then(console.log).catch(console.error);
