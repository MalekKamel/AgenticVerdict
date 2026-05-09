import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@agenticverdict/agent-runtime", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@agenticverdict/agent-runtime")>();
  return {
    ...actual,
    runIntelligencePipeline: vi.fn().mockResolvedValue({
      workflowId: "00000000-0000-4000-8000-000000000001",
      status: "completed",
      stages: [],
      structuredResults: {
        insights: {
          insights: [
            {
              id: "00000000-0000-4000-8000-000000000002",
              type: "observation",
              title: "Test insight",
              description: "Test description",
              confidence: 0.85,
              impact: "medium",
              platforms: ["meta", "ga4"],
              metrics: ["roas"],
            },
          ],
        },
      },
    }),
    runAgentJob: vi.fn().mockImplementation((_opts, work) => work({ invocation: {} })),
  };
});

vi.mock("../tenant/worker-tenant-als", () => ({
  loadTenantConfigForJob: vi.fn().mockResolvedValue({
    tenantName: "test-tenant",
    localization: { locale: "en", timezone: "UTC" },
    marketing: { channels: [], kpis: [] },
  }),
  runWorkerJobWithTenantContext: vi.fn().mockImplementation(({ work }) => work()),
}));

vi.mock("../connector-factory", () => ({
  createWorkerPlatformFetchToolDeps: vi.fn().mockReturnValue({
    getAdapter: vi.fn(),
  }),
  getEnabledTenantConnectors: vi.fn().mockReturnValue(["meta", "ga4", "gsc"]),
  toConnectorType: vi.fn().mockImplementation((name) => {
    const valid = ["meta", "ga4", "gsc", "tiktok", "google-ads"];
    return valid.includes(name) ? name : null;
  }),
}));

vi.mock("@agenticverdict/core", () => ({
  buildTenantContextForJob: vi.fn().mockReturnValue({
    tenantId: "00000000-0000-4000-8000-000000000010",
    config: {
      tenantName: "test-tenant",
      localization: { locale: "en", timezone: "UTC" },
      marketing: { channels: [], kpis: [] },
    },
  }),
}));

vi.mock("../services/email", () => ({
  sendReportEmail: vi.fn().mockResolvedValue({ success: false, error: "delivery_failed" }),
}));

vi.mock("./workflow-trigger-production-flow", () => ({
  runProductionFlowScenario: vi.fn(),
}));

import { runProductionFlowScenario } from "./workflow-trigger-production-flow";
import { defaultReportGenerationProcessor, defaultWorkflowTriggerProcessor } from "./report-queues";

