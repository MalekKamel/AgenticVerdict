import { afterEach, describe, expect, it, vi } from "vitest";

import { loadLlmEnvFromProcess } from "./llm-env";

describe("loadLlmEnvFromProcess", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("reads optional keys", () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "k1");
    vi.stubEnv("OPENAI_API_KEY", "");
    const env = loadLlmEnvFromProcess();
    expect(env.anthropicApiKey).toBe("k1");
    expect(env.openAiApiKey).toBeUndefined();
  });
});
