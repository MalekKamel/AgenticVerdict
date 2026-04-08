/** Production-flow test orchestrator — drives workflows through the HTTP API (`/api/v1/workflows/*`). */

import {
  runProductionFlowAssertions,
  type AssertionCheckOutcome,
  type ProductionFlowAssertion,
} from "./assertions";

export type { ProductionFlowAssertion } from "./assertions";

/** Scenario ids exercised through `config.productionFlowScenarioId` (R01–R12). */
export const ORCHESTRATOR_PRODUCTION_FLOW_SCENARIO_IDS = [
  "R01",
  "R02",
  "R03",
  "R04",
  "R05",
  "R06",
  "R07",
  "R08",
  "R09",
  "R10",
  "R11",
  "R12",
] as const;

export type OrchestratorProductionFlowScenarioId =
  (typeof ORCHESTRATOR_PRODUCTION_FLOW_SCENARIO_IDS)[number];

export function isOrchestratorProductionFlowScenarioId(
  id: string,
): id is OrchestratorProductionFlowScenarioId {
  return (ORCHESTRATOR_PRODUCTION_FLOW_SCENARIO_IDS as readonly string[]).includes(id);
}

export type OrchestratorWorkflowId =
  | "report-generation"
  | "marketing-analysis"
  | "verdict-generation";

export type ScenarioCategory = "generation" | "integration" | "delivery" | "scheduling" | "system";

export type MockDataScenario = "normal" | "high-volume" | "zero-conversions" | "error";

export interface ScenarioConfig {
  readonly id: string;
  readonly name: string;
  readonly category: ScenarioCategory;
  readonly workflow: OrchestratorWorkflowId;
  readonly tenantId: string;
  readonly mockData: {
    readonly scenario: MockDataScenario;
    readonly seed: number;
  };
}

export interface LogEntry {
  readonly level: string;
  readonly message: string;
  readonly timestamp?: string;
}

export interface Artifact {
  readonly type: "pdf" | "docx" | "xlsx" | "url" | "other";
  readonly ref: string;
}

export interface TestResult {
  readonly executionId: string;
  readonly status: "completed" | "failed";
  readonly durationMs: number;
  readonly metrics: Record<string, number>;
  readonly logs: LogEntry[];
  readonly artifacts: Artifact[];
  readonly errors?: ReadonlyArray<{ readonly message: string }>;
  readonly rawStatus?: WorkflowStatusResponse;
}

/** Response shape of `GET /api/v1/test/results/:executionId` (Phase 2). */
export interface TestResultsApiResponse {
  readonly executionId: string;
  readonly status: "completed" | "failed" | "running";
  readonly bullmqState: string;
  readonly workflowStatus: string;
  readonly durationMs?: number;
  readonly queuedAtMs?: number;
  readonly startedAtMs?: number;
  readonly finishedAtMs?: number;
  readonly metrics: {
    readonly llmCalls: number;
    readonly llmDurationMs: number;
    readonly platformFetchCount: number;
    readonly platformFetchDurationMs: number;
    readonly reportGenerationDurationMs: number;
  };
  readonly logs: LogEntry[];
  readonly result?: unknown;
  readonly errors?: ReadonlyArray<{ readonly message: string }>;
}

export interface WorkflowTriggerRequest {
  readonly workflowId: OrchestratorWorkflowId;
  readonly testMode: true;
  readonly tenantId: string;
  readonly config: {
    readonly dateRange?: { start: string; end: string };
    readonly platforms?: string[];
    readonly mockData?: { scenario: MockDataScenario; seed: number };
    readonly productionFlowScenarioId?: OrchestratorProductionFlowScenarioId;
  };
}

export interface WorkflowTriggerResponse {
  readonly executionId: string;
  readonly status: "queued";
  readonly startedAt: string;
  readonly estimatedCompletion: string;
}

export interface WorkflowStatusResponse {
  readonly executionId: string;
  readonly status: string;
  readonly bullmqState: string;
  readonly result?: {
    readonly workflowId: string;
    readonly tenantId: string;
    readonly testMode: boolean;
    readonly phase?: string;
    readonly message?: string;
    readonly productionFlowScenarioId?: string;
    readonly reportGenerationDurationMs?: number;
    readonly pdfByteLength?: number;
    readonly pdfValidation?: {
      readonly minBytesOk?: boolean;
      readonly mustContainPhrasesOk?: boolean;
      readonly arabicScriptOk?: boolean;
      readonly shellDir?: string;
      readonly shellLang?: string;
    };
  };
  readonly error?: string;
}

