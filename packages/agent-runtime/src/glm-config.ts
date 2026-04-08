import { DEFAULT_GLM_MODEL, type AgentLlmCredentialEnv } from "./chat-models";

/**
 * Parsed GLM settings from process (or test) environment.
 * Single source of truth for Docker E2E and runtime chat model construction.
 */
export interface GlmConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  timeoutMs: number;
}

/** Alias matching implementation-plan naming. */
export type GLMConfig = GlmConfig;

const DEFAULT_GLM_BASE_URL = "https://open.bigmodel.cn/api/paas/v4";

/**
 * Read GLM credentials and endpoint options from an env record.
 * Returns null when no API key is present (caller should use mocks or skip live tests).
 */
export function parseGlmConfigFromEnv(env: NodeJS.ProcessEnv): GlmConfig | null {
  const apiKey = env.GLM_API_KEY?.trim();
  if (apiKey === undefined || apiKey === "") {
    return null;
  }

  const rawBase = env.GLM_API_BASE_URL?.trim();
  const baseUrl = (
    rawBase !== undefined && rawBase !== "" ? rawBase : DEFAULT_GLM_BASE_URL
  ).replace(/\/$/, "");

  const modelRaw = env.GLM_MODEL?.trim();
  const model = modelRaw !== undefined && modelRaw !== "" ? modelRaw : DEFAULT_GLM_MODEL;

  const timeoutParsed = parseInt(env.GLM_TIMEOUT ?? "30000", 10);
  const timeoutMs = Number.isFinite(timeoutParsed) && timeoutParsed > 0 ? timeoutParsed : 30_000;

  return { apiKey, baseUrl, model, timeoutMs };
}

/**
 * Map {@link GlmConfig} into the credential slice expected by {@link createGlmChatModel}
 * and {@link createPrimaryAndFallbackChatModels}.
 */
export function glmConfigToCredentialEnv(config: GlmConfig): AgentLlmCredentialEnv {
  return {
    anthropicApiKey: undefined,
    openAiApiKey: undefined,
    glmApiKey: config.apiKey,
    glmApiBaseUrl: config.baseUrl,
    glmModel: config.model,
  };
}

export function isGlmConfiguredInEnv(env: NodeJS.ProcessEnv): boolean {
  return parseGlmConfigFromEnv(env) !== null;
}
