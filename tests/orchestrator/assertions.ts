/** Minimal shape from {@link import("./index.js").TestResult TestResult} (avoids circular imports). */
export interface AssertionTestResult {
  readonly status: "completed" | "failed";
  readonly metrics: Record<string, number>;
  readonly rawStatus?: {
    readonly result?: unknown;
  };
}

export type ProductionFlowAssertion =
  | { readonly type: "workflow_completed" }
  | {
      readonly type: "metric_minimum";
      readonly metric: "reportGenerationDurationMs";
      readonly min: number;
    }
  | {
      readonly type: "job_result_field_minimum";
      readonly field: "pdfByteLength";
      readonly min: number;
    }
  | {
      readonly type: "pdf_validation_flag";
      readonly key: "minBytesOk" | "mustContainPhrasesOk" | "arabicScriptOk";
      readonly expected: boolean;
    }
  | { readonly type: "job_result_message_equals"; readonly value: string }
  | {
      readonly type: "job_result_evidence";
      readonly key: string;
      readonly expected: boolean | number | string;
    };

export interface AssertionCheckOutcome {
  readonly assertion: ProductionFlowAssertion;
  readonly passed: boolean;
  readonly message: string;
}

function workflowJobResult(result: TestResult): Record<string, unknown> | undefined {
  const raw = result.rawStatus?.result;
  if (!raw || typeof raw !== "object") {
    return undefined;
  }
  return raw as Record<string, unknown>;
}

function pdfValidation(
  job: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  const v = job?.pdfValidation;
  if (!v || typeof v !== "object") {
    return undefined;
  }
  return v as Record<string, unknown>;
}

function productionFlowEvidence(
  job: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  const e = job?.productionFlowEvidence;
  if (!e || typeof e !== "object") {
    return undefined;
  }
  return e as Record<string, unknown>;
}

function evaluateAssertion(
  result: AssertionTestResult,
  a: ProductionFlowAssertion,
): AssertionCheckOutcome {
  if (a.type === "workflow_completed") {
    const passed = result.status === "completed";
    return {
      assertion: a,
      passed,
      message: passed ? "Workflow status is completed" : `Expected completed, got ${result.status}`,
    };
  }
  if (a.type === "metric_minimum") {
    const v = result.metrics[a.metric];
    const passed = typeof v === "number" && v >= a.min;
    return {
      assertion: a,
      passed,
      message: passed
        ? `${a.metric} >= ${a.min}`
        : `${a.metric} expected >= ${a.min}, got ${String(v)}`,
    };
  }
  if (a.type === "job_result_field_minimum") {
    const job = workflowJobResult(result);
    const raw = job?.[a.field];
    const n = typeof raw === "number" ? raw : Number.NaN;
    const passed = Number.isFinite(n) && n >= a.min;
    return {
      assertion: a,
      passed,
      message: passed
        ? `${a.field} >= ${a.min}`
        : `${a.field} expected >= ${a.min}, got ${String(raw)}`,
    };
  }
  if (a.type === "job_result_message_equals") {
    const job = workflowJobResult(result);
    const msg = typeof job?.message === "string" ? job.message : "";
    const passed = msg === a.value;
    return {
      assertion: a,
      passed,
      message: passed
        ? `message === ${JSON.stringify(a.value)}`
        : `message mismatch: ${JSON.stringify(msg)}`,
    };
  }
  if (a.type === "job_result_evidence") {
    const job = workflowJobResult(result);
    const ev = productionFlowEvidence(job);
    const raw = ev?.[a.key];
    const passed = raw === a.expected;
    return {
      assertion: a,
      passed,
      message: passed
        ? `productionFlowEvidence.${a.key} === ${String(a.expected)}`
        : `productionFlowEvidence.${a.key} expected ${String(a.expected)}, got ${String(raw)}`,
    };
  }
  const job = workflowJobResult(result);
  const pv = pdfValidation(job);
  const raw = pv?.[a.key];
  const passed = raw === a.expected;
  return {
    assertion: a,
    passed,
    message: passed
      ? `pdfValidation.${a.key} === ${String(a.expected)}`
      : `pdfValidation.${a.key} expected ${String(a.expected)}, got ${String(raw)}`,
  };
}

export interface RunProductionFlowAssertionsOptions {
  readonly postAssertionTelemetry?: (input: {
    readonly scenarioId: string;
    readonly assertionType: string;
    readonly result: "passed" | "failed";
  }) => Promise<void>;
}

/**
 * Evaluates production-flow assertions against a {@link TestResult} (typically after
 * {@link import("./index.js").TestOrchestrator.prototype.executeScenario executeScenario}).
 */
export async function runProductionFlowAssertions(
  scenarioId: string,
  result: AssertionTestResult,
  assertions: ReadonlyArray<ProductionFlowAssertion>,
  options?: RunProductionFlowAssertionsOptions,
): Promise<{ readonly allPassed: boolean; readonly outcomes: AssertionCheckOutcome[] }> {
  const outcomes: AssertionCheckOutcome[] = [];
  for (const assertion of assertions) {
    const o = evaluateAssertion(result, assertion);
    outcomes.push(o);
    await options?.postAssertionTelemetry?.({
      scenarioId,
      assertionType: assertion.type,
      result: o.passed ? "passed" : "failed",
    });
  }
  return { allPassed: outcomes.every((o) => o.passed), outcomes };
}
