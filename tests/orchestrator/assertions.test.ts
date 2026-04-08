import { describe, expect, it, vi } from "vitest";

import { runProductionFlowAssertions, type AssertionTestResult } from "./assertions";

describe("runProductionFlowAssertions", () => {
  it("evaluates R01-style outcomes", async () => {
    const result: AssertionTestResult = {
      status: "completed",
      metrics: { reportGenerationDurationMs: 50 },
      rawStatus: {
        result: {
          pdfByteLength: 2000,
          pdfValidation: {
            minBytesOk: true,
            mustContainPhrasesOk: true,
            arabicScriptOk: false,
          },
        },
      },
    };
    const telemetry = vi.fn();
    const { allPassed, outcomes } = await runProductionFlowAssertions(
      "R01",
      result,
      [
        { type: "workflow_completed" },
        { type: "metric_minimum", metric: "reportGenerationDurationMs", min: 1 },
        { type: "job_result_field_minimum", field: "pdfByteLength", min: 500 },
        { type: "pdf_validation_flag", key: "minBytesOk", expected: true },
        { type: "pdf_validation_flag", key: "mustContainPhrasesOk", expected: true },
      ],
      { postAssertionTelemetry: telemetry },
    );
    expect(allPassed).toBe(true);
    expect(outcomes.every((o) => o.passed)).toBe(true);
    expect(telemetry).toHaveBeenCalledTimes(5);
  });

  it("fails when pdf validation flag mismatches", async () => {
    const result: AssertionTestResult = {
      status: "completed",
      metrics: { reportGenerationDurationMs: 50 },
      rawStatus: {
        result: {
          pdfByteLength: 2000,
          pdfValidation: {
            minBytesOk: true,
            mustContainPhrasesOk: false,
            arabicScriptOk: true,
          },
        },
      },
    };
    const { allPassed, outcomes } = await runProductionFlowAssertions("R02", result, [
      { type: "pdf_validation_flag", key: "mustContainPhrasesOk", expected: true },
    ]);
    expect(allPassed).toBe(false);
    expect(outcomes[0]?.passed).toBe(false);
  });

  it("evaluates job_result_message_equals and job_result_evidence", async () => {
    const result: AssertionTestResult = {
      status: "completed",
      metrics: {},
      rawStatus: {
        result: {
          message: "production_flow_r05_ok",
          productionFlowEvidence: { mergeOk: true },
        },
      },
    };
    const { allPassed } = await runProductionFlowAssertions("R05", result, [
      { type: "job_result_message_equals", value: "production_flow_r05_ok" },
      { type: "job_result_evidence", key: "mergeOk", expected: true },
    ]);
    expect(allPassed).toBe(true);
  });
});
