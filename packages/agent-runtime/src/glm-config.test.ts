import { describe, expect, it } from "vitest";

import {
  glmConfigToCredentialEnv,
  isGlmConfiguredInEnv,
  parseGlmConfigFromEnv,
} from "./glm-config";

describe("parseGlmConfigFromEnv", () => {
  it("returns null without API key", () => {
    expect(parseGlmConfigFromEnv({})).toBeNull();
    expect(parseGlmConfigFromEnv({ GLM_API_KEY: "" })).toBeNull();
    expect(parseGlmConfigFromEnv({ GLM_API_KEY: "   " })).toBeNull();
  });

  it("applies defaults for base URL, model, and timeout", () => {
    const cfg = parseGlmConfigFromEnv({ GLM_API_KEY: "sk-test" });
    expect(cfg).not.toBeNull();
    expect(cfg?.baseUrl).toBe("https://open.bigmodel.cn/api/paas/v4");
    expect(cfg?.model.length).toBeGreaterThan(0);
    expect(cfg?.timeoutMs).toBe(30_000);
  });

  it("trims keys and strips trailing slash on base URL", () => {
    const cfg = parseGlmConfigFromEnv({
      GLM_API_KEY: "  k  ",
      GLM_API_BASE_URL: "https://example.com/v4/  ",
      GLM_MODEL: "  glm-4  ",
      GLM_TIMEOUT: "5000",
    });
    expect(cfg).toEqual({
      apiKey: "k",
      baseUrl: "https://example.com/v4",
      model: "glm-4",
      timeoutMs: 5000,
    });
  });

  it("falls back timeout when invalid", () => {
    expect(parseGlmConfigFromEnv({ GLM_API_KEY: "x", GLM_TIMEOUT: "nope" })?.timeoutMs).toBe(
      30_000,
    );
    expect(parseGlmConfigFromEnv({ GLM_API_KEY: "x", GLM_TIMEOUT: "0" })?.timeoutMs).toBe(30_000);
  });
});

describe("glmConfigToCredentialEnv", () => {
  it("maps into AgentLlmCredentialEnv", () => {
    const env = glmConfigToCredentialEnv({
      apiKey: "a",
      baseUrl: "https://open.bigmodel.cn/api/paas/v4",
      model: "glm-4",
      timeoutMs: 10_000,
    });
    expect(env).toEqual({
      anthropicApiKey: undefined,
      openAiApiKey: undefined,
      glmApiKey: "a",
      glmApiBaseUrl: "https://open.bigmodel.cn/api/paas/v4",
      glmModel: "glm-4",
    });
  });
});

describe("isGlmConfiguredInEnv", () => {
  it("reflects parseGlmConfigFromEnv", () => {
    expect(isGlmConfiguredInEnv({})).toBe(false);
    expect(isGlmConfiguredInEnv({ GLM_API_KEY: "x" })).toBe(true);
  });
});
