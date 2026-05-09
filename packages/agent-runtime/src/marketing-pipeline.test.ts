import { createTestTenantContext, TEST_TENANT_ALPHA } from "@agenticverdict/testing";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import { AgentFactory } from "./agent-factory";
import { AgentJobError, runAgentJob } from "./agent-job";
import { pipelineStateToJson, runIntelligencePipeline } from "./intelligence-pipeline";
import { buildVerdictFixture } from "./test-utils/verdict-fixtures";
import { VerdictParseError } from "@agenticverdict/types";
import { ProviderRegistry } from "./core/ProviderRegistry";
import { BaseProvider } from "./core/BaseProvider";
import type { ProviderCapabilities } from "./core/BaseProvider";

class MockProvider extends BaseProvider {
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

  constructor() {
    super();
  }

  async chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const prompt = request.messages
      .map((message) => (typeof message.content === "string" ? message.content : ""))
      .join("\n");
    let content = "Analysis: Meta and GA4 trend aligned; GSC clicks flat.";

    if (prompt.includes("FAIL_STAGE")) {
      throw new Error("Mock stage failure");
    }
    if (prompt.includes("Use the cross-platform analysis below")) {
      content = "Insight: Meta CTR +12% WoW.";
    }
    if (prompt.includes("Tenant context (must appear exactly in your JSON)")) {
      content =
        prompt.includes("DEGRADED_MARKER") || prompt.includes("THROW_MARKER")
          ? "not-json"
          : VERDICT_MOCK_JSON;
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
});

afterEach(() => {
  ProviderRegistry.unregister("mock");
});

const VERDICT_MOCK_JSON = JSON.stringify(
  buildVerdictFixture({
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

describe("intelligence-pipeline (Phase 7)", () => {
  it("runs analysis → insights → verdict with mock LLM and validates verdict schema", async () => {
    const factory = new AgentFactory({ llmEnv: {} });
    const tenant = createTestTenantContext({
      tenantId: TEST_TENANT_ALPHA,
      tenantConfig: {
        tenantId: TEST_TENANT_ALPHA,
        tenantName: "Pipeline Co",
        ai: { primaryProvider: "mock" },
      },
    });

    const progress = vi.fn();
    const messages: { from: string; to: string; type: string }[] = [];

    const state = await runAgentJob({ tenant, runId: "run-pipe-1" }, async (scope) =>
      runIntelligencePipeline({
        factory,
        ctx: scope.invocation,
        goal: "PIPELINE_E2E_MARKER: Summarize last month.",
        workflowId: "11111111-1111-4111-8111-111111111111",
        specialization: { tenantName: "Pipeline Co" },
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

    const json = pipelineStateToJson(state);
    expect(json.status).toBe("completed");
    expect(json.stages).toHaveLength(3);
    expect(json.provenance).toMatchObject({
      analysisId: "11111111-1111-4111-8111-111111111111",
      transformationCount: 4,
    });
  });

  it("returns failed state when a stage throws", async () => {
    const factory = new AgentFactory({ llmEnv: {} });
    const tenant = createTestTenantContext({
      tenantId: TEST_TENANT_ALPHA,
      tenantConfig: { tenantId: TEST_TENANT_ALPHA, ai: { primaryProvider: "mock" } },
    });

    const state = await runAgentJob({ tenant }, async (scope) =>
      runIntelligencePipeline({
        factory,
        ctx: scope.invocation,
        goal: "FAIL_STAGE",
        specialization: { tenantName: "Co" },
      }),
    );

    expect(state.status).toBe("failed");
    expect(state.stages.length).toBe(0);
    expect(state.error?.stage).toBe("analysis");
  });

  it("supports degraded status when verdict JSON is invalid", async () => {
    const factory = new AgentFactory({ llmEnv: {} });
    const tenant = createTestTenantContext({
      tenantId: TEST_TENANT_ALPHA,
      tenantConfig: { tenantId: TEST_TENANT_ALPHA, ai: { primaryProvider: "mock" } },
    });

    const state = await runAgentJob({ tenant }, async (scope) =>
      runIntelligencePipeline({
        factory,
        ctx: scope.invocation,
        goal: "DEGRADED_MARKER",
        specialization: { tenantName: "Co" },
        tolerateVerdictParseFailure: true,
      }),
    );

    expect(state.status).toBe("degraded");
    expect(state.stages).toHaveLength(3);
    expect(state.verdictRawAnswer).toContain("not-json");
    expect(state.provenance?.transformations.length).toBeGreaterThanOrEqual(3);
  });

  it("rethrows VerdictParseError when tolerateVerdictParseFailure is false", async () => {
    const factory = new AgentFactory({ llmEnv: {} });
    const tenant = createTestTenantContext({
      tenantId: TEST_TENANT_ALPHA,
      tenantConfig: { tenantId: TEST_TENANT_ALPHA, ai: { primaryProvider: "mock" } },
    });

    await expect(
      runAgentJob({ tenant }, async (scope) =>
        runIntelligencePipeline({
          factory,
          ctx: scope.invocation,
          goal: "THROW_MARKER",
          specialization: { tenantName: "Co" },
        }),
      ),
    ).rejects.toSatisfy(
      (e: unknown) => e instanceof AgentJobError && e.cause instanceof VerdictParseError,
    );
  });
});
