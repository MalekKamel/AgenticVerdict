#!/usr/bin/env node
/**
 * Live LLM Verdict Generator
 *
 * Executes the marketing pipeline with production LLM (GLM) to capture
 * the full MarketingVerdict JSON response.
 */

import { randomUUID } from "node:crypto";

import { createTestTenantConfig } from "../packages/testing/src/create-test-tenant-config.ts";
import { TEST_TENANT_ALPHA } from "../packages/testing/src/tenant-ids.ts";
import { AgentFactory } from "../packages/agent-runtime/src/agent-factory.ts";
import { runAgentJob } from "../packages/agent-runtime/src/agent-job.ts";
import { runMarketingAgentPipeline } from "../packages/agent-runtime/src/marketing-pipeline.ts";
import { parseAgentLlmEnv } from "../packages/agent-runtime/src/llm-env.ts";

const LOG_DIR = "test-output";

function log(message: string): void {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${message}`;
  console.log(line);
}

function logSection(title: string): void {
  const border = "=".repeat(80);
  log("");
  log(border);
  log(`  ${title}`);
  log(border);
}

function logJson(label: string, data: unknown): void {
  log(`${label}:`);
  console.log(JSON.stringify(data, null, 2));
}

async function main() {
  logSection("LIVE LLM VERDICT GENERATOR");
  log("Starting marketing pipeline execution with live GLM LLM...");

  const llmEnv = parseAgentLlmEnv(process.env);
  log("LLM Configuration:");
  log(`  GLM Model: ${llmEnv.glmModel || "glm-4.7 (default)"}`);
  log(`  GLM API Base URL: ${llmEnv.glmApiBaseUrl || "NOT SET"}`);
  log(`  GLM API Key: ${llmEnv.glmApiKey ? "***SET***" : "NOT SET"}`);
  log(`  Live LLM Enabled: ${process.env.AGENT_RUNTIME_LIVE_LLM === "1" ? "YES" : "NO"}`);
  log(`  Verbose Logging: ${process.env.SCENARIO_VERBOSE_LLM === "1" ? "YES" : "NO"}`);

  if (!llmEnv.glmApiKey || !llmEnv.glmApiBaseUrl) {
    throw new Error("GLM_API_KEY and GLM_API_BASE_URL must be set");
  }

  const factory = new AgentFactory({ llmEnv });

  const tenant = {
    tenantId: TEST_TENANT_ALPHA,
    requestId: `req-live-${randomUUID()}`,
    config: createTestTenantConfig({
      tenantId: TEST_TENANT_ALPHA,
      tenantName: "Live LLM Test Tenant",
    }),
  };

  const workflowId = randomUUID();
  const goal = `PIPELINE_E2E_MARKER: Analyze marketing performance for Masafh GPS fleet tracking tenant.

Context:
- Tenant: Masafh (Riyadh-based B2B GPS fleet tracking)
- Target Period: Last 30 days
- Platforms: Meta Ads, GA4, GSC, GBP, TikTok
- Key Metrics: CTR, CPC, Conversions, ROAS, Engagement

Provide:
1) Cross-platform performance analysis
2) Key insights and anomalies
3) Actionable recommendations
4) Overall health verdict (0-100 score)`;

  logSection("PIPELINE EXECUTION");
  log(`Workflow ID: ${workflowId}`);
  log(`Goal: ${goal.substring(0, 100)}...`);

  const stageOutputs: Array<{
    stage: string;
    durationMs: number;
    steps: Array<{ name: string; tool?: string }>;
    answer: string;
  }> = [];
  const messages: Array<{ from: string; to: string; type: string }> = [];

  const state = await runAgentJob({ tenant, runId: `run-live-${randomUUID()}` }, async (scope) =>
    runMarketingAgentPipeline({
      factory,
      ctx: scope.invocation,
      goal,
      workflowId,
      specialization: {
        tenantName: "Masafh",
        promptVars: {
          currency: "SAR",
          region: "SA",
        },
      },
      useProductionModels: true,
      tolerateVerdictParseFailure: true,
      onProgress: (event) => {
        log(
          `Progress: Stage ${event.stage} (${event.index + 1}/${event.total}) - ${event.percent}%`,
        );
      },
      onMessage: (msg) => {
        messages.push({
          from: msg.from,
          to: msg.to,
          type: msg.type,
        });
        log(`Message: ${msg.from} → ${msg.to} (${msg.type})`);
      },
    }),
  );

  logSection("EXECUTION RESULTS");
  logJson("Pipeline Status", state.status);
  logJson("Total Stages", state.stages.length);
  logJson("Workflow ID", state.workflowId);

  for (const stage of state.stages) {
    logSection(`STAGE: ${stage.stage.toUpperCase()}`);
    log(`Duration: ${stage.durationMs}ms`);
    log(`Steps: ${stage.result.steps.length}`);
    log(`Answer Length: ${stage.result.answer.length} chars`);

    const preview = stage.result.answer.slice(0, 500);
    log(`Answer Preview: ${preview}${stage.result.answer.length > 500 ? "..." : ""}`);

    stageOutputs.push({
      stage: stage.stage,
      durationMs: stage.durationMs,
      steps: stage.result.steps.map((s) => ({ name: s.name, tool: s.tool })),
      answer: stage.result.answer,
    });
  }

  if (state.verdict) {
    logSection("VERDICT (PARSED MarketingVerdict)");
    logJson("Full Verdict Object", state.verdict);
  }

  if (state.verdictRawAnswer) {
    logSection("RAW LLM VERDICT RESPONSE");
    log("Raw answer from LLM (failed to parse as MarketingVerdict):");
    log(state.verdictRawAnswer);
  }

  if (state.provenance) {
    logSection("PROVENANCE");
    logJson("Provenance Info", {
      analysisId: state.provenance.analysisId,
      agentVersion: state.provenance.agentVersion,
      modelUsed: state.provenance.modelUsed,
      transformationCount: state.provenance.transformations.length,
      dataSourceCount: state.provenance.dataSources.length,
    });
  }

  if (state.error) {
    logSection("ERROR");
    logJson("Error Details", state.error);
  }

  logSection("SUMMARY");
  log(`Status: ${state.status}`);
  log(`Stages Completed: ${state.stages.length}/3`);
  log(`Verdict Generated: ${state.verdict ? "YES" : "NO"}`);
  log(`Raw Answer Available: ${state.verdictRawAnswer ? "YES" : "NO"}`);

  if (state.verdict) {
    log("\n=== VERDICT HIGHLIGHTS ===");
    log(`Score: ${state.verdict.score}/100`);
    log(`Sentiment: ${state.verdict.sentiment}`);
    log(`Confidence: ${state.verdict.confidence}`);
    log(`Verdict Type: ${state.verdict.verdictType}`);
    log(`\nSummary:\n${state.verdict.summary}`);
  }

  const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const LOG_FILE = `${LOG_DIR}/live-llm-verdict-${TIMESTAMP}.json`;
  const fullOutput = {
    timestamp: new Date().toISOString(),
    workflowId,
    status: state.status,
    llmConfig: {
      model: llmEnv.glmModel || "glm-4.7",
      apiUrl: llmEnv.glmApiBaseUrl,
    },
    stages: stageOutputs,
    verdict: state.verdict,
    verdictRawAnswer: state.verdictRawAnswer,
    provenance: state.provenance,
    messages,
    error: state.error,
  };

  await import("node:fs").then((fs) =>
    fs.writeFileSync(LOG_FILE, JSON.stringify(fullOutput, null, 2)),
  );
  log(`\nFull output written to: ${LOG_FILE}`);

  return state;
}

main().catch((error: unknown) => {
  logSection("FATAL ERROR");
  if (error instanceof Error) {
    log(error.stack || error.message);
  } else {
    log(String(error));
  }
  process.exit(1);
});
