import { createTestCompanyConfig, TEST_TENANT_ALPHA } from "@agenticverdict/testing";
import { describe, expect, it, vi } from "vitest";

import { AgentFactory } from "./agent-factory";
import { AgentJobError, runAgentJob } from "./agent-job";
import { AgentMockChatModel } from "./mock-chat-model";
import { marketingPipelineStateToJson, runMarketingAgentPipeline } from "./marketing-pipeline";
import { buildMarketingVerdictFixture } from "./test-utils/marketing-verdict-fixtures";
import { VerdictParseError } from "./verdict-schema";

const VERDICT_MOCK_JSON = JSON.stringify(
  buildMarketingVerdictFixture({
    tenantId: TEST_TENANT_ALPHA,
    analysisId: "11111111-1111-4111-8111-111111111111",
    overrides: {
      score: 81,
      sentiment: "positive",
      summary:
        "Net positive with Meta leading efficiency across prospecting pools for the review window.",
    },
  }),
);

describe("marketing-pipeline (Phase 7)", () => {
  it("runs analysis → insights → verdict with mock LLM and validates verdict schema", async () => {
    const pipelineMock = new AgentMockChatModel({
      customEntries: [
        {
          id: "v",
          matchSubstring: "Respond with a single JSON object only",
          response: VERDICT_MOCK_JSON,
        },
        {
          id: "ins",
          matchSubstring: "Use the cross-platform analysis below",
          response: "Insight: Meta CTR +12% WoW.",
        },
        {
          id: "an",
          matchSubstring: "PIPELINE_E2E_MARKER",
          response: "Analysis: Meta and GA4 trend aligned; GSC clicks flat.",
        },
      ],
    });

    const factory = new AgentFactory({ llmEnv: {} });
    const tenant = {
      tenantId: TEST_TENANT_ALPHA,
      requestId: "req-pipeline-1",
      config: createTestCompanyConfig({ companyId: TEST_TENANT_ALPHA, companyName: "Pipeline Co" }),
    };

    const progress = vi.fn();
    const messages: { from: string; to: string; type: string }[] = [];

    const state = await runAgentJob({ tenant, runId: "run-pipe-1" }, async (scope) =>
      runMarketingAgentPipeline({
        factory,
        ctx: scope.invocation,
        goal: "PIPELINE_E2E_MARKER: Summarize last month.",
        workflowId: "11111111-1111-4111-8111-111111111111",
        specialization: { companyName: "Pipeline Co" },
        mockModels: {
          analysis: pipelineMock,
          insights: pipelineMock,
          verdict: pipelineMock,
        },
        onProgress: progress,
        onMessage: (m) => {
          messages.push({ from: m.from, to: m.to, type: m.type });
        },
      }),
    );

    expect(state.status).toBe("completed");
    expect(state.verdict?.score).toBe(81);
    expect(state.provenance?.analysisId).toBe("11111111-1111-4111-8111-111111111111");
    expect(state.provenance?.transformations).toHaveLength(4);
    expect(state.stages).toHaveLength(3);
    expect(progress).toHaveBeenCalledTimes(3);
    expect(messages).toHaveLength(3);
    expect(messages[0]?.to).toContain("insights");

    const json = marketingPipelineStateToJson(state);
    expect(json.status).toBe("completed");
    expect(json.stages).toHaveLength(3);
    expect(json.provenance).toMatchObject({
      analysisId: "11111111-1111-4111-8111-111111111111",
      transformationCount: 4,
    });
  });

  it("returns failed state when a stage throws", async () => {
    const boom = new AgentMockChatModel({
      customEntries: [{ id: "b", matchSubstring: "FAIL_STAGE", response: "x" }],
      failureKind: "transient_http",
    });

    const factory = new AgentFactory({ llmEnv: {} });
    const tenant = {
      tenantId: TEST_TENANT_ALPHA,
      requestId: "req-fail",
      config: createTestCompanyConfig({ companyId: TEST_TENANT_ALPHA }),
    };

    const state = await runAgentJob({ tenant }, async (scope) =>
      runMarketingAgentPipeline({
        factory,
        ctx: scope.invocation,
        goal: "FAIL_STAGE",
        specialization: { companyName: "Co" },
        mockModels: { analysis: boom, insights: boom, verdict: boom },
      }),
    );

    expect(state.status).toBe("failed");
    expect(state.stages.length).toBe(0);
    expect(state.error?.stage).toBe("analysis");
  });

  it("supports degraded status when verdict JSON is invalid", async () => {
    const badVerdictMock = new AgentMockChatModel({
      customEntries: [
        { id: "v", matchSubstring: "Respond with a single JSON object only", response: "not-json" },
        { id: "ins", matchSubstring: "Use the cross-platform analysis below", response: "ok" },
        { id: "an", matchSubstring: "DEGRADED_MARKER", response: "analysis text" },
      ],
    });

    const factory = new AgentFactory({ llmEnv: {} });
    const tenant = {
      tenantId: TEST_TENANT_ALPHA,
      requestId: "req-degraded",
      config: createTestCompanyConfig({ companyId: TEST_TENANT_ALPHA }),
    };

    const state = await runAgentJob({ tenant }, async (scope) =>
      runMarketingAgentPipeline({
        factory,
        ctx: scope.invocation,
        goal: "DEGRADED_MARKER",
        specialization: { companyName: "Co" },
        mockModels: {
          analysis: badVerdictMock,
          insights: badVerdictMock,
          verdict: badVerdictMock,
        },
        tolerateVerdictParseFailure: true,
      }),
    );

    expect(state.status).toBe("degraded");
    expect(state.stages).toHaveLength(3);
    expect(state.verdictRawAnswer).toContain("not-json");
    expect(state.provenance?.transformations.length).toBeGreaterThanOrEqual(3);
  });

  it("rethrows VerdictParseError when tolerateVerdictParseFailure is false", async () => {
    const badVerdictMock = new AgentMockChatModel({
      customEntries: [
        { id: "v", matchSubstring: "Respond with a single JSON object only", response: "not-json" },
        { id: "ins", matchSubstring: "Use the cross-platform analysis below", response: "ok" },
        { id: "an", matchSubstring: "THROW_MARKER", response: "analysis text" },
      ],
    });

    const factory = new AgentFactory({ llmEnv: {} });
    const tenant = {
      tenantId: TEST_TENANT_ALPHA,
      requestId: "req-throw",
      config: createTestCompanyConfig({ companyId: TEST_TENANT_ALPHA }),
    };

    await expect(
      runAgentJob({ tenant }, async (scope) =>
        runMarketingAgentPipeline({
          factory,
          ctx: scope.invocation,
          goal: "THROW_MARKER",
          specialization: { companyName: "Co" },
          mockModels: {
            analysis: badVerdictMock,
            insights: badVerdictMock,
            verdict: badVerdictMock,
          },
        }),
      ),
    ).rejects.toSatisfy(
      (e: unknown) => e instanceof AgentJobError && e.cause instanceof VerdictParseError,
    );
  });
});
