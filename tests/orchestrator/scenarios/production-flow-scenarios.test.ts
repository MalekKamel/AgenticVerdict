import { describe, expect, it, vi } from "vitest";

import { type ProductionFlowAssertion, type ScenarioConfig, TestOrchestrator } from "../index";
import { PRODUCTION_FLOW_TENANT_R01 } from "./constants";
import { R01_PRODUCTION_FLOW_ASSERTIONS, R01_PRODUCTION_FLOW_SCENARIO } from "./r01-pdf-en-ltr";
import { R02_PRODUCTION_FLOW_ASSERTIONS, R02_PRODUCTION_FLOW_SCENARIO } from "./r02-pdf-ar-rtl";

function pdfJobResult(scenarioId: "R01" | "R02"): Record<string, unknown> {
  return {
    workflowId: "report-generation",
    tenantId: "t",
    testMode: true,
    phase: "report-generation",
    message: "production_flow_pdf_ok",
    productionFlowScenarioId: scenarioId,
    reportGenerationDurationMs: 80,
    pdfByteLength: 2400,
    pdfValidation: {
      minBytesOk: true,
      mustContainPhrasesOk: true,
      shellDir: scenarioId === "R01" ? "ltr" : "rtl",
      shellLang: scenarioId === "R01" ? "en" : "ar",
      arabicScriptOk: scenarioId === "R02",
    },
  };
}

function extendedJobResult(scenarioId: string): Record<string, unknown> {
  const base = {
    workflowId: "report-generation",
    tenantId: "t",
    testMode: true,
    phase: "report-generation",
    productionFlowScenarioId: scenarioId,
    reportGenerationDurationMs: 40,
  };
  switch (scenarioId) {
    case "R03":
      return {
        ...base,
        message: "production_flow_r03_ok",
        productionFlowEvidence: { enOoxmlOk: true, arOoxmlOk: true },
      };
    case "R04":
      return {
        ...base,
        message: "production_flow_r04_ok",
        productionFlowEvidence: { enXlsxBytes: 3000, arXlsxBytes: 3100 },
      };
    case "R05":
      return {
        ...base,
        message: "production_flow_r05_ok",
        productionFlowEvidence: { mergeOk: true },
      };
    case "R06":
      return {
        ...base,
        message: "production_flow_r06_ok",
        productionFlowEvidence: { mockLlmType: "agenticverdict-mock-chat", responseChars: 42 },
      };
    case "R07":
      return {
        ...base,
        message: "production_flow_r07_ok",
        productionFlowEvidence: { cacheDistinct: true, tenantContextsOk: true },
      };
    case "R08":
      return {
        ...base,
        message: "production_flow_r08_ok",
        productionFlowEvidence: { templateLandmarksOk: true, htmlChars: 1200 },
      };
    case "R09":
      return {
        ...base,
        message: "production_flow_r09_ok",
        productionFlowEvidence: { emailSuccess: true, messageId: "production_flow_email_mock" },
      };
    case "R10":
      return {
        ...base,
        message: "production_flow_r10_ok",
        productionFlowEvidence: { enqueueCount: 1 },
      };
    case "R11":
      return {
        ...base,
        message: "production_flow_r11_ok",
        productionFlowEvidence: { redisOk: true, databaseOk: true },
      };
    case "R12":
      return {
        ...base,
        message: "production_flow_r12_ok",
        productionFlowEvidence: { nodeOk: true, pnpmOk: true, nodeMajor: 20 },
      };
    default:
      return { ...base, message: "unknown" };
  }
}

