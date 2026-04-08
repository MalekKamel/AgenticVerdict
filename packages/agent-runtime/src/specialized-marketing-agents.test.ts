import { describe, expect, it } from "vitest";

import { AgentFactory } from "./agent-factory";
import {
  buildSpecializedMarketingFactoryConfig,
  createSpecializedMarketingTestAgent,
} from "./specialized-marketing-agents";

describe("specialized-marketing-agents", () => {
  it("maps kinds to LLM roles and embeds specialization hints", () => {
    const analysisCfg = buildSpecializedMarketingFactoryConfig("cross_platform_analysis", {
      companyName: "Demo Co",
    });
    expect(analysisCfg.role).toBe("analysis");
    expect(analysisCfg.systemPolicy).toContain("cross-platform");
    expect(analysisCfg.systemPolicy).toContain("Demo Co");

    const insightCfg = buildSpecializedMarketingFactoryConfig("marketing_insight_generation", {
      companyName: "Demo Co",
    });
    expect(insightCfg.role).toBe("insights");
    expect(insightCfg.systemPolicy).toContain("insight generation");

    const verdictCfg = buildSpecializedMarketingFactoryConfig("media_verdict", {
      companyName: "Demo Co",
    });
    expect(verdictCfg.role).toBe("verdict");
    expect(verdictCfg.systemPolicy).toContain("media verdict");
    expect(verdictCfg.systemPolicy).toContain("summary");
  });

  it("createSpecializedMarketingTestAgent runs under factory", () => {
    const factory = new AgentFactory({ llmEnv: {} });
    const agent = createSpecializedMarketingTestAgent(factory, "cross_platform_analysis", {
      companyName: "Acme",
    });
    expect(agent.run).toBeTypeOf("function");
  });

  it("media verdict policy encodes strict schema constraints", () => {
    const verdictCfg = buildSpecializedMarketingFactoryConfig("media_verdict", {
      companyName: "Demo Co",
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