export interface TestOrchestratorOptions {
  /** Issued by the API (`admin` role) — production-flow triggers are admin-gated in Phase 1. */
  readonly getAccessToken: () => Promise<string> | string;
  /** e.g. `http://mock-platform-server:3001` from Docker Compose */
  readonly mockPlatformBaseUrl?: string;
  readonly pollIntervalMs?: number;
  /**
   * When true (default), POST scenario telemetry after {@link TestOrchestrator.executeScenario}
   * so Prometheus histograms update (`test_scenario_duration_seconds`).
   */
  readonly telemetryEnabled?: boolean;
}

function trimTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

export class TestOrchestrator {
  constructor(
    private readonly apiBaseUrl: string,
    private readonly options: TestOrchestratorOptions,
  ) {}

  /** GET `/health` on the mock platform server when `mockPlatformBaseUrl` is set. */
  async checkMockPlatformHealth(): Promise<boolean> {
    const base = this.options.mockPlatformBaseUrl?.trim();
    if (!base) {
      return true;
    }
    try {
      const res = await fetch(`${trimTrailingSlash(base)}/health`);
      return res.ok;
    } catch {
      return false;
    }
  }

  async triggerWorkflow(body: WorkflowTriggerRequest): Promise<WorkflowTriggerResponse> {
    const token = await Promise.resolve(this.options.getAccessToken());
    const res = await fetch(`${trimTrailingSlash(this.apiBaseUrl)}/api/v1/workflows/trigger`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const json = (await res.json()) as unknown;
    if (!res.ok) {
      const errMsg =
        json && typeof json === "object" && "error" in json
          ? JSON.stringify((json as { error: unknown }).error)
          : res.statusText;
      throw new Error(`workflow_trigger_failed:${res.status}:${errMsg}`);
    }
    return json as WorkflowTriggerResponse;
  }

  /** `GET /api/v1/test/results/:executionId` — merges queue timing and placeholder pipeline metrics. */
  async getTestResults(executionId: string): Promise<TestResultsApiResponse> {
    const token = await Promise.resolve(this.options.getAccessToken());
    const res = await fetch(
      `${trimTrailingSlash(this.apiBaseUrl)}/api/v1/test/results/${encodeURIComponent(executionId)}`,
      { headers: { authorization: `Bearer ${token}` } },
    );
    const json = (await res.json()) as unknown;
    if (!res.ok) {
      const errMsg =
        json && typeof json === "object" && "error" in json
          ? JSON.stringify((json as { error: unknown }).error)
          : res.statusText;
      throw new Error(`test_results_failed:${res.status}:${errMsg}`);
    }
    return json as TestResultsApiResponse;
  }

  async getWorkflowStatus(executionId: string): Promise<WorkflowStatusResponse> {
    const token = await Promise.resolve(this.options.getAccessToken());
    const res = await fetch(
      `${trimTrailingSlash(this.apiBaseUrl)}/api/v1/workflows/status/${encodeURIComponent(executionId)}`,
      { headers: { authorization: `Bearer ${token}` } },
    );
    const json = (await res.json()) as unknown;
    if (!res.ok) {
      const errMsg =
        json && typeof json === "object" && "error" in json
          ? JSON.stringify((json as { error: unknown }).error)
          : res.statusText;
      throw new Error(`workflow_status_failed:${res.status}:${errMsg}`);
    }
    return json as WorkflowStatusResponse;
  }

  async pollUntilWorkflowSettles(
    executionId: string,
    timeoutMs: number,
  ): Promise<WorkflowStatusResponse> {
    const interval = this.options.pollIntervalMs ?? 250;
    const deadline = Date.now() + timeoutMs;
    let last: WorkflowStatusResponse | undefined;
    while (Date.now() < deadline) {
      last = await this.getWorkflowStatus(executionId);
      if (last.status === "completed" || last.status === "failed") {
        return last;
      }
      await new Promise((r) => setTimeout(r, interval));
    }
    throw new Error(`workflow_poll_timeout:${executionId}:${last?.bullmqState ?? "no_response"}`);
  }

  /**
   * End-to-end: trigger + poll. Phase 1 maps BullMQ completion to {@link TestResult};
   * Phase 2 enriches from the test-results API and posts scenario telemetry for Prometheus.
   */
  async executeScenario(scenario: ScenarioConfig, timeoutMs: number): Promise<TestResult> {
    const started = Date.now();
    const productionFlowScenarioId = isOrchestratorProductionFlowScenarioId(scenario.id)
      ? scenario.id
      : undefined;
    const triggered = await this.triggerWorkflow({
      workflowId: scenario.workflow,
      testMode: true,
      tenantId: scenario.tenantId,
      config: {
        mockData: {
          scenario: scenario.mockData.scenario,
          seed: scenario.mockData.seed,
        },
        ...(productionFlowScenarioId !== undefined ? { productionFlowScenarioId } : {}),
      },
    });
    const final = await this.pollUntilWorkflowSettles(triggered.executionId, timeoutMs);
    const durationMs = Date.now() - started;
    const status: "completed" | "failed" = final.status === "completed" ? "completed" : "failed";

    let metrics: Record<string, number> = {};
    let logs: LogEntry[] = [];
    let errors: TestResult["errors"];
    try {
      const detail = await this.getTestResults(triggered.executionId);
      metrics = {
        queueDurationMs: detail.durationMs ?? 0,
        llmCalls: detail.metrics.llmCalls,
        llmDurationMs: detail.metrics.llmDurationMs,
        platformFetchCount: detail.metrics.platformFetchCount,
        platformFetchDurationMs: detail.metrics.platformFetchDurationMs,
        reportGenerationDurationMs: detail.metrics.reportGenerationDurationMs,
      };
      logs = [...detail.logs];
      errors = detail.errors;
    } catch {
      /* enrichment is optional when the test-results route is unavailable */
    }

    if (this.options.telemetryEnabled !== false) {
      try {
        const token = await Promise.resolve(this.options.getAccessToken());
        const outcome = status === "completed" ? "passed" : "failed";
        const res = await fetch(
          `${trimTrailingSlash(this.apiBaseUrl)}/api/v1/test/telemetry/scenario`,
          {
            method: "POST",
            headers: {
              authorization: `Bearer ${token}`,
              "content-type": "application/json",
            },
            body: JSON.stringify({
              scenarioId: scenario.id,
              category: scenario.category,
              outcome,
              durationSeconds: durationMs / 1000,
            }),
          },
        );
        if (!res.ok && res.status !== 204) {
          throw new Error(`telemetry_scenario_failed:${res.status}`);
        }
      } catch {
        /* telemetry must not fail the scenario */
      }
    }

    return {
      executionId: triggered.executionId,
      status,
      durationMs,
      metrics,
      logs,
      artifacts: [],
      errors,
      rawStatus: final,
    };
  }

  /**
   * Runs assertion checks and optionally POSTs `/api/v1/test/telemetry/assertion` per check
   * (Prometheus `test_scenario_assertions_total`).
   */
  async validateProductionFlowAssertions(
    scenarioId: string,
    result: TestResult,
    assertions: ReadonlyArray<ProductionFlowAssertion>,
  ): Promise<{ readonly allPassed: boolean; readonly outcomes: AssertionCheckOutcome[] }> {
    const postAssertionTelemetry =
      this.options.telemetryEnabled === false
        ? undefined
        : async (input: {
            readonly scenarioId: string;
            readonly assertionType: string;
            readonly result: "passed" | "failed";
          }) => {
            try {
              const token = await Promise.resolve(this.options.getAccessToken());
              const res = await fetch(
                `${trimTrailingSlash(this.apiBaseUrl)}/api/v1/test/telemetry/assertion`,
                {
                  method: "POST",
                  headers: {
                    authorization: `Bearer ${token}`,
                    "content-type": "application/json",
                  },
                  body: JSON.stringify({
                    scenarioId: input.scenarioId,
                    assertionType: input.assertionType,
                    result: input.result,
                  }),
                },
              );
              if (!res.ok && res.status !== 204) {
                throw new Error(`telemetry_assertion_failed:${res.status}`);
              }
            } catch {
              /* non-fatal */
            }
          };
    return runProductionFlowAssertions(scenarioId, result, assertions, {
      postAssertionTelemetry,
    });
  }
}
