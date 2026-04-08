import { ChatAnthropic } from "@langchain/anthropic";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { AIMessage, type BaseMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";

import type { AgentLlmEnv } from "./llm-env";
import { type RetryOptions, withPrimaryFallback, withRetries } from "./resilience";

/** Default chat models aligned with project stack docs (CLAUDE.md / Phase 2 tasks). */
export const DEFAULT_CLAUDE_3_5_SONNET_MODEL = "claude-3-5-sonnet-20241022";
export const DEFAULT_GPT_4_TURBO_MODEL = "gpt-4-turbo";
export const DEFAULT_GLM_MODEL = "glm-4.7";

export type AgentLlmRole = "verdict" | "insights" | "analysis";

export type LlmPrimaryPreference = "anthropic" | "openai" | "glm";

export interface AgentTypeModelPreset {
  primary: LlmPrimaryPreference;
  anthropicModel: string;
  openAiModel: string;
  glmModel: string;
  temperature: number;
}

/** Credential slice used when constructing chat models (includes optional GLM base URL). */
export type AgentLlmCredentialEnv = Pick<
  AgentLlmEnv,
  "anthropicApiKey" | "openAiApiKey" | "glmApiKey" | "glmApiBaseUrl" | "glmModel"
>;

/** OpenAI-compatible GLM client; distinct {@link BaseChatModel._llmType} for observability. */
export class ChatGlm extends ChatOpenAI {
  override _llmType(): string {
    return "zhipu-glm";
  }
}

/**
 * Presets per agent kind: verdict favors Claude; analysis can favor faster OpenAI per tasks.md.
 */
export const DEFAULT_AGENT_MODEL_PRESETS: Record<AgentLlmRole, AgentTypeModelPreset> = {
  verdict: {
    primary: "anthropic",
    anthropicModel: DEFAULT_CLAUDE_3_5_SONNET_MODEL,
    openAiModel: DEFAULT_GPT_4_TURBO_MODEL,
    glmModel: DEFAULT_GLM_MODEL,
    temperature: 0.1,
  },
  insights: {
    primary: "anthropic",
    anthropicModel: DEFAULT_CLAUDE_3_5_SONNET_MODEL,
    openAiModel: DEFAULT_GPT_4_TURBO_MODEL,
    glmModel: DEFAULT_GLM_MODEL,
    temperature: 0.2,
  },
  analysis: {
    primary: "openai",
    anthropicModel: DEFAULT_CLAUDE_3_5_SONNET_MODEL,
    openAiModel: DEFAULT_GPT_4_TURBO_MODEL,
    glmModel: DEFAULT_GLM_MODEL,
    temperature: 0.2,
  },
};

export class LlmConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LlmConfigurationError";
  }
}

export interface CreateChatModelOptions {
  anthropicApiKey?: string;
  openAiApiKey?: string;
  glmApiKey?: string;
  glmApiBaseUrl?: string;
  anthropicModel?: string;
  openAiModel?: string;
  glmModel?: string;
  temperature?: number;
}

export function createAnthropicChatModel(options: CreateChatModelOptions): ChatAnthropic {
  const apiKey = options.anthropicApiKey;
  if (apiKey === undefined) {
    throw new LlmConfigurationError(
      "Anthropic chat model requires anthropicApiKey (ANTHROPIC_API_KEY).",
    );
  }
  return new ChatAnthropic({
    apiKey,
    model: options.anthropicModel ?? DEFAULT_CLAUDE_3_5_SONNET_MODEL,
    temperature: options.temperature ?? 0,
  });
}

export function createOpenAiChatModel(options: CreateChatModelOptions): ChatOpenAI {
  const apiKey = options.openAiApiKey;
  if (apiKey === undefined) {
    throw new LlmConfigurationError("OpenAI chat model requires openAiApiKey (OPENAI_API_KEY).");
  }
  return new ChatOpenAI({
    apiKey,
    model: options.openAiModel ?? DEFAULT_GPT_4_TURBO_MODEL,
    temperature: options.temperature ?? 0,
  });
}

