import { afterEach, describe, expect, it, vi } from "vitest";

import { applyLangSmithTracingToProcess } from "./langsmith-tracing";
import { loadLlmEnvFromProcess, parseAgentLlmEnv } from "./llm-env";

describe("parseAgentLlmEnv / loadLlmEnvFromProcess", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("reads optional provider keys and normalizes empty strings", () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "k1");
    vi.stubEnv("OPENAI_API_KEY", "");
    vi.stubEnv("LANGCHAIN_TRACING_V2", "false");
    const env = parseAgentLlmEnv(process.env);
    expect(env.anthropicApiKey).toBe("k1");
    expect(env.openAiApiKey).toBeUndefined();
    expect(env.langsmithTracingEnabled).toBe(false);
  });

  it("defaults tracing on when LangSmith key is set", () => {
    vi.stubEnv("LANGSMITH_API_KEY", "ls-key");
    const env = parseAgentLlmEnv(process.env);
    expect(env.langsmithApiKey).toBe("ls-key");
    expect(env.langsmithTracingEnabled).toBe(true);
  });

  it("accepts LANGCHAIN_API_KEY as LangSmith key alias", () => {
    vi.stubEnv("LANGCHAIN_API_KEY", "lc-key");
    vi.stubEnv("LANGCHAIN_TRACING_V2", "true");
    const env = parseAgentLlmEnv(process.env);
    expect(env.langsmithApiKey).toBe("lc-key");
    expect(env.langsmithTracingEnabled).toBe(true);
  });

  it("loadLlmEnvFromProcess matches parseAgentLlmEnv(process.env)", () => {
    vi.stubEnv("OPENAI_API_KEY", "o1");
    expect(loadLlmEnvFromProcess()).toEqual(parseAgentLlmEnv(process.env));
  });
});

describe("applyLangSmithTracingToProcess", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    delete process.env.LANGCHAIN_TRACING_V2;
    delete process.env.LANGCHAIN_API_KEY;
    delete process.env.LANGCHAIN_PROJECT;
  });

  it("sets LangChain env vars when tracing is enabled and a key exists", () => {
    applyLangSmithTracingToProcess({
      anthropicApiKey: undefined,
      openAiApiKey: undefined,
      langsmithApiKey: "secret",
      langsmithProject: "agenticverdict-dev",
      langsmithTracingEnabled: true,
    });
    expect(process.env.LANGCHAIN_TRACING_V2).toBe("true");
    expect(process.env.LANGCHAIN_API_KEY).toBe("secret");
    expect(process.env.LANGCHAIN_PROJECT).toBe("agenticverdict-dev");
  });

  it("is a no-op when tracing is disabled", () => {
    vi.stubEnv("LANGCHAIN_TRACING_V2", "existing");
    applyLangSmithTracingToProcess({
      anthropicApiKey: undefined,
      openAiApiKey: undefined,
      langsmithApiKey: "secret",
      langsmithProject: undefined,
      langsmithTracingEnabled: false,
    });
    expect(process.env.LANGCHAIN_API_KEY).toBeUndefined();
  });
});