describe("defaultWorkflowTriggerProcessor", () => {
  beforeEach(() => {
    vi.mocked(runProductionFlowScenario).mockReset();
  });

  it("returns a foundation acknowledgement payload", async () => {
    await expect(
      defaultWorkflowTriggerProcessor({
        workflowId: "report-generation",
        testMode: true,
        tenantId: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
        config: { mockData: { scenario: "normal", seed: 42_001 } },
        requestId: "req-1",
      }),
    ).resolves.toEqual({
      workflowId: "report-generation",
      tenantId: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
      testMode: true,
      phase: "foundation",
      message: "workflow_trigger_acknowledged",
    });
    expect(runProductionFlowScenario).not.toHaveBeenCalled();
  });

  it("delegates R01 production-flow to runProductionFlowScenario", async () => {
    const pdfResult = {
      workflowId: "report-generation" as const,
      tenantId: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
      testMode: true,
      phase: "report-generation" as const,
      message: "production_flow_pdf_ok",
      productionFlowScenarioId: "R01" as const,
      reportGenerationDurationMs: 42,
      pdfByteLength: 900,
      pdfValidation: {
        minBytesOk: true,
        shellDir: "ltr" as const,
        shellLang: "en",
        mustContainPhrasesOk: true,
        arabicScriptOk: false,
      },
    };
    vi.mocked(runProductionFlowScenario).mockResolvedValue(pdfResult);
    const payload = {
      workflowId: "report-generation" as const,
      testMode: true,
      tenantId: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
      config: {
        mockData: { scenario: "normal" as const, seed: 42_001 },
        productionFlowScenarioId: "R01" as const,
      },
    };
    await expect(defaultWorkflowTriggerProcessor(payload)).resolves.toEqual(pdfResult);
    expect(runProductionFlowScenario).toHaveBeenCalledWith(payload);
  });

  it("runs marketing-analysis through pipeline workflow processor", async () => {
    const result = await defaultWorkflowTriggerProcessor({
      workflowId: "marketing-analysis",
      testMode: true,
      tenantId: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
      config: {
        dateRange: { start: "2026-03-01T00:00:00.000Z", end: "2026-03-31T23:59:59.000Z" },
        platforms: ["meta", "ga4"],
        analysisDepth: "standard",
      },
      requestId: "req-mkt-1",
    });

    expect(result.phase).toBe("marketing-analysis");
    expect(result.message).toBe("marketing-analysis_processed");
    expect(result.insights?.length).toBeGreaterThan(0);
    expect(result.processingMetadata?.platformsAnalyzed).toEqual(["meta", "ga4"]);
  });

  it("runs verdict-generation through pipeline workflow processor", async () => {
    const result = await defaultWorkflowTriggerProcessor({
      workflowId: "verdict-generation",
      testMode: true,
      tenantId: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
      config: {
        dateRange: { start: "2026-03-01T00:00:00.000Z", end: "2026-03-31T23:59:59.000Z" },
        platforms: ["meta", "ga4", "gsc"],
        verdictDepth: "quick",
        outputFormat: "pdf",
      },
      requestId: "req-vrd-1",
    });

    expect(result.phase).toBe("verdict-generation");
    expect(result.message).toBe("verdict-generation_processed");
    expect(result.processingMetadata?.verdictDepth).toBe("quick");
    expect(result.processingMetadata?.outputFormat).toBe("pdf");
  });

  it("fails early when requested platform is invalid", async () => {
    const result = await defaultWorkflowTriggerProcessor({
      workflowId: "marketing-analysis",
      testMode: true,
      tenantId: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
      config: {
        platforms: ["linkedin"],
      },
      requestId: "req-mkt-disabled-platform",
    });
    expect(result.message).toBe("marketing-analysis_platform_validation_failed");
    expect(result.processingMetadata?.pipelineStatus).toBe("failed");
    expect(result.processingMetadata?.errorCode).toBe("CONNECTOR_UPSTREAM_FAILURE");
    expect(result.processingMetadata?.stagesCompleted).toBe(0);
  });

  it("marks QUEUE_JOB_FAILED when workflow delivery is enabled but send fails", async () => {
    const result = await defaultWorkflowTriggerProcessor({
      workflowId: "verdict-generation",
      testMode: true,
      tenantId: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
      config: {
        deliveryEnabled: true,
        recipientEmail: "ops@example.test",
        outputFormat: "pdf",
      },
      requestId: "req-vrd-delivery-1",
    });
    expect(result.message).toContain("delivery_issue");
    expect(result.processingMetadata?.errorCode).toBe("QUEUE_JOB_FAILED");
    expect(result.processingMetadata?.partialFailure).toBe(true);
  });
});

describe("defaultReportGenerationProcessor", () => {
  beforeEach(() => {
    process.env.AGENTICVERDICT_STUB_REPORT_FORMATS = "1";
  });

  afterEach(() => {
    delete process.env.AGENTICVERDICT_STUB_REPORT_FORMATS;
  });

  it("runs stub pipeline without throwing", async () => {
    await expect(
      defaultReportGenerationProcessor({
        tenantId: "t",
        reportId: "r",
        format: "pdf",
        templateId: "tpl",
        model: { x: 1 },
      }),
    ).resolves.toBeUndefined();
  });

  it("merges phase2 payloads without throwing (invalid data surfaces as integration warnings in HTML)", async () => {
    await expect(
      defaultReportGenerationProcessor({
        tenantId: "t",
        reportId: "r",
        format: "pdf",
        templateId: "executive-summary",
        model: { title: "Job preview" },
        phase2: { verdict: { not: "a verdict" }, insights: [] },
      }),
    ).resolves.toBeUndefined();
  });
});