export function createGlmChatModel(options: CreateChatModelOptions): BaseChatModel {
  const apiKey = options.glmApiKey;
  const baseUrl = options.glmApiBaseUrl;
  if (apiKey === undefined || baseUrl === undefined) {
    throw new LlmConfigurationError(
      "GLM chat model requires glmApiKey (GLM_API_KEY) and glmApiBaseUrl (GLM_API_BASE_URL).",
    );
  }

  // Detect if this is an Anthropic-compatible endpoint (e.g., z.ai's /api/anthropic)
  const isAnthropicFormat = baseUrl.includes("/anthropic") || baseUrl.endsWith("/api/anthropic");

  const model = options.glmModel ?? DEFAULT_GLM_MODEL;
  const temperature = options.temperature ?? 0;

  if (isAnthropicFormat) {
    // Anthropic-compatible proxy (e.g. z.ai `/api/anthropic`): use LangChain-supported client options.
    return new ChatAnthropic({
      apiKey,
      model,
      temperature,
      anthropicApiUrl: baseUrl,
      clientOptions: {
        defaultHeaders: {
          "anthropic-version": "2023-06-01",
        },
      },
    });
  }

  // Use OpenAI-compatible format
  return new ChatGlm({
    apiKey,
    model,
    temperature,
    configuration: {
      baseURL: baseUrl,
    },
  });
}

export function createChatModelForPreference(
  preference: LlmPrimaryPreference,
  options: CreateChatModelOptions,
): BaseChatModel {
  if (preference === "anthropic") {
    return createAnthropicChatModel(options);
  }
  if (preference === "openai") {
    return createOpenAiChatModel(options);
  }
  return createGlmChatModel(options);
}

function providerCandidates(preference: LlmPrimaryPreference): LlmPrimaryPreference[] {
  const order: Record<LlmPrimaryPreference, LlmPrimaryPreference[]> = {
    anthropic: ["anthropic", "openai", "glm"],
    openai: ["openai", "anthropic", "glm"],
    glm: ["glm", "anthropic", "openai"],
  };
  return order[preference];
}

export function isLlmProviderConfigured(
  provider: LlmPrimaryPreference,
  env: AgentLlmCredentialEnv,
): boolean {
  if (provider === "anthropic") {
    return env.anthropicApiKey !== undefined;
  }
  if (provider === "openai") {
    return env.openAiApiKey !== undefined;
  }
  return env.glmApiKey !== undefined && env.glmApiBaseUrl !== undefined;
}

/**
 * Picks the first provider in the preset order that has usable credentials (GLM needs key + base URL).
 */
export function resolveProviderWithAvailableKeys(
  preference: LlmPrimaryPreference,
  env: AgentLlmCredentialEnv,
): LlmPrimaryPreference {
  for (const p of providerCandidates(preference)) {
    if (isLlmProviderConfigured(p, env)) {
      return p;
    }
  }
  return preference;
}

function buildCreateChatModelOptionsFromPreset(
  preset: AgentTypeModelPreset,
  env: AgentLlmCredentialEnv,
  temperature: number,
): CreateChatModelOptions {
  const glmModel = env.glmModel ?? preset.glmModel;
  return {
    anthropicApiKey: env.anthropicApiKey,
    openAiApiKey: env.openAiApiKey,
    glmApiKey: env.glmApiKey,
    glmApiBaseUrl: env.glmApiBaseUrl,
    anthropicModel: preset.anthropicModel,
    openAiModel: preset.openAiModel,
    glmModel,
    temperature,
  };
}

/**
 * Primary model follows the preset order; optional fallback is the next configured provider.
 */
export function createPrimaryAndFallbackChatModels(
  role: AgentLlmRole,
  env: AgentLlmCredentialEnv,
  temperatureOverride?: number,
): { primary: BaseChatModel; fallback?: BaseChatModel } {
  const preset = DEFAULT_AGENT_MODEL_PRESETS[role];
  const temperature = temperatureOverride ?? preset.temperature;
  const configured = providerCandidates(preset.primary).filter((p) =>
    isLlmProviderConfigured(p, env),
  );
  if (configured.length === 0) {
    throw new LlmConfigurationError(
      "No LLM credentials configured (set ANTHROPIC_API_KEY, OPENAI_API_KEY, or GLM_API_KEY + GLM_API_BASE_URL).",
    );
  }
  const opts = buildCreateChatModelOptionsFromPreset(preset, env, temperature);
  const primary = createChatModelForPreference(configured[0]!, opts);
  const secondary = configured[1];
  const fallback =
    secondary !== undefined ? createChatModelForPreference(secondary, opts) : undefined;
  return { primary, fallback };
}

