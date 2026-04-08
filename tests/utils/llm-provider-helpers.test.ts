import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createLLMTestContext,
  getAvailableLLMProviders,
  parseLLMProviderConfigFromEnv,
  pickFirstConfiguredProvider,
  resolveLLMProviderPreferenceOrder,
  validateLLMProvider,
} from "./llm-provider-helpers";

describe("parseLLMProviderConfigFromEnv / getAvailableLLMProviders", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns undefined when keys missing", () => {
    expect(parseLLMProviderConfigFromEnv("anthropic", {})).toBeUndefined();
    expect(getAvailableLLMProviders({})).toEqual([]);
  });

  it("detects anthropic and openai when keys set", () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "k");
    vi.stubEnv("OPENAI_API_KEY", "o");
    expect(getAvailableLLMProviders(process.env).sort()).toEqual(["anthropic", "openai"]);
  });

  it("parses GLM when key is set (default base URL from glm-config)", () => {
    vi.stubEnv("GLM_API_KEY", "g");
    const withDefaultBase = parseLLMProviderConfigFromEnv("glm", process.env);
    expect(withDefaultBase?.provider).toBe("glm");
    expect(withDefaultBase?.baseUrl).toContain("bigmodel");
    vi.stubEnv("GLM_API_BASE_URL", "https://example.com/v1");
    expect(parseLLMProviderConfigFromEnv("glm", process.env)?.baseUrl).toBe(
      "https://example.com/v1",
    );
  });
});

describe("resolveLLMProviderPreferenceOrder / pickFirstConfiguredProvider", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("orders providers with preferred first", () => {
    expect(resolveLLMProviderPreferenceOrder("glm")).toEqual(["glm", "anthropic", "openai"]);
  });

  it("picks first configured in order", () => {
    vi.stubEnv("OPENAI_API_KEY", "o");
    expect(pickFirstConfiguredProvider(["anthropic", "openai"], process.env)).toBe("openai");
  });
});

describe("createLLMTestContext", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("detects mock when AGENT_RUNTIME_LIVE_LLM is not 1", () => {
    vi.stubEnv("AGENT_RUNTIME_LIVE_LLM", "0");
    expect(createLLMTestContext(process.env).mockLlmForced).toBe(true);
    vi.stubEnv("AGENT_RUNTIME_LIVE_LLM", "1");
    expect(createLLMTestContext(process.env).mockLlmForced).toBe(false);
  });
});

describe("validateLLMProvider", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("returns ok=false with error on non-OK HTTP", async () => {
    globalThis.fetch = vi.fn(async () =>
      Promise.resolve({
        ok: false,
        status: 401,
        text: async () => "unauthorized",
      } as Response),
    );
    const out = await validateLLMProvider({
      provider: "openai",
      apiKey: "x",
      model: "gpt-4o-mini",
    });
    expect(out.configured).toBe(true);
    expect(out.ok).toBe(false);
    expect(out.error).toContain("401");
  });
});
