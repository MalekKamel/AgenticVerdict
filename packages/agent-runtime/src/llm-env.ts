import { z } from "zod";

/**
 * Typed, validated LLM and LangSmith-related environment.
 * Values are never logged by this package.
 */
const agentLlmEnvSchema = z.object({
  anthropicApiKey: z.string().min(1).optional(),
  openAiApiKey: z.string().min(1).optional(),
  langsmithApiKey: z.string().min(1).optional(),
  langsmithProject: z.string().min(1).optional(),
  /**
   * When true and `langsmithApiKey` is set, callers should sync LangChain tracing env
   * via {@link applyLangSmithTracingToProcess} before invoking models.
   */
  langsmithTracingEnabled: z.boolean(),
});

export type AgentLlmEnv = z.infer<typeof agentLlmEnvSchema>;

/** @deprecated Use {@link AgentLlmEnv} — kept for older imports that only need keys. */
export type LlmProviderEnv = Pick<AgentLlmEnv, "anthropicApiKey" | "openAiApiKey">;

function emptyToUndefined(value: string | undefined): string | undefined {
  if (value === undefined || value === "") {
    return undefined;
  }
  return value;
}

function parseTracingFlag(value: string | undefined): boolean | undefined {
  if (value === undefined || value === "") {
    return undefined;
  }
  const normalized = value.trim().toLowerCase();
  if (["true", "1", "yes"].includes(normalized)) {
    return true;
  }
  if (["false", "0", "no"].includes(normalized)) {
    return false;
  }
  return undefined;
}

/**
 * Parse LLM + LangSmith settings from a generic env record (e.g. `process.env`).
 * Tracing defaults to enabled when a LangSmith API key is present unless
 * `LANGCHAIN_TRACING_V2` is explicitly set to a falsy value.
 */
export function parseAgentLlmEnv(env: NodeJS.ProcessEnv): AgentLlmEnv {
  const anthropicApiKey = emptyToUndefined(env.ANTHROPIC_API_KEY);
  const openAiApiKey = emptyToUndefined(env.OPENAI_API_KEY);
  const langsmithApiKey = emptyToUndefined(env.LANGSMITH_API_KEY ?? env.LANGCHAIN_API_KEY);
  const langsmithProject = emptyToUndefined(env.LANGCHAIN_PROJECT);
  const explicitTracing = parseTracingFlag(env.LANGCHAIN_TRACING_V2);
  const langsmithTracingEnabled = explicitTracing ?? langsmithApiKey !== undefined;

  return agentLlmEnvSchema.parse({
    anthropicApiKey,
    openAiApiKey,
    langsmithApiKey,
    langsmithProject,
    langsmithTracingEnabled,
  });
}

export function loadLlmEnvFromProcess(): AgentLlmEnv {
  return parseAgentLlmEnv(process.env);
}