function createFetchMock(scenarioId: string) {
  const execId = `job-${scenarioId}`;
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.url;
    if (url.endsWith("/api/v1/workflows/trigger")) {
      const body = JSON.parse(String(init?.body)) as {
        config?: { productionFlowScenarioId?: string };
      };
      expect(body.config?.productionFlowScenarioId).toBe(scenarioId);
      return new Response(
        JSON.stringify({
          executionId: execId,
          status: "queued",
          startedAt: "2026-01-01T00:00:00.000Z",
          estimatedCompletion: "2026-01-01T00:01:00.000Z",
        }),
        { status: 202 },
      );
    }
    if (url.includes(`/api/v1/workflows/status/${execId}`)) {
      const result =
        scenarioId === "R01" || scenarioId === "R02"
          ? pdfJobResult(scenarioId)
          : extendedJobResult(scenarioId);
      return new Response(
        JSON.stringify({
          executionId: execId,
          status: "completed",
          bullmqState: "completed",
          result,
        }),
        { status: 200 },
      );
    }
    if (url.includes(`/api/v1/test/results/${execId}`)) {
      return new Response(
        JSON.stringify({
          executionId: execId,
          status: "completed",
          bullmqState: "completed",
          workflowStatus: "completed",
          durationMs: 8,
          metrics: {
            llmCalls: 0,
            llmDurationMs: 0,
            platformFetchCount: 0,
            platformFetchDurationMs: 0,
            reportGenerationDurationMs: 40,
          },
          logs: [],
        }),
        { status: 200 },
      );
    }
    if (url.endsWith("/api/v1/test/telemetry/scenario")) {
      return new Response(null, { status: 204 });
    }
    if (url.endsWith("/api/v1/test/telemetry/assertion")) {
      return new Response(null, { status: 204 });
    }
    return new Response("not found", { status: 404 });
  };
}

async function runMockedScenario(
  scenario: ScenarioConfig,
  assertions: ReadonlyArray<ProductionFlowAssertion>,
): Promise<void> {
  const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(createFetchMock(scenario.id));
  const orch = new TestOrchestrator("http://api", {
    getAccessToken: async () => "token",
    pollIntervalMs: 5,
  });
  const result = await orch.executeScenario(scenario, 5000);
  const validation = await orch.validateProductionFlowAssertions(scenario.id, result, assertions);
  expect(validation.allPassed).toBe(true);
  fetchSpy.mockRestore();
}

