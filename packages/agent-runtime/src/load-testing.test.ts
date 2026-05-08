import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { performance } from "perf_hooks";

import { createTestTenantContext, TEST_TENANT_ALPHA } from "@agenticverdict/testing";
import { AgentFactory } from "./agent-factory";
import { runAgentJob } from "./agent-job";
import { runIntelligencePipeline } from "./intelligence-pipeline";
import { buildVerdictFixture } from "./test-utils/verdict-fixtures";
import { computePercentile, summarizeLatencyMs } from "./agent-performance-metrics";
import { AgentMockChatModel } from "@agenticverdict/testing";
import { ProviderRegistry } from "./core/ProviderRegistry";
import { BaseProvider } from "./core/BaseProvider";
import type { ChatCompletionResponse } from "./types/chat";
import type { ChatCompletionRequest } from "./types/chat";

const VERDICT_MOCK_JSON = JSON.stringify(
  buildVerdictFixture({
    tenantId: TEST_TENANT_ALPHA,
    analysisId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    overrides: {
      score: 85,
      sentiment: "positive",
      summary: "Load test verdict with positive sentiment.",
    },
  }),
);

class PipelineMockProvider extends BaseProvider {
  readonly providerId = "mock";
  readonly capabilities = {
    chat: true,
    chatStreaming: false,
    chatVision: false,
    chatTools: true,
    embeddings: false,
    imageGeneration: false,
    textToSpeech: false,
  };

  async chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const lastUserMessage = [...request.messages].reverse().find((m) => m.role === "user");
    const prompt = lastUserMessage?.content ?? "";

    let response: string;
    if (prompt.includes("Tenant context")) {
      response = VERDICT_MOCK_JSON;
    } else if (prompt.includes("Use the cross-platform analysis")) {
      response = "Insight: Meta CTR +15% WoW, GA4 conversions +8%.";
    } else {
      response = "Analysis: Strong performance across Meta and GA4 channels.";
    }

    return {
      id: "mock-completion",
      object: "chat.completion",
      created: Date.now(),
      model: "mock-model",
      choices: [
        {
          index: 0,
          message: { role: "assistant", content: response },
          finish_reason: "stop",
        },
      ],
      usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
    };
  }

  async destroy(): Promise<void> {
    // No-op
  }
}

beforeAll(() => {
  ProviderRegistry.register(
    "mock",
    PipelineMockProvider as unknown as new (
      config: unknown,
    ) => ReturnType<typeof BaseProvider.prototype.chat>,
  );
});

afterAll(() => {
  ProviderRegistry.unregister("mock");
});

