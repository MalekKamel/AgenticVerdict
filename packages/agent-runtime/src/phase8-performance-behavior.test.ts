import { createTestCompanyConfig, TEST_TENANT_ALPHA } from "@agenticverdict/testing";
import { describe, expect, it, vi } from "vitest";

import { AgentFactory } from "./agent-factory";
import { runAgentJob } from "./agent-job";
import { LlmInvocationCache } from "./llm-invocation-cache";
import { AgentMockChatModel } from "./mock-chat-model";
import { runMarketingAgentPipeline } from "./marketing-pipeline";
import { summarizeLatencyMs } from "./agent-performance-metrics";

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

describe("Phase 8 — performance & behavior (tasks 6.6, 7.2, 7.3)", () => {
  it("reduces mock LLM invocations on repeated pipeline via shared invocation cache", async () => {
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
          matchSubstring: "CACHE_MARKER",
          response: "Analysis: Meta and GA4 trend aligned; GSC clicks flat.",
        },
      ],
    });

    const factory = new AgentFactory({ llmEnv: {} });
    const cache = new LlmInvocationCache({ ttlMs: 300_000, maxEntries: 64 });
    const tenant = {
      tenantId: TEST_TENANT_ALPHA,
      requestId: "req-cache-1",
      config: createTestCompanyConfig({ companyId: TEST_TENANT_ALPHA, companyName: "Cache Co" }),
    };

    const goal = "CACHE_MARKER: Summarize last month.";

    const runOnce = () =>
      runAgentJob({ tenant, runId: `run-${Math.random()}` }, async (scope) =>
        runMarketingAgentPipeline({
          factory,
          ctx: scope.invocation,
          goal,
          specialization: { companyName: "Cache Co" },
          mockModels: {
            analysis: pipelineMock,
            insights: pipelineMock,
            verdict: pipelineMock,
          },
          invocationCache: cache,
        }),
      );

    pipelineMock.resetCallCount();
    const first = await runOnce();
    const callsAfterFirst = pipelineMock.getCallCount();
    expect(first.status).toBe("completed");
    expect(callsAfterFirst).toBe(3);

    const second = await runOnce();
    expect(second.status).toBe("completed");
    const callsAfterSecond = pipelineMock.getCallCount();
    expect(callsAfterSecond).toBe(3);
    expect(cache.getMetrics().hitRate).toBeGreaterThanOrEqual(0.5);
  });

  it("emits onPipelineTiming with aggregate ms only", async () => {
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
          response: "Insight.",
        },
        { id: "an", matchSubstring: "TIMING_MARKER", response: "Analysis." },
      ],
    });

    const factory = new AgentFactory({ llmEnv: {} });
    const timing = vi.fn();
    const tenant = {
      tenantId: TEST_TENANT_ALPHA,
      requestId: "req-time-1",
      config: createTestCompanyConfig({ companyId: TEST_TENANT_ALPHA, companyName: "Timing Co" }),
    };

    await runAgentJob({ tenant, runId: "run-t1" }, async (scope) =>
      runMarketingAgentPipeline({
        factory,
        ctx: scope.invocation,
        goal: "TIMING_MARKER: Go.",
        specialization: { companyName: "Timing Co" },
        mockModels: {
          analysis: pipelineMock,
          insights: pipelineMock,
          verdict: pipelineMock,
        },
        onPipelineTiming: timing,
      }),
    );

    expect(timing).toHaveBeenCalledTimes(1);
    const payload = timing.mock.calls[0]?.[0];
    expect(payload?.workflowId).toBeDefined();
    expect(payload?.totalMs).toBeGreaterThanOrEqual(0);
    expect(payload?.stageMs).toHaveLength(3);
  });

  it("mock full workflow stays within acceptance p95 budget (smoke)", async () => {
    const samples: number[] = [];
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
          response: "Insight.",
        },
        { id: "an", matchSubstring: "BENCH_MARKER", response: "Analysis." },
      ],
    });
    const factory = new AgentFactory({ llmEnv: {} });
    const tenant = {
      tenantId: TEST_TENANT_ALPHA,
      requestId: "req-bench-1",
      config: createTestCompanyConfig({ companyId: TEST_TENANT_ALPHA, companyName: "Bench Co" }),
    };

    for (let i = 0; i < 5; i += 1) {
      const t0 = performance.now();
      await runAgentJob({ tenant, runId: `bench-${i}` }, async (scope) =>
        runMarketingAgentPipeline({
          factory,
          ctx: scope.invocation,
          goal: "BENCH_MARKER: Run.",
          specialization: { companyName: "Bench Co" },
          mockModels: {
            analysis: pipelineMock,
            insights: pipelineMock,
            verdict: pipelineMock,
          },
        }),
      );
      samples.push(performance.now() - t0);
    }

    const summary = summarizeLatencyMs(samples);
    expect(summary.p95Ms).toBeLessThan(15_000);
  });
});
