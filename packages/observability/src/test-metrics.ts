import { Counter, Histogram } from "prom-client";

import { productionFlowTestRegistry } from "./registry";

const scenarioDurationSeconds = new Histogram({
  name: "test_scenario_duration_seconds",
  help: "Production-flow test scenario duration (end-to-end or orchestrator-reported)",
  labelNames: ["scenario_id", "category", "status"],
  buckets: [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30, 60, 120, 300],
  registers: [productionFlowTestRegistry],
});

const scenarioAssertionsTotal = new Counter({
  name: "test_scenario_assertions_total",
  help: "Assertions evaluated during production-flow scenarios",
  labelNames: ["scenario_id", "assertion_type", "result"],
  registers: [productionFlowTestRegistry],
});

const workflowLlmCallsTotal = new Counter({
  name: "test_workflow_llm_calls_total",
  help: "LLM calls during test workflows (incremented when wired in agent runtime)",
  labelNames: ["workflow_id", "tenant_id"],
  registers: [productionFlowTestRegistry],
});

const workflowPlatformFetchesTotal = new Counter({
  name: "test_workflow_platform_fetches_total",
  help: "Platform adapter fetches during test workflows",
  labelNames: ["platform", "tenant_id"],
  registers: [productionFlowTestRegistry],
});

const reportGenerationDurationSeconds = new Histogram({
  name: "test_report_generation_duration_seconds",
  help: "Report generation duration during test workflows",
  labelNames: ["report_type", "tenant_id"],
  buckets: [0.1, 0.5, 1, 2, 5, 15, 30, 60, 120, 300],
  registers: [productionFlowTestRegistry],
});

/** API: workflow trigger accepted and enqueued to BullMQ */
const workflowTriggerEnqueuedTotal = new Counter({
  name: "test_workflow_trigger_enqueued_total",
  help: "Workflow trigger jobs enqueued (production-flow testing)",
  labelNames: ["workflow_id", "tenant_id"],
  registers: [productionFlowTestRegistry],
});

/** Worker: workflow trigger job finished (completed or failed) */
const workflowTriggerJobDurationSeconds = new Histogram({
  name: "test_workflow_trigger_job_duration_seconds",
  help: "BullMQ workflow-trigger job processing time",
  labelNames: ["workflow_id", "tenant_id", "status"],
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [productionFlowTestRegistry],
});

const workflowTriggerCompletedTotal = new Counter({
  name: "test_workflow_trigger_completed_total",
  help: "Workflow trigger jobs completed or failed",
  labelNames: ["workflow_id", "tenant_id", "status"],
  registers: [productionFlowTestRegistry],
});

const verdictParseAttemptsTotal = new Counter({
  name: "marketing_verdict_parse_attempts_total",
  help: "Total verdict parse attempts in marketing pipeline",
  labelNames: ["workflow_id", "tenant_id"],
  registers: [productionFlowTestRegistry],
});

const verdictParseDegradedTotal = new Counter({
  name: "marketing_verdict_parse_degraded_total",
  help: "Verdict parse failures that downgraded pipeline status to degraded",
  labelNames: ["workflow_id", "tenant_id", "failure_kind"],
  registers: [productionFlowTestRegistry],
});

const verdictParseFailuresByFieldTotal = new Counter({
  name: "marketing_verdict_parse_failures_by_field_total",
  help: "Verdict parse schema failures by failing field path",
  labelNames: ["workflow_id", "tenant_id", "failure_kind", "field"],
  registers: [productionFlowTestRegistry],
});

export type ScenarioOutcomeLabel = "passed" | "failed";

export function recordScenarioDurationSeconds(input: {
  scenarioId: string;
  category: string;
  status: ScenarioOutcomeLabel;
  durationSeconds: number;
}): void {
  scenarioDurationSeconds.observe(
    {
      scenario_id: input.scenarioId,
      category: input.category,
      status: input.status,
    },
    input.durationSeconds,
  );
}

export function recordScenarioAssertion(input: {
  scenarioId: string;
  assertionType: string;
  result: "passed" | "failed";
}): void {
  scenarioAssertionsTotal.inc({
    scenario_id: input.scenarioId,
    assertion_type: input.assertionType,
    result: input.result,
  });
}

export function recordWorkflowLlmCall(workflowId: string, tenantId: string): void {
  workflowLlmCallsTotal.inc({ workflow_id: workflowId, tenant_id: tenantId });
}

export function recordWorkflowPlatformFetch(platform: string, tenantId: string): void {
  workflowPlatformFetchesTotal.inc({ platform, tenant_id: tenantId });
}

export function recordReportGenerationDurationSeconds(input: {
  reportType: string;
  tenantId: string;
  durationSeconds: number;
}): void {
  reportGenerationDurationSeconds.observe(
    { report_type: input.reportType, tenant_id: input.tenantId },
    input.durationSeconds,
  );
}

export function recordWorkflowTriggerEnqueued(workflowId: string, tenantId: string): void {
  workflowTriggerEnqueuedTotal.inc({ workflow_id: workflowId, tenant_id: tenantId });
}

export function recordWorkflowTriggerJobFinished(input: {
  workflowId: string;
  tenantId: string;
  status: "completed" | "failed";
  durationSeconds: number;
}): void {
  workflowTriggerCompletedTotal.inc({
    workflow_id: input.workflowId,
    tenant_id: input.tenantId,
    status: input.status,
  });
  workflowTriggerJobDurationSeconds.observe(
    {
      workflow_id: input.workflowId,
      tenant_id: input.tenantId,
      status: input.status,
    },
    input.durationSeconds,
  );
}

export function recordVerdictParseAttempt(workflowId: string, tenantId: string): void {
  verdictParseAttemptsTotal.inc({ workflow_id: workflowId, tenant_id: tenantId });
}

export function recordVerdictParseDegraded(input: {
  workflowId: string;
  tenantId: string;
  failureKind: "json" | "schema" | "unknown";
}): void {
  verdictParseDegradedTotal.inc({
    workflow_id: input.workflowId,
    tenant_id: input.tenantId,
    failure_kind: input.failureKind,
  });
}

export function recordVerdictParseFailureField(input: {
  workflowId: string;
  tenantId: string;
  failureKind: "json" | "schema" | "unknown";
  field: string;
}): void {
  verdictParseFailuresByFieldTotal.inc({
    workflow_id: input.workflowId,
    tenant_id: input.tenantId,
    failure_kind: input.failureKind,
    field: input.field,
  });
}

/** Prometheus text exposition for this registry (API or worker `/metrics`). */
export async function renderProductionFlowTestMetrics(): Promise<string> {
  return productionFlowTestRegistry.metrics();
}