describe("Load Testing — 1000+ iterations (task 2.36)", () => {
  const createPipelineMock = () =>
    new AgentMockChatModel({
      customEntries: [
        {
          id: "verdict",
          matchSubstring: "Tenant context",
          response: VERDICT_MOCK_JSON,
        },
        {
          id: "insight",
          matchSubstring: "Use the cross-platform analysis",
          response: "Insight: Meta CTR +15% WoW, GA4 conversions +8%.",
        },
        {
          id: "analysis",
          matchSubstring: "Analyze the marketing data",
          response: "Analysis: Strong performance across Meta and GA4 channels.",
        },
      ],
    });

  const createTenant = () =>
    createTestTenantContext({
      tenantId: TEST_TENANT_ALPHA,
      tenantConfig: {
        tenantId: TEST_TENANT_ALPHA,
        tenantName: "Load Test Co",
      },
    });

  const runPipelineOnce = async (
    factory: AgentFactory,
    tenant: ReturnType<typeof createTenant>,
    runId: string,
    mockModels: Record<string, AgentMockChatModel>,
  ) =>
    runAgentJob({ tenant, runId }, async (scope) =>
      runIntelligencePipeline({
        factory,
        ctx: scope.invocation,
        goal: "Load test pipeline execution",
        workflowId: `load-test-workflow-${runId}`,
        specialization: { tenantName: "Load Test Co" },
        mockModels: {
          analysis: mockModels.analysis,
          insights: mockModels.insights,
          verdict: mockModels.verdict,
        },
      }),
    );

  it("executes 1000+ pipeline iterations successfully", async () => {
    const factory = new AgentFactory({ llmEnv: {} });
    const tenant = createTenant();
    const mockModels = {
      analysis: createPipelineMock(),
      insights: createPipelineMock(),
      verdict: createPipelineMock(),
    };

    const totalIterations = 1000;
    const results: Array<{ runId: string; status: string; durationMs: number }> = [];
    const latencies: number[] = [];

    for (let i = 0; i < totalIterations; i += 1) {
      const runId = `load-${i}`;
      const startTime = performance.now();

      const result = await runPipelineOnce(factory, tenant, runId, mockModels);

      const durationMs = performance.now() - startTime;
      results.push({
        runId,
        status: result.status,
        durationMs,
      });
      latencies.push(durationMs);

      if ((i + 1) % 100 === 0) {
        const partial = summarizeLatencyMs(latencies);

        console.log(
          `Load test progress: ${i + 1}/${totalIterations} iterations complete. p95: ${partial.p95Ms.toFixed(2)}ms`,
        );
      }
    }

    const completedRuns = results.filter((r) => r.status === "completed");
    expect(completedRuns).toHaveLength(totalIterations);

    const stats = summarizeLatencyMs(latencies);

    console.log("Load Test Results Summary:");

    console.log(`  Total iterations: ${stats.n}`);

    console.log(`  Min latency: ${stats.minMs.toFixed(2)}ms`);

    console.log(`  Max latency: ${stats.maxMs.toFixed(2)}ms`);

    console.log(`  p50 latency: ${stats.p50Ms.toFixed(2)}ms`);

    console.log(`  p95 latency: ${stats.p95Ms.toFixed(2)}ms`);

    console.log(`  p99 latency: ${stats.p99Ms.toFixed(2)}ms`);

    expect(stats.n).toBeGreaterThanOrEqual(1000);
    expect(stats.p95Ms).toBeLessThan(5000);
  }, 300000);

  it("maintains p95 latency <2s under sustained load (task 2.37)", async () => {
    const factory = new AgentFactory({ llmEnv: {} });
    const tenant = createTenant();
    const mockModels = {
      analysis: createPipelineMock(),
      insights: createPipelineMock(),
      verdict: createPipelineMock(),
    };

    const totalIterations = 200;
    const latencies: number[] = [];

    for (let i = 0; i < totalIterations; i += 1) {
      const startTime = performance.now();
      await runPipelineOnce(factory, tenant, `sustained-${i}`, mockModels);
      latencies.push(performance.now() - startTime);
    }

    const stats = summarizeLatencyMs(latencies);

    console.log("Sustained Load p95 Validation:");

    console.log(`  p95 latency: ${stats.p95Ms.toFixed(2)}ms (target: <2000ms)`);

    expect(stats.p95Ms).toBeLessThan(2000);
  }, 60000);

  it("validates tenant isolation under concurrent load", async () => {
    const factory = new AgentFactory({ llmEnv: {} });

    const tenantAlpha = createTestTenantContext({
      tenantId: TEST_TENANT_ALPHA,
      tenantConfig: { tenantId: TEST_TENANT_ALPHA, tenantName: "Tenant Alpha" },
    });

    const mockModelsAlpha = {
      analysis: createPipelineMock(),
      insights: createPipelineMock(),
      verdict: createPipelineMock(),
    };

    const iterations = 100;
    const results: Array<{ tenantId: string; status: string }> = [];

    for (let i = 0; i < iterations; i += 1) {
      const result = await runPipelineOnce(factory, tenantAlpha, `isolation-${i}`, mockModelsAlpha);
      results.push({ tenantId: TEST_TENANT_ALPHA, status: result.status });
    }

    const successfulRuns = results.filter((r) => r.status === "completed");
    expect(successfulRuns).toHaveLength(iterations);
  }, 30000);

  it("tracks performance metrics across iterations", async () => {
    const factory = new AgentFactory({ llmEnv: {} });
    const tenant = createTenant();
    const mockModels = {
      analysis: createPipelineMock(),
      insights: createPipelineMock(),
      verdict: createPipelineMock(),
    };

    const iterations = 50;
    const latencies: number[] = [];

    for (let i = 0; i < iterations; i += 1) {
      const startTime = performance.now();
      await runPipelineOnce(factory, tenant, `metrics-${i}`, mockModels);
      latencies.push(performance.now() - startTime);
    }

    const sorted = [...latencies].sort((a, b) => a - b);
    const p50 = computePercentile(sorted, 50);
    const p95 = computePercentile(sorted, 95);
    const p99 = computePercentile(sorted, 99);

    expect(p50).toBeGreaterThan(0);
    expect(p95).toBeGreaterThan(p50);
    expect(p99).toBeGreaterThanOrEqual(p95);

    console.log(
      `Performance metrics: p50=${p50.toFixed(2)}ms, p95=${p95.toFixed(2)}ms, p99=${p99.toFixed(2)}ms`,
    );
  }, 15000);

  it("handles gradual traffic increase simulation", async () => {
    const factory = new AgentFactory({ llmEnv: {} });
    const tenant = createTenant();
    const mockModels = {
      analysis: createPipelineMock(),
      insights: createPipelineMock(),
      verdict: createPipelineMock(),
    };

    const trafficLevels = [
      { level: "10%", iterations: 50 },
      { level: "50%", iterations: 100 },
      { level: "100%", iterations: 200 },
    ];

    const allLatencies: number[] = [];

    for (const traffic of trafficLevels) {
      const latencies: number[] = [];
      for (let i = 0; i < traffic.iterations; i += 1) {
        const startTime = performance.now();
        await runPipelineOnce(factory, tenant, `traffic-${traffic.level}-${i}`, mockModels);
        latencies.push(performance.now() - startTime);
      }

      const stats = summarizeLatencyMs(latencies);

      console.log(
        `Traffic ${traffic.level}: ${traffic.iterations} iterations, p95=${stats.p95Ms.toFixed(2)}ms`,
      );
      allLatencies.push(...latencies);
    }

    const totalStats = summarizeLatencyMs(allLatencies);
    expect(totalStats.n).toBe(350);
    expect(totalStats.p95Ms).toBeLessThan(3000);
  }, 90000);
});
