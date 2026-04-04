import { createTestCompanyConfig, TEST_TENANT_ALPHA } from "@agenticverdict/testing";
import { describe, expect, it, vi } from "vitest";

import { AgentFactory } from "./agent-factory";
import { AgentJobError, runAgentJob } from "./agent-job";
import { AgentMockChatModel } from "./mock-chat-model";
import { marketingPipelineStateToJson, runMarketingAgentPipeline } from "./marketing-pipeline";
import { VerdictParseError } from "./verdict-schema";

const VERDICT_MOCK_JSON = `{
  "summary": "Net positive with Meta leading.",
  "sentiment": "positive",
  "score": 81,
  "keyInsights": [{ "id": "i1", "title": "Lead efficiency", "detail": "CPC stable week over week." }],
  "recommendations": [{ "title": "Shift 5% budget to search", "rationale": "Strong assisted conversions" }],
  "actionItems": [{ "description": "Launch creative variant B", "ownerRole": "creative_lead" }],
  "evidence": [{ "label": "Blended CPA", "metric": "cpa", "value": "42", "source": "ga4" }],
  "nextSteps": ["Review search query themes"]
}`;

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
        workflowId: "wf-fixed-1",
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
    expect(state.stages).toHaveLength(3);
    expect(progress).toHaveBeenCalledTimes(3);
    expect(messages).toHaveLength(3);
    expect(messages[0]?.to).toContain("insights");

    const json = marketingPipelineStateToJson(state);
    expect(json.status).toBe("completed");
    expect(json.stages).toHaveLength(3);
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
