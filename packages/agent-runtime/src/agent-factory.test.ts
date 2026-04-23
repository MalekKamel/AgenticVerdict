import {
  createTestTenantConfig,
  TEST_TENANT_ALPHA,
  TEST_TENANT_BETA,
} from "@agenticverdict/testing";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AgentFactory } from "./agent-factory";
import { parseAgentFactoryConfig, safeParseAgentFactoryConfig } from "./agent-config";
import { AgentTenantContextError } from "./agent-context-integration";
import { AgentJobError, runAgentJob } from "./agent-job";
import { AgentMockChatModel } from "@agenticverdict/testing";
import { createRuleBasedEchoAgent } from "./rule-based-agent";
import { defineTool } from "./tools";

describe("AgentFactory (Phase 6)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("parses config with Zod defaults", () => {
    const cfg = parseAgentFactoryConfig({ runtimeMode: "test", role: "insights" });
    expect(cfg.memoryMode).toBe("buffer");
    expect(cfg.memoryLimits.maxBufferTurns).toBe(32);
  });

  it("safeParseAgentFactoryConfig surfaces Zod errors", () => {
    const r = safeParseAgentFactoryConfig({ role: "invalid" });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.issues.length).toBeGreaterThan(0);
    }
  });

  it("createAgent rejects test runtimeMode", () => {
    const factory = new AgentFactory({ llmEnv: {} });
    expect(() => factory.createAgent({ runtimeMode: "test", role: "analysis" })).toThrow(
      /createTestAgent/,
    );
  });

  it("createTestAgent forces test runtime and runs under tenant scope", async () => {
    const factory = new AgentFactory({ llmEnv: {} });
    const model = new AgentMockChatModel({
      customEntries: [{ id: "t-hello", matchSubstring: "hello", response: "MOCK_HELLO" }],
    });
    const agent = factory.createTestAgent({ role: "analysis", memoryMode: "buffer" }, model);
    const tenant = {
      tenantId: TEST_TENANT_ALPHA,
      requestId: "req-factory-1",
      config: createTestTenantConfig({ tenantId: TEST_TENANT_ALPHA, tenantName: "Alpha Co" }),
    };

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
    const agent = factory.createTestAgent({ role: "analysis" }, new AgentMockChatModel({}));
    const tenant = {
      tenantId: TEST_TENANT_ALPHA,
      requestId: "req-mismatch",
      config: createTestTenantConfig({ tenantId: TEST_TENANT_ALPHA }),
    };

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
      { runtimeMode: "test", role: "analysis" },
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
    const tenant = {
      tenantId: TEST_TENANT_ALPHA,
      requestId: "r-rb",
      config: createTestTenantConfig(),
    };
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
