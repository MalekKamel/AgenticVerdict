import { createSyntheticAdapter } from "@agenticverdict/data-connectors";
import { describe, expect, it, vi } from "vitest";

import { AgentFactory } from "./agent-factory";
import { TenantScopedTtlCache } from "./agent-tools/tenant-context-tools";
import {
  buildSpecializedMarketingFactoryConfig,
  createSpecializedMarketingTestAgent,
} from "./specialized-marketing-agents";

describe("specialized-marketing-agents", () => {
  it("maps kinds to LLM roles and embeds specialization hints", () => {
    const analysisCfg = buildSpecializedMarketingFactoryConfig("cross_platform_analysis", {
      tenantName: "Demo Co",
    });
    expect(analysisCfg.role).toBe("analysis");
    expect(analysisCfg.systemPolicy).toContain("cross-platform");
    expect(analysisCfg.systemPolicy).toContain("Demo Co");

    const insightCfg = buildSpecializedMarketingFactoryConfig("marketing_insight_generation", {
      tenantName: "Demo Co",
    });
    expect(insightCfg.role).toBe("insights");
    expect(insightCfg.systemPolicy).toContain("insight generation");

    const verdictCfg = buildSpecializedMarketingFactoryConfig("media_verdict", {
      tenantName: "Demo Co",
    });
    expect(verdictCfg.role).toBe("verdict");
    expect(verdictCfg.systemPolicy).toContain("media verdict");
    expect(verdictCfg.systemPolicy).toContain("summary");
  });

  it("createSpecializedMarketingTestAgent runs under factory", () => {
    const factory = new AgentFactory({ llmEnv: {} });
    const agent = createSpecializedMarketingTestAgent(factory, "cross_platform_analysis", {
      tenantName: "Acme",
    });
    expect(agent.run).toBeTypeOf("function");
  });

  it("adds platform fetch tools when platform deps are provided", () => {
    const factory = new AgentFactory({ llmEnv: {} });
    const createSpy = vi.spyOn(factory, "createAgentWithTools");
    createSpecializedMarketingTestAgent(factory, "cross_platform_analysis", {
      tenantName: "Acme",
      platformDeps: {
        getAdapter: (platform) => createSyntheticAdapter(platform),
      },
    });
    const calledTools = createSpy.mock.calls.at(0)?.[1] ?? [];
    const toolNames = calledTools.map((tool) => tool.name);
    expect(toolNames).toContain("fetch_meta_metrics");
    expect(toolNames).toContain("fetch_ga4_metrics");
    expect(toolNames).toContain("fetch_gsc_metrics");
    expect(toolNames).toContain("fetch_gbp_metrics");
    expect(toolNames).toContain("fetch_tiktok_metrics");
  });

  it("does not add platform fetch tools when platform deps are omitted", () => {
    const factory = new AgentFactory({ llmEnv: {} });
    const createSpy = vi.spyOn(factory, "createAgentWithTools");
    createSpecializedMarketingTestAgent(factory, "cross_platform_analysis", {
      tenantName: "Acme",
    });
    const calledTools = createSpy.mock.calls.at(0)?.[1] ?? [];
    const toolNames = calledTools.map((tool) => tool.name);
    expect(toolNames).not.toContain("fetch_meta_metrics");
    expect(toolNames).not.toContain("fetch_ga4_metrics");
  });

  it("passes tenant context deps to tenant context tools", () => {
    const factory = new AgentFactory({ llmEnv: {} });
    const createSpy = vi.spyOn(factory, "createAgentWithTools");
    const configCache = new TenantScopedTtlCache<unknown>({ ttlMs: 5_000, maxEntries: 10 });
    createSpecializedMarketingTestAgent(factory, "cross_platform_analysis", {
      tenantName: "Acme",
      tenantContextDeps: { configCache },
    });
    const calledTools = createSpy.mock.calls.at(0)?.[1] ?? [];
    const toolNames = calledTools.map((tool) => tool.name);
    expect(toolNames).toContain("get_tenant_profile");
    expect(toolNames).toContain("get_business_rules");
    expect(toolNames).toContain("get_config");
  });

  it("media verdict policy encodes strict schema constraints", () => {
    const verdictCfg = buildSpecializedMarketingFactoryConfig("media_verdict", {
      tenantName: "Demo Co",
    });
    expect(verdictCfg.systemPolicy).toContain('"sentiment" ("positive"|"neutral"|"negative")');
    expect(verdictCfg.systemPolicy).toContain('"impact" ("high"|"medium"|"low" lowercase only)');
    expect(verdictCfg.systemPolicy).toContain('Do NOT use string patterns like "insight-001"');
    expect(verdictCfg.systemPolicy).toContain('not "+40%"');
    expect(verdictCfg.systemPolicy).toContain(
      '"capturedAt" ISO-8601 e.g. "2024-10-24T00:00:00.000Z"',
    );
  });
});
