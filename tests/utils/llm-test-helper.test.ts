import { afterEach, describe, expect, it, vi } from "vitest";

import { LLMTestBudgetTracker, LLMTestHelper } from "./llm-test-helper";

describe("LLMTestHelper", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("getE2eLlmProvider follows live GLM gate only", () => {
    vi.stubEnv("AGENT_RUNTIME_LIVE_LLM", "0");
    vi.stubEnv("GLM_API_KEY", "k");
    expect(LLMTestHelper.getE2eLlmProvider()).toBe("mock");
    vi.stubEnv("AGENT_RUNTIME_LIVE_LLM", "1");
    expect(LLMTestHelper.getE2eLlmProvider()).toBe("glm");
  });

  it("getLLMProvider prefers live GLM over other keys when live mode is on", () => {
    vi.stubEnv("AGENT_RUNTIME_LIVE_LLM", "1");
    vi.stubEnv("GLM_API_KEY", "g");
    vi.stubEnv("ANTHROPIC_API_KEY", "a");
    expect(LLMTestHelper.getLLMProvider()).toBe("glm");
  });

  it("getLLMProvider returns mock when live mode is off even if keys exist", () => {
    vi.stubEnv("AGENT_RUNTIME_LIVE_LLM", "0");
    vi.stubEnv("ANTHROPIC_API_KEY", "a");
    expect(LLMTestHelper.getLLMProvider()).toBe("mock");
  });

  it("shouldUseLiveLLM requires AGENT_RUNTIME_LIVE_LLM and GLM_API_KEY", () => {
    vi.stubEnv("AGENT_RUNTIME_LIVE_LLM", "1");
    expect(LLMTestHelper.shouldUseLiveLLM()).toBe(false);
    vi.stubEnv("GLM_API_KEY", "k");
    expect(LLMTestHelper.shouldUseLiveLLM()).toBe(true);
  });

  it("parseGLMConfig returns null without an API key", () => {
    expect(LLMTestHelper.parseGLMConfig({})).toBeNull();
  });

  it("parseGLMConfig returns glm config when key is set", () => {
    const cfg = LLMTestHelper.parseGLMConfig({
      GLM_API_KEY: "x",
      GLM_API_BASE_URL: "https://open.bigmodel.cn/api/paas/v4",
      GLM_MODEL: "glm-4",
      GLM_TIMEOUT: "5000",
    });
    expect(cfg?.provider).toBe("glm");
    expect(cfg?.model).toBe("glm-4");
    expect(cfg?.timeout).toBe(5000);
  });

  it("evaluateResponse delegates to phrase overlap rules", () => {
    const ok = LLMTestHelper.evaluateResponse("hello world", { requiredKeywords: ["hello"] });
    expect(ok.passed).toBe(true);
    const bad = LLMTestHelper.evaluateResponse("hello", { requiredKeywords: ["missing"] });
    expect(bad.passed).toBe(false);
  });

  it("estimateGLMCost includes glm-4.7 tier", () => {
    const c = LLMTestHelper.estimateGLMCost(1000, 1000, "glm-4.7");
    expect(c).toBeGreaterThan(0);
  });
});

describe("LLMTestBudgetTracker", () => {
  it("allows tracking until limit is exceeded", () => {
    const tracker = new LLMTestBudgetTracker({ glm: 0.01 });
    expect(tracker.trackCost("glm", 100, 100, "glm-4")).toBe(true);
    expect(tracker.trackCost("glm", 1_000_000, 1_000_000, "glm-4")).toBe(false);
  });
});
