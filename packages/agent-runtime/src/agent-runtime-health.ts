import { parseAgentLlmEnv } from "./llm-env";

export type AgentRuntimeHealthStatus = "healthy" | "degraded";

export interface AgentRuntimeHealthCheck {
  id: string;
  ok: boolean;
  detail?: string;
}

export interface AgentRuntimeHealthReport {
  status: AgentRuntimeHealthStatus;
  checks: readonly AgentRuntimeHealthCheck[];
  /** True when at least one vendor API key is present (invocation may still fail at runtime). */
  llmInvocationPossible: boolean;
}

/**
 * Lightweight readiness probe for API/worker hooks: env shape, optional provider keys.
 * Does not call external networks.
 */
export function checkAgentRuntimeHealth(
  env: NodeJS.ProcessEnv = process.env,
): AgentRuntimeHealthReport {
  let llmEnvOk = true;
  let llmEnvDetail: string | undefined;
  let parsed: ReturnType<typeof parseAgentLlmEnv> | undefined;

  try {
    parsed = parseAgentLlmEnv(env);
  } catch (e) {
    llmEnvOk = false;
    llmEnvDetail = e instanceof Error ? e.message : "LLM env validation failed";
  }

  const hasAnthropic = Boolean(parsed?.anthropicApiKey);
  const hasOpenAi = Boolean(parsed?.openAiApiKey);
  const llmInvocationPossible = hasAnthropic || hasOpenAi;

  const checks: AgentRuntimeHealthCheck[] = [
    { id: "llm_env_valid", ok: llmEnvOk, detail: llmEnvDetail },
    {
      id: "llm_provider_configured",
      ok: llmInvocationPossible,
      detail: llmInvocationPossible ? undefined : "No ANTHROPIC_API_KEY or OPENAI_API_KEY set",
    },
  ];

  const status: AgentRuntimeHealthStatus =
    llmEnvOk && llmInvocationPossible ? "healthy" : "degraded";

  return { status, checks, llmInvocationPossible };
}
