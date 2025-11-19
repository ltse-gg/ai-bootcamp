import { sleep } from "@lib/utils";
import { createStep, createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";

// Step 1: Validate payment request
const validatePaymentStep = createStep({
  id: "validate-payment",
  description: "Validates incoming payment request",
  inputSchema: z.object({
    amount: z.number().positive(),
    recipient: z.string().min(1),
    description: z.string().min(1),
  }),
  outputSchema: z.object({
    amount: z.number(),
    recipient: z.string(),
    description: z.string(),
    isValid: z.boolean(),
    requiresApproval: z.boolean(),
  }),
  execute: async ({ inputData }) => {
    const { amount, recipient, description } = inputData;

    console.log(`💳 Validating payment: $${amount} to ${recipient}`);
    await sleep(500);

    // Payments over $1000 require approval
    const requiresApproval = amount > 1000;

    return {
      amount,
      recipient,
      description,
      isValid: true,
      requiresApproval,
    };
  },
});

// Step 2: Approval step with suspend/resume
const approvalStep = createStep({
  id: "approval-step",
  description: "Human approval for large payments",
  inputSchema: z.object({
    amount: z.number(),
    recipient: z.string(),
    description: z.string(),
    isValid: z.boolean(),
    requiresApproval: z.boolean(),
  }),
  // Define what data we expect when resuming
  resumeSchema: z.object({
    approved: z.boolean(),
    approverName: z.string(),
    approverNotes: z.string().optional(),
  }),
  outputSchema: z.object({
    amount: z.number(),
    recipient: z.string(),
    description: z.string(),
    approved: z.boolean(),
    approverName: z.string().optional(),
    approverNotes: z.string().optional(),
  }),
  execute: async ({ inputData, resumeData, suspend }) => {
    const { amount, recipient, description, requiresApproval } = inputData;

    // If payment doesn't require approval, auto-approve
    if (!requiresApproval) {
      console.log("✅ Auto-approved (under $1000 threshold)");
      return {
        amount,
        recipient,
        description,
        approved: true,
        approverName: "System",
      };
    }

    // Check if we have resume data from a previous suspension
    if (resumeData) {
      const { approved, approverName, approverNotes } = resumeData;
      console.log(
        `📋 Received approval decision: ${approved ? "APPROVED" : "REJECTED"} by ${approverName}`,
      );

      return {
        amount,
        recipient,
        description,
        approved,
        approverName,
        approverNotes,
      };
    }

    // No resume data - this is the first time through
    // Suspend the workflow and wait for human approval
    console.log(`⏸️  SUSPENDED: Waiting for approval of $${amount} payment to ${recipient}`);
    console.log(`   Description: ${description}`);
    console.log(`   Run ID will be returned - use it to resume with approval decision`);

    return await suspend({});
  },
});

// Step 3: Process approved payment
const processPaymentStep = createStep({
  id: "process-payment",
  description: "Processes approved payment",
  inputSchema: z.object({
    amount: z.number(),
    recipient: z.string(),
    description: z.string(),
    approved: z.boolean(),
    approverName: z.string().optional(),
    approverNotes: z.string().optional(),
  }),
  outputSchema: z.object({
    status: z.enum(["processed", "rejected"]),
    transactionId: z.string().optional(),
    amount: z.number(),
    recipient: z.string(),
    message: z.string(),
  }),
  execute: async ({ inputData }) => {
    const { amount, recipient, approved, approverName, approverNotes } = inputData;

    if (!approved) {
      console.log(`❌ Payment REJECTED by ${approverName}`);
      return {
        status: "rejected" as const,
        amount,
        recipient,
        message: `Payment rejected by ${approverName}. ${approverNotes || ""}`,
      };
    }

    console.log(`💸 Processing payment: $${amount} to ${recipient}`);
    console.log(`   Approved by: ${approverName}`);
    await sleep(1000);

    const transactionId = `TXN-${Date.now()}`;

    console.log(`✅ Payment processed successfully!`);
    console.log(`   Transaction ID: ${transactionId}`);

    return {
      status: "processed" as const,
      transactionId,
      amount,
      recipient,
      message: `Payment of $${amount} to ${recipient} processed successfully. Approved by ${approverName}.`,
    };
  },
});

// Export the payment workflow
export const paymentWorkflow = createWorkflow({
  id: "payment-approval-workflow",
  description: "Payment processing with human approval for large amounts",
  inputSchema: z.object({
    amount: z.number().positive(),
    recipient: z.string().min(1),
    description: z.string().min(1),
  }),
  outputSchema: z.object({
    status: z.enum(["processed", "rejected"]),
    transactionId: z.string().optional(),
    amount: z.number(),
    recipient: z.string(),
    message: z.string(),
  }),
})
  .then(validatePaymentStep)
  .then(approvalStep)
  .then(processPaymentStep)
  .commit();