describe("production-flow scenarios R01–R12 (orchestrator + assertions, mocked HTTP)", () => {
  it("R01 PDF EN/LTR", async () => {
    await runMockedScenario(R01_PRODUCTION_FLOW_SCENARIO, R01_PRODUCTION_FLOW_ASSERTIONS);
  });

  it("R02 PDF AR/RTL", async () => {
    await runMockedScenario(R02_PRODUCTION_FLOW_SCENARIO, R02_PRODUCTION_FLOW_ASSERTIONS);
  });

  it("R03 DOCX", async () => {
    await runMockedScenario(
      {
        id: "R03",
        name: "DOCX generation",
        category: "generation",
        workflow: "report-generation",
        tenantId: PRODUCTION_FLOW_TENANT_R01,
        mockData: { scenario: "normal", seed: 42_003 },
      },
      [
        { type: "workflow_completed" },
        { type: "job_result_message_equals", value: "production_flow_r03_ok" },
        { type: "job_result_evidence", key: "enOoxmlOk", expected: true },
      ],
    );
  });

  it("R04 XLSX", async () => {
    await runMockedScenario(
      {
        id: "R04",
        name: "XLSX generation",
        category: "generation",
        workflow: "report-generation",
        tenantId: PRODUCTION_FLOW_TENANT_R01,
        mockData: { scenario: "normal", seed: 42_004 },
      },
      [
        { type: "workflow_completed" },
        { type: "job_result_message_equals", value: "production_flow_r04_ok" },
        { type: "job_result_evidence", key: "enXlsxBytes", expected: 3000 },
      ],
    );
  });

  it("R05 multi-platform merge", async () => {
    await runMockedScenario(
      {
        id: "R05",
        name: "Multi-platform report model",
        category: "integration",
        workflow: "report-generation",
        tenantId: PRODUCTION_FLOW_TENANT_R01,
        mockData: { scenario: "normal", seed: 42_005 },
      },
      [
        { type: "workflow_completed" },
        { type: "job_result_message_equals", value: "production_flow_r05_ok" },
        { type: "job_result_evidence", key: "mergeOk", expected: true },
      ],
    );
  });

  it("R06 mock LLM", async () => {
    await runMockedScenario(
      {
        id: "R06",
        name: "LLM provider integration",
        category: "integration",
        workflow: "report-generation",
        tenantId: PRODUCTION_FLOW_TENANT_R01,
        mockData: { scenario: "normal", seed: 42_006 },
      },
      [
        { type: "workflow_completed" },
        { type: "job_result_message_equals", value: "production_flow_r06_ok" },
        { type: "job_result_evidence", key: "mockLlmType", expected: "agenticverdict-mock-chat" },
      ],
    );
  });

  it("R07 tenant isolation", async () => {
    await runMockedScenario(
      {
        id: "R07",
        name: "Tenant isolation",
        category: "integration",
        workflow: "report-generation",
        tenantId: PRODUCTION_FLOW_TENANT_R01,
        mockData: { scenario: "normal", seed: 42_007 },
      },
      [
        { type: "workflow_completed" },
        { type: "job_result_message_equals", value: "production_flow_r07_ok" },
        { type: "job_result_evidence", key: "cacheDistinct", expected: true },
      ],
    );
  });

  it("R08 template rendering", async () => {
    await runMockedScenario(
      {
        id: "R08",
        name: "Template rendering",
        category: "generation",
        workflow: "report-generation",
        tenantId: PRODUCTION_FLOW_TENANT_R01,
        mockData: { scenario: "normal", seed: 42_008 },
      },
      [
        { type: "workflow_completed" },
        { type: "job_result_message_equals", value: "production_flow_r08_ok" },
        { type: "job_result_evidence", key: "templateLandmarksOk", expected: true },
      ],
    );
  });

  it("R09 report delivery", async () => {
    await runMockedScenario(
      {
        id: "R09",
        name: "Report delivery",
        category: "delivery",
        workflow: "report-generation",
        tenantId: PRODUCTION_FLOW_TENANT_R01,
        mockData: { scenario: "normal", seed: 42_009 },
      },
      [
        { type: "workflow_completed" },
        { type: "job_result_message_equals", value: "production_flow_r09_ok" },
        { type: "job_result_evidence", key: "emailSuccess", expected: true },
      ],
    );
  });

  it("R10 scheduled reports", async () => {
    await runMockedScenario(
      {
        id: "R10",
        name: "Scheduled reports",
        category: "scheduling",
        workflow: "report-generation",
        tenantId: PRODUCTION_FLOW_TENANT_R01,
        mockData: { scenario: "normal", seed: 42_010 },
      },
      [
        { type: "workflow_completed" },
        { type: "job_result_message_equals", value: "production_flow_r10_ok" },
        { type: "job_result_evidence", key: "enqueueCount", expected: 1 },
      ],
    );
  });

  it("R11 system health", async () => {
    await runMockedScenario(
      {
        id: "R11",
        name: "System health validation",
        category: "system",
        workflow: "report-generation",
        tenantId: PRODUCTION_FLOW_TENANT_R01,
        mockData: { scenario: "normal", seed: 42_011 },
      },
      [
        { type: "workflow_completed" },
        { type: "job_result_message_equals", value: "production_flow_r11_ok" },
        { type: "job_result_evidence", key: "redisOk", expected: true },
      ],
    );
  });

  it("R12 prerequisites", async () => {
    await runMockedScenario(
      {
        id: "R12",
        name: "Prerequisites validation",
        category: "system",
        workflow: "report-generation",
        tenantId: PRODUCTION_FLOW_TENANT_R01,
        mockData: { scenario: "normal", seed: 42_012 },
      },
      [
        { type: "workflow_completed" },
        { type: "job_result_message_equals", value: "production_flow_r12_ok" },
        { type: "job_result_evidence", key: "nodeOk", expected: true },
        { type: "job_result_evidence", key: "pnpmOk", expected: true },
      ],
    );
  });
});
