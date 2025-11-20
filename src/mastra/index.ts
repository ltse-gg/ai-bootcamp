import { Mastra } from "@mastra/core/mastra";
import { LibSQLStore } from "@mastra/libsql";
import { PinoLogger } from "@mastra/loggers";
import { clientManagementAgent } from "./agents/client-management-agent";
import { weatherAgent } from "./agents/weather-agent";
import {
  completenessScorer,
  toolCallAppropriatenessScorer,
  translationScorer,
} from "./scorers/weather-scorer";
import {
  aiContentWorkflow,
  conditionalWorkflow,
  contentWorkflow,
  parallelAnalysisWorkflow,
} from "./workflows/content-workflow";
import { paymentWorkflow } from "./workflows/payment-workflow";
import { weatherWorkflow } from "./workflows/weather-workflow";

export const mastra = new Mastra({
  workflows: {
    weatherWorkflow,
    contentWorkflow,
    aiContentWorkflow,
    parallelAnalysisWorkflow,
    conditionalWorkflow,
    paymentWorkflow,
  },
  agents: {
    clientManagementAgent,
    weatherAgent,
    // financialAgent,
    // memoryAgent,
    // learningAssistantAgent,
  },
  scorers: { toolCallAppropriatenessScorer, completenessScorer, translationScorer },
  storage: new LibSQLStore({
    // stores observability, scores, ... into memory storage, if it needs to persist, change to file:../mastra.db
    // url: ":memory:",
    url: "file:../../mastra.db",
  }),
  logger: new PinoLogger({
    name: "Mastra",
    level: "info",
  }),
  telemetry: {
    // Telemetry is deprecated and will be removed in the Nov 4th release
    enabled: false,
  },
  observability: {
    // Enables DefaultExporter and CloudExporter for AI tracing
    default: { enabled: true },
  },
});
