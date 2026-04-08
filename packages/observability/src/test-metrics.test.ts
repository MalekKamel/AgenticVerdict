import { describe, expect, it } from "vitest";

import {
  productionFlowTestRegistry,
  recordVerdictParseAttempt,
  recordVerdictParseDegraded,
  recordVerdictParseFailureField,
  recordScenarioAssertion,
  recordScenarioDurationSeconds,
  recordWorkflowTriggerEnqueued,
  recordWorkflowTriggerJobFinished,
  renderProductionFlowTestMetrics,
} from "./test-metrics";

describe("production-flow test metrics", () => {
  it("exposes histogram and counter samples after recording", async () => {
    productionFlowTestRegistry.resetMetrics();
    recordWorkflowTriggerEnqueued("report-generation", "aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee");
    recordWorkflowTriggerJobFinished({
      workflowId: "report-generation",
      tenantId: "aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee",
      status: "completed",
      durationSeconds: 0.012,
    });
    recordScenarioDurationSeconds({
      scenarioId: "R01",
      category: "generation",
      status: "passed",
      durationSeconds: 1.5,
    });
    recordScenarioAssertion({
      scenarioId: "R01",
      assertionType: "status",
      result: "passed",
    });
    recordVerdictParseAttempt("report-generation", "aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee");
    recordVerdictParseDegraded({
      workflowId: "report-generation",
      tenantId: "aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee",
      failureKind: "schema",
    });
    recordVerdictParseFailureField({
      workflowId: "report-generation",
      tenantId: "aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee",
      failureKind: "schema",
      field: "sentiment",
    });
    const text = await renderProductionFlowTestMetrics();
    expect(text).toContain("test_workflow_trigger_enqueued_total");
    expect(text).toContain("test_workflow_trigger_completed_total");
    expect(text).toContain("test_scenario_duration_seconds");
    expect(text).toContain("test_scenario_assertions_total");
    expect(text).toContain("marketing_verdict_parse_attempts_total");
    expect(text).toContain("marketing_verdict_parse_degraded_total");
    expect(text).toContain("marketing_verdict_parse_failures_by_field_total");
  });
});
