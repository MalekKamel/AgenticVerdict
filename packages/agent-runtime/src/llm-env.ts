/**
 * Typed view of LLM-related environment variables. Phase 2 wires real providers.
 * Values are never logged by this package.
 */
export interface LlmProviderEnv {
  anthropicApiKey?: string;
  openAiApiKey?: string;
}

function readOptionalEnv(key: string): string | undefined {
  const v = process.env[key];
  return v === undefined || v === "" ? undefined : v;
}

export function loadLlmEnvFromProcess(): LlmProviderEnv {
  return {
    anthropicApiKey: readOptionalEnv("ANTHROPIC_API_KEY"),
    openAiApiKey: readOptionalEnv("OPENAI_API_KEY"),
  };
}
