import {
  createTestTenantConfig,
  createTestTenantContext,
  TEST_TENANT_ALPHA,
  TEST_TENANT_BETA,
  AgentMockChatModel,
} from "@agenticverdict/testing";
import { afterEach, describe, expect, it, vi, beforeEach } from "vitest";

import { AgentFactory } from "./agent-factory";
import { AgentTenantContextError } from "./agent-context-integration";
import { runAgentJob, AgentJobError } from "./agent-job";
import { defineTool } from "./tools";
import { parseAgentFactoryConfig, safeParseAgentFactoryConfig } from "./agent-config";
import { ProviderRegistry } from "./core/ProviderRegistry";
import { BaseProvider } from "./core/BaseProvider";
import type { ChatCompletionResponse } from "./types/chat";
import { createRuleBasedEchoAgent } from "./rule-based-agent";

class MockProvider extends BaseProvider {
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

  async chat(): Promise<ChatCompletionResponse> {
    return {
      id: "mock-completion",
      object: "chat.completion",
      created: Date.now(),
      model: "mock-model",
      choices: [
        {
          index: 0,
          message: { role: "assistant", content: "MOCK_RESPONSE" },
          finish_reason: "stop",
        },
      ],
      usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
    };
  }

  async destroy(): Promise<void> {
    // No-op for mock provider
  }
}

beforeEach(() => {
  ProviderRegistry.register("mock", MockProvider);
});

afterEach(() => {
  ProviderRegistry.unregister("mock");
});

describe("AgentFactory (Phase 6)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("parses config with Zod defaults", () => {
    const cfg = parseAgentFactoryConfig({
      runtimeMode: "test",
      role: "insights",
      name: "Test Agent",
      systemMessage: "Test",
    });
    expect(cfg.memoryMode).toBe("buffer");
    expect(cfg.maxHistoryLength).toBe(10);
    expect(cfg.timeoutMs).toBe(60000);
  });

  it("safeParseAgentFactoryConfig surfaces Zod errors", () => {
    const r = safeParseAgentFactoryConfig({ role: "invalid" });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.length).toBeGreaterThan(0);
    }
  });

  it("createAgent rejects test runtimeMode", () => {
    const factory = new AgentFactory({ llmEnv: {} });
    expect(() =>
      factory.createAgent({
        runtimeMode: "test",
        role: "analysis",
        name: "Test Agent",
        systemMessage: "Test",
      }),
    ).toThrow(/createTestAgent/);
  });

  it("createTestAgent forces test runtime and runs under tenant scope", async () => {
    const factory = new AgentFactory({ llmEnv: {} });
    const model = new AgentMockChatModel({
      customEntries: [{ id: "t-hello", matchSubstring: "hello", response: "MOCK_HELLO" }],
    });
    const agent = factory.createTestAgent(
      { role: "analysis", memoryMode: "buffer", name: "Test Agent", systemMessage: "Test" },
      model,
    );
    const tenant = createTestTenantContext({
      tenantId: TEST_TENANT_ALPHA,
      tenantConfig: { tenantId: TEST_TENANT_ALPHA, tenantName: "Alpha Co" },
    });

    const out = await runAgentJob({ tenant }, async () =>
      agent.run(
        { goal: "Say hello for metrics" },
        {
          runId: "run-1",
          tenantId: TEST_TENANT_ALPHA,
          requestId: "req-factory-1",
        },
      ),
    );

    expect(out.answer).toContain("MOCK_HELLO");
  });

  it("throws when invocation tenantId does not match ALS tenant", async () => {
    const factory = new AgentFactory({ llmEnv: {} });
    const agent = factory.createTestAgent(
      { role: "analysis", name: "Test Agent", systemMessage: "Test" },
      new AgentMockChatModel({}),
    );
    const tenant = createTestTenantContext({
      tenantId: TEST_TENANT_ALPHA,
      tenantConfig: { tenantId: TEST_TENANT_ALPHA },
    });

    await expect(
      runAgentJob({ tenant }, async () =>
        agent.run(
          { goal: "x" },
          {
            runId: "run-m",
            tenantId: TEST_TENANT_BETA,
            requestId: "req-mismatch",
          },
        ),
      ),
    ).rejects.toSatisfy(
      (e: unknown) => e instanceof AgentJobError && e.cause instanceof AgentTenantContextError,
    );
  });

  it("createMemory returns isolated stores per call (no cross-tenant sharing)", () => {
    const factory = new AgentFactory({ llmEnv: {} });
    const cfg = parseAgentFactoryConfig({
      runtimeMode: "test",
      role: "analysis",
      memoryMode: "buffer",
      name: "Test Agent",
      systemMessage: "Test",
    });
    const memA = factory.createMemory(cfg);
    const memB = factory.createMemory(cfg);
    memA.append("user", "tenant-alpha-secret");
    memB.append("user", "tenant-beta-secret");
    expect(memA.snapshot().some((t) => t.content.includes("beta"))).toBe(false);
    expect(memB.snapshot().some((t) => t.content.includes("alpha"))).toBe(false);
  });

  it("createAgentWithTools returns a registry and test agent when runtimeMode is test", () => {
    const factory = new AgentFactory({ llmEnv: {} });
    const ping = defineTool({
      name: "ping",
      description: "p",
      execute: async () => "pong",
    });
    const { tools, agent } = factory.createAgentWithTools(
      { runtimeMode: "test", role: "analysis", name: "Test Agent", systemMessage: "Test" },
      [ping],
    );
    expect(tools.get("ping")).toBeDefined();
    expect(agent).toBeDefined();
  });

  it("createRuleBasedEchoAgent still composes with runAgentJob", async () => {
    const ping = defineTool({
      name: "ping",
      description: "p",
      execute: async () => "pong",
    });
    const agent = createRuleBasedEchoAgent({ tools: [ping] });
    const tenant = createTestTenantContext({
      tenantId: TEST_TENANT_ALPHA,
      tenantConfig: createTestTenantConfig(),
    });
    const r = await runAgentJob({ tenant }, async () =>
      agent.run(
        { goal: "x", context: { demoTool: "ping" } },
        {
          runId: "r1",
          tenantId: TEST_TENANT_ALPHA,
          requestId: "r-rb",
        },
      ),
    );
    expect(r.answer).toContain("pong");
  });
});
