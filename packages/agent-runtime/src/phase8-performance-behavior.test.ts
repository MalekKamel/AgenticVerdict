import { createTestTenantContext, TEST_TENANT_ALPHA } from "@agenticverdict/testing";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import { AgentFactory } from "./agent-factory";
import { runAgentJob } from "./agent-job";
import { LlmInvocationCache } from "./llm-invocation-cache";
import { runIntelligencePipeline } from "./intelligence-pipeline";
import { summarizeLatencyMs } from "./agent-performance-metrics";
import { buildVerdictFixture } from "./test-utils/verdict-fixtures";
import { ProviderRegistry } from "./core/ProviderRegistry";
import { BaseProvider } from "./core/BaseProvider";
import type { ProviderCapabilities } from "./core/BaseProvider";
import type { ChatCompletionRequest, ChatCompletionResponse } from "./types";

class MockProvider extends BaseProvider {
  private static callCount = 0;
  readonly providerId = "mock";
  readonly capabilities: ProviderCapabilities = {
    chat: true,
    chatStreaming: true,
    chatVision: false,
    chatTools: true,
    embeddings: false,
    imageGeneration: false,
    textToSpeech: false,
  };

  static resetCallCount(): void {
    MockProvider.callCount = 0;
  }

  static getCallCount(): number {
    return MockProvider.callCount;
  }

  constructor() {
    super();
  }

  async chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    MockProvider.callCount += 1;
    const prompt = request.messages
      .map((message) => (typeof message.content === "string" ? message.content : ""))
      .join("\n");
    let content = "Analysis.";

    if (prompt.includes("Use the cross-platform analysis below")) {
      content = "Insight.";
    }
    if (prompt.includes("Tenant context (must appear exactly in your JSON)")) {
      content = VERDICT_MOCK_JSON;
    }

    return {
      id: "mock-completion",
      object: "chat.completion",
      created: Date.now(),
      model: "mock-model",
      choices: [
        {
          index: 0,
          message: { role: "assistant", content },
          finish_reason: "stop",
        },
      ],
      usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
    };
  }

  async destroy(): Promise<void> {
    // No cleanup required for mock provider
  }
}

beforeEach(() => {
  ProviderRegistry.register("mock", MockProvider);
  MockProvider.resetCallCount();
});

afterEach(() => {
  ProviderRegistry.unregister("mock");
});

const VERDICT_MOCK_JSON = JSON.stringify(
  buildVerdictFixture({
    tenantId: TEST_TENANT_ALPHA,
    analysisId: "22222222-2222-4222-8222-222222222222",
    overrides: {
      score: 81,
      sentiment: "positive",
      summary:
        "Net positive with Meta leading efficiency across prospecting pools for the review window.",
    },
  }),
);

describe("Phase 8 — performance & behavior (tasks 6.6, 7.2, 7.3)", () => {
  it("reduces mock LLM invocations on repeated pipeline via shared invocation cache", async () => {
    const factory = new AgentFactory({ llmEnv: {} });
    const cache = new LlmInvocationCache({ ttlMs: 300_000, maxEntries: 64 });
    const tenant = createTestTenantContext({
      tenantId: TEST_TENANT_ALPHA,
      tenantConfig: {
        tenantId: TEST_TENANT_ALPHA,
        tenantName: "Cache Co",
        ai: { primaryProvider: "mock" },
      },
    });

    const goal = "CACHE_MARKER: Summarize last month.";
    const workflowId = "ffffffff-ffff-4fff-8fff-ffffffffffff";

    const runOnce = () =>
      runAgentJob({ tenant, runId: `run-${Math.random()}` }, async (scope) =>
        runIntelligencePipeline({
          factory,
          ctx: scope.invocation,
          goal,
          workflowId,
          specialization: { tenantName: "Cache Co" },
          invocationCache: cache,
        }),
      );

    MockProvider.resetCallCount();
    const first = await runOnce();
    const callsAfterFirst = MockProvider.getCallCount();
    expect(first.status).toBe("completed");
    expect(callsAfterFirst).toBe(3);

    const second = await runOnce();
    expect(second.status).toBe("completed");
    const callsAfterSecond = MockProvider.getCallCount();
    expect(callsAfterSecond).toBe(3);
    expect(cache.getMetrics().hitRate).toBeGreaterThanOrEqual(0.5);
  });

  it("emits onPipelineTiming with aggregate ms only", async () => {
    const factory = new AgentFactory({ llmEnv: {} });
    const timing = vi.fn();
    const tenant = createTestTenantContext({
      tenantId: TEST_TENANT_ALPHA,
      tenantConfig: {
        tenantId: TEST_TENANT_ALPHA,
        tenantName: "Timing Co",
        ai: { primaryProvider: "mock" },
      },
    });

    await runAgentJob({ tenant, runId: "run-t1" }, async (scope) =>
      runIntelligencePipeline({
        factory,
        ctx: scope.invocation,
        goal: "TIMING_MARKER: Go.",
        specialization: { tenantName: "Timing Co" },
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
    const factory = new AgentFactory({ llmEnv: {} });
    const tenant = createTestTenantContext({
      tenantId: TEST_TENANT_ALPHA,
      tenantConfig: {
        tenantId: TEST_TENANT_ALPHA,
        tenantName: "Bench Co",
        ai: { primaryProvider: "mock" },
      },
    });

    for (let i = 0; i < 5; i += 1) {
      const t0 = performance.now();
      await runAgentJob({ tenant, runId: `bench-${i}` }, async (scope) =>
        runIntelligencePipeline({
          factory,
          ctx: scope.invocation,
          goal: "BENCH_MARKER: Run.",
          specialization: { tenantName: "Bench Co" },
        }),
      );
      samples.push(performance.now() - t0);
    }

    const summary = summarizeLatencyMs(samples);
    expect(summary.p95Ms).toBeLessThan(15_000);
  });
});
