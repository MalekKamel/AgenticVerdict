import { describe, expect, it } from "vitest";

import { checkAgentRuntimeHealth } from "./agent-runtime-health";

describe("checkAgentRuntimeHealth", () => {
  it("reports healthy when env parses and a provider key exists", () => {
    const report = checkAgentRuntimeHealth({
      ANTHROPIC_API_KEY: "sk-test",
      LANGCHAIN_TRACING_V2: "false",
    });
    expect(report.status).toBe("healthy");
    expect(report.llmInvocationPossible).toBe(true);
    expect(report.checks.find((c) => c.id === "llm_env_valid")?.ok).toBe(true);
    expect(report.checks.find((c) => c.id === "llm_provider_configured")?.ok).toBe(true);
  });

  it("reports degraded when no provider keys are set", () => {
    const report = checkAgentRuntimeHealth({
      ANTHROPIC_API_KEY: "",
      OPENAI_API_KEY: "",
      LANGCHAIN_TRACING_V2: "false",
    });
    expect(report.status).toBe("degraded");
    expect(report.llmInvocationPossible).toBe(false);
    expect(report.checks.find((c) => c.id === "llm_provider_configured")?.ok).toBe(false);
  });
});
