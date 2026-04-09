import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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
        tenantId: "aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee",
        config: { mockData: { scenario: "normal", seed: 42_001 } },
        requestId: "req-1",
      }),
    ).resolves.toEqual({
      workflowId: "report-generation",
      tenantId: "aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee",
      testMode: true,
      phase: "foundation",
      message: "workflow_trigger_acknowledged",
    });
    expect(runProductionFlowScenario).not.toHaveBeenCalled();
  });

  it("delegates R01 production-flow to runProductionFlowScenario", async () => {
    const pdfResult = {
      workflowId: "report-generation" as const,
      tenantId: "aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee",
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
      tenantId: "aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee",
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
      tenantId: "aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee",
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
      tenantId: "aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee",
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
      tenantId: "aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee",
      config: {
        platforms: ["linkedin"],
      },
      requestId: "req-mkt-disabled-platform",
    });
    expect(result.message).toBe("marketing-analysis_platform_validation_failed");
    expect(result.processingMetadata?.pipelineStatus).toBe("failed");
    expect(result.processingMetadata?.errorCode).toBe("platform_fetch_failed");
    expect(result.processingMetadata?.stagesCompleted).toBe(0);
  });

  it("marks delivery_queue_failed when workflow delivery is enabled but send fails", async () => {
    const result = await defaultWorkflowTriggerProcessor({
      workflowId: "verdict-generation",
      testMode: true,
      tenantId: "aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee",
      config: {
        deliveryEnabled: true,
        recipientEmail: "ops@example.test",
        outputFormat: "pdf",
      },
      requestId: "req-vrd-delivery-1",
    });
    expect(result.message).toContain("delivery_issue");
    expect(result.processingMetadata?.errorCode).toBe("delivery_queue_failed");
    expect(result.processingMetadata?.partialFailure).toBe(true);
  });
});

describe("defaultReportGenerationProcessor", () => {
  beforeEach(() => {
    process.env.AGENTICVERDICT_USE_STUB_FORMAT_GENERATORS = "1";
  });

  afterEach(() => {
    delete process.env.AGENTICVERDICT_USE_STUB_FORMAT_GENERATORS;
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