/** Heuristic for vendor HTTP errors and connection drops suitable for provider fallback. */
export function isTransientLlmError(error: unknown): boolean {
  if (error === null || typeof error !== "object") {
    return false;
  }
  const record = error as Record<string, unknown>;
  const status = record.status;
  if (typeof status === "number") {
    return status === 429 || status === 500 || status === 502 || status === 503;
  }
  const code = record.code;
  if (code === "ECONNRESET" || code === "ETIMEDOUT") {
    return true;
  }
  const name = typeof record.name === "string" ? record.name : "";
  return name.includes("APIConnection") || name.includes("RateLimit");
}

export type LlmProviderFallbackEvent = {
  stage: "primary_to_secondary";
  error: unknown;
};

export type LlmRuleBasedFallbackEvent = {
  error: unknown;
};

export interface InvokeChatModelResilienceOptions {
  /** Merged onto defaults: single attempt, {@link isTransientLlmError} only when you set retry fields. */
  retry?: Partial<RetryOptions>;
  onProviderFallback?: (event: LlmProviderFallbackEvent) => void;
  onRuleBasedFallback?: (event: LlmRuleBasedFallbackEvent) => void;
  /**
   * When true, a transient failure from the secondary provider (after primary already failed transient)
   * yields {@link buildRuleBasedDegradedAiMessage} instead of throwing.
   */
  useRuleBasedDegradation?: boolean;
}

/** Production-oriented backoff: up to 4 attempts, 1s → 16s cap, exponential ×2 with jitter. */
export const DEFAULT_PRODUCTION_LLM_RETRY_OPTIONS: RetryOptions = {
  maxAttempts: 4,
  initialDelayMs: 1000,
  maxDelayMs: 16_000,
  backoffMultiplier: 2,
  jitter: true,
  retryOn: isTransientLlmError,
};

function defaultInvokeRetryOptions(override?: Partial<RetryOptions>): RetryOptions {
  return {
    maxAttempts: 1,
    retryOn: isTransientLlmError,
    ...override,
  };
}

/**
 * Deterministic last-resort assistant message when both LLM providers fail (tasks.md 5.2).
 */
export function buildRuleBasedDegradedAiMessage(messages: BaseMessage[]): AIMessage {
  let snippet = "your request";
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const m = messages[i];
    if (m !== undefined && m._getType() === "human") {
      const c = m.content;
      const text = typeof c === "string" ? c : JSON.stringify(c);
      snippet = text.slice(0, 240);
      break;
    }
  }
  return new AIMessage({
    content: `[rule-based-degraded] LLM providers unavailable after retries. Acknowledged: ${snippet}`,
  });
}

export async function invokeChatModelWithProviderFallback(
  messages: BaseMessage[],
  primary: BaseChatModel,
  fallback: BaseChatModel | undefined,
  resilience?: InvokeChatModelResilienceOptions,
): Promise<BaseMessage> {
  const retryOpts = defaultInvokeRetryOptions(resilience?.retry);

  const invokeWithRetry = (model: BaseChatModel) =>
    withRetries(retryOpts, () => model.invoke(messages));

  if (fallback === undefined) {
    return invokeWithRetry(primary);
  }

  return withPrimaryFallback(
    () => invokeWithRetry(primary),
    async () => {
      try {
        return await invokeWithRetry(fallback);
      } catch (fallbackError: unknown) {
        if (resilience?.useRuleBasedDegradation === true && isTransientLlmError(fallbackError)) {
          resilience.onRuleBasedFallback?.({ error: fallbackError });
          return buildRuleBasedDegradedAiMessage(messages);
        }
        throw fallbackError;
      }
    },
    isTransientLlmError,
    resilience?.onProviderFallback
      ? (error: unknown) =>
          resilience.onProviderFallback?.({ stage: "primary_to_secondary", error })
      : undefined,
  );
}
