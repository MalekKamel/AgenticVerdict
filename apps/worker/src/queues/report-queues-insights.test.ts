import { afterEach, describe, expect, it, vi } from "vitest";

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
              platforms: ["meta"],
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
  getEnabledTenantConnectors: vi.fn().mockReturnValue(["meta"]),
  toConnectorType: vi.fn().mockReturnValue("meta"),
}));

vi.mock("@agenticverdict/database", () => ({
  dbScoped: vi.fn().mockImplementation((_db, fn) =>
    fn({
      insert: vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) }),
    }),
  ),
}));

vi.mock("../database", () => ({
  getDatabase: vi.fn().mockReturnValue({}),
}));

vi.mock("@agenticverdict/database/schema/reports", () => ({
  reports: {},
}));

vi.mock("@agenticverdict/database/schema/generated-insights", () => ({
  generatedInsights: {},
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
  getObjectStorage: vi.fn().mockReturnValue({ uploadObject: vi.fn() }),
  getTenantContext: vi.fn().mockReturnValue(undefined),
}));

vi.mock("../services/email", () => ({
  sendReportEmail: vi.fn().mockResolvedValue({ success: true, messageId: "msg-1" }),
}));

vi.mock("./workflow-trigger-production-flow", () => ({
  runProductionFlowScenario: vi.fn(),
}));

import { triggerAIInsightsGeneration } from "./report-queues";

describe("triggerAIInsightsGeneration", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("skips gracefully when no LLM keys are configured", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.OPENAI_API_KEY;
    delete process.env.GLM_API_KEY;

    await expect(
      triggerAIInsightsGeneration(
        "00000000-0000-4000-8000-000000000010",
        "00000000-0000-4000-8000-000000000011",
        "pdf",
      ),
    ).resolves.toBeUndefined();
  });

  it("runs pipeline and returns without throwing when LLM keys exist", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-test-key";

    await expect(
      triggerAIInsightsGeneration(
        "00000000-0000-4000-8000-000000000010",
        "00000000-0000-4000-8000-000000000011",
        "pdf",
      ),
    ).resolves.toBeUndefined();
  });
});
