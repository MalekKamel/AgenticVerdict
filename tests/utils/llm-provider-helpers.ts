import { parseGlmConfigFromEnv } from "@agenticverdict/agent-runtime";

export type LLMProviderName = "anthropic" | "openai" | "glm";

export interface LLMProviderConfig {
  provider: LLMProviderName;
  apiKey: string;
  baseUrl?: string;
  model: string;
  /** When set (typically GLM), used as default HTTP timeout for {@link validateLLMProvider}. */
  timeoutMs?: number;
}

export interface LLMProviderTestResult {
  provider: LLMProviderName;
  configured: boolean;
  ok: boolean;
  responseTimeMs?: number;
  error?: string;
  /** Raw response body from LLM (when successful and logging enabled) */
  responseBody?: unknown;
}

export interface LLMTestContext {
  readonly mockLlmForced: boolean;
  readonly anthropicConfigured: boolean;
  readonly openaiConfigured: boolean;
  readonly glmConfigured: boolean;
}

/** LLM test logging verbosity controlled by environment variable. */
interface LLMTestLogger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}

/** Create logger based on SCENARIO_VERBOSE_LLM environment variable. */
function createLLMTestLogger(): LLMTestLogger {
  const verbose = process.env.SCENARIO_VERBOSE_LLM === "1" || process.env.VERBOSE === "1";
  return {
    debug: verbose
      ? (message, ...args) => console.log(`[LLM:DEBUG] ${message}`, ...args)
      : () => undefined,
    info: (message, ...args) => console.log(`[LLM:INFO] ${message}`, ...args),
    error: (message, ...args) => console.error(`[LLM:ERROR] ${message}`, ...args),
  };
}

/** Mask API key for logging (show first 8 chars only). */
function maskApiKey(key: string): string {
  if (key.length <= 8) return "***";
  return `${key.slice(0, 8)}...`;
}

function emptyToUndefined(value: string | undefined): string | undefined {
  if (value === undefined || value === "") {
    return undefined;
  }
  return value;
}

export function parseLLMProviderConfigFromEnv(
  provider: LLMProviderName,
  env: NodeJS.ProcessEnv = process.env,
): LLMProviderConfig | undefined {
  if (provider === "anthropic") {
    const apiKey = emptyToUndefined(env.ANTHROPIC_API_KEY);
    if (apiKey === undefined) {
      return undefined;
    }
    return {
      provider,
      apiKey,
      model: emptyToUndefined(env.ANTHROPIC_TEST_MODEL) ?? "claude-3-5-haiku-20241022",
    };
  }
  if (provider === "openai") {
    const apiKey = emptyToUndefined(env.OPENAI_API_KEY);
    if (apiKey === undefined) {
      return undefined;
    }
    return {
      provider,
      apiKey,
      model: emptyToUndefined(env.OPENAI_TEST_MODEL) ?? "gpt-4o-mini",
    };
  }
  const glm = parseGlmConfigFromEnv(env);
  if (glm === null) {
    return undefined;
  }
  return {
    provider: "glm",
    apiKey: glm.apiKey,
    baseUrl: glm.baseUrl,
    model: glm.model,
    timeoutMs: glm.timeoutMs,
  };
}

export function getAvailableLLMProviders(env: NodeJS.ProcessEnv = process.env): LLMProviderName[] {
  const out: LLMProviderName[] = [];
  for (const p of ["anthropic", "openai", "glm"] as const) {
    if (parseLLMProviderConfigFromEnv(p, env) !== undefined) {
      out.push(p);
    }
  }
  return out;
}

async function timedFetch(
  input: RequestInfo | URL,
  init: RequestInit,
  timeoutMs = 15_000,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Minimal connectivity probe per provider (small completion where applicable).
 * Logs request/response details when SCENARIO_VERBOSE_LLM=1 or VERBOSE=1.
 */
export async function validateLLMProvider(
  config: LLMProviderConfig,
  options?: { timeoutMs?: number },
): Promise<LLMProviderTestResult> {
  const timeoutMs = options?.timeoutMs ?? config.timeoutMs ?? 20_000;
  const t0 = performance.now();
  const logger = createLLMTestLogger();

  try {
    if (config.provider === "anthropic") {
      const requestBody = {
        model: config.model,
        max_tokens: 1,
        messages: [{ role: "user", content: "ping" }],
      };
      logger.info(`[Anthropic] Sending request to https://api.anthropic.com/v1/messages`);
      logger.debug(`[Anthropic] Request body: ${JSON.stringify(requestBody)}`);
      logger.debug(`[Anthropic] API Key: ${maskApiKey(config.apiKey)}`);
      logger.debug(`[Anthropic] Model: ${config.model}`);

      const res = await timedFetch(
        "https://api.anthropic.com/v1/messages",
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-api-key": config.apiKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify(requestBody),
        },
        timeoutMs,
      );

      const responseTime = performance.now() - t0;
      logger.debug(`[Anthropic] Response status: ${res.status} ${res.statusText}`);
      logger.debug(`[Anthropic] Response time: ${responseTime.toFixed(0)}ms`);

      if (!res.ok) {
        const body = await res.text();
        logger.error(`[Anthropic] Request failed: HTTP ${res.status}`);
        logger.error(`[Anthropic] Error body: ${body.slice(0, 500)}`);
        return {
          provider: config.provider,
          configured: true,
          ok: false,
          responseTimeMs: responseTime,
          error: `HTTP ${res.status}: ${body.slice(0, 200)}`,
        };
      }

      const responseBody = await res.json();
      logger.info(`[Anthropic] ✓ Connectivity successful (${responseTime.toFixed(0)}ms)`);
      logger.debug(`[Anthropic] Response body: ${JSON.stringify(responseBody)}`);

      return {
        provider: config.provider,
        configured: true,
        ok: true,
        responseTimeMs: responseTime,
        responseBody,
      };
    }

    if (config.provider === "openai") {
      const requestBody = {
        model: config.model,
        max_tokens: 1,
        messages: [{ role: "user", content: "ping" }],
      };
      logger.info(`[OpenAI] Sending request to https://api.openai.com/v1/chat/completions`);
      logger.debug(`[OpenAI] Request body: ${JSON.stringify(requestBody)}`);
      logger.debug(`[OpenAI] API Key: ${maskApiKey(config.apiKey)}`);
      logger.debug(`[OpenAI] Model: ${config.model}`);

      const res = await timedFetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            authorization: `Bearer ${config.apiKey}`,
            "content-type": "application/json",
          },
          body: JSON.stringify(requestBody),
        },
        timeoutMs,
      );

      const responseTime = performance.now() - t0;
      logger.debug(`[OpenAI] Response status: ${res.status} ${res.statusText}`);
      logger.debug(`[OpenAI] Response time: ${responseTime.toFixed(0)}ms`);

      if (!res.ok) {
        const body = await res.text();
        logger.error(`[OpenAI] Request failed: HTTP ${res.status}`);
        logger.error(`[OpenAI] Error body: ${body.slice(0, 500)}`);
        return {
          provider: config.provider,
          configured: true,
          ok: false,
          responseTimeMs: responseTime,
          error: `HTTP ${res.status}: ${body.slice(0, 200)}`,
        };
      }

      const responseBody = await res.json();
      logger.info(`[OpenAI] ✓ Connectivity successful (${responseTime.toFixed(0)}ms)`);
      logger.debug(`[OpenAI] Response body: ${JSON.stringify(responseBody)}`);

      return {
        provider: config.provider,
        configured: true,
        ok: true,
        responseTimeMs: responseTime,
        responseBody,
      };
    }

    // GLM provider
    const base = config.baseUrl ?? "";

    // Detect if this is an Anthropic-compatible endpoint (e.g., z.ai's /api/anthropic)
    const isAnthropicFormat = base.includes("/anthropic") || base.endsWith("/api/anthropic");

    let url: string;
    let headers: Record<string, string>;
    let requestBody: unknown;

    if (isAnthropicFormat) {
      // Use Anthropic Messages API format
      url = `${base}/v1/messages`;
      headers = {
        "content-type": "application/json",
        "x-api-key": config.apiKey,
        "anthropic-version": "2023-06-01",
      };
      requestBody = {
        model: config.model,
        max_tokens: 10,
        messages: [{ role: "user", content: "ping" }],
      };
      logger.info(`[GLM:Anthropic] Sending request to ${url}`);
      logger.debug(`[GLM:Anthropic] Request body: ${JSON.stringify(requestBody)}`);
      logger.debug(`[GLM:Anthropic] API Key: ${maskApiKey(config.apiKey)}`);
      logger.debug(`[GLM:Anthropic] Base URL: ${base}`);
      logger.debug(`[GLM:Anthropic] Model: ${config.model}`);
    } else {
      // Use OpenAI-compatible format
      url = `${base}/chat/completions`;
      headers = {
        authorization: `Bearer ${config.apiKey}`,
        "content-type": "application/json",
      };
      requestBody = {
        model: config.model,
        max_tokens: 10,
        messages: [{ role: "user", content: "ping" }],
      };
      logger.info(`[GLM:OpenAI] Sending request to ${url}`);
      logger.debug(`[GLM:OpenAI] Request body: ${JSON.stringify(requestBody)}`);
      logger.debug(`[GLM:OpenAI] API Key: ${maskApiKey(config.apiKey)}`);
      logger.debug(`[GLM:OpenAI] Base URL: ${base}`);
      logger.debug(`[GLM:OpenAI] Model: ${config.model}`);
    }

    const res = await timedFetch(
      url,
      {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody),
      },
      timeoutMs,
    );

    const responseTime = performance.now() - t0;
    const prefix = isAnthropicFormat ? "[GLM:Anthropic]" : "[GLM:OpenAI]";
    logger.debug(`${prefix} Response status: ${res.status} ${res.statusText}`);
    logger.debug(`${prefix} Response time: ${responseTime.toFixed(0)}ms`);

    if (!res.ok) {
      const body = await res.text();
      logger.error(`${prefix} Request failed: HTTP ${res.status}`);
      logger.error(`${prefix} Error body: ${body.slice(0, 500)}`);
      return {
        provider: "glm",
        configured: true,
        ok: false,
        responseTimeMs: responseTime,
        error: `HTTP ${res.status}: ${body.slice(0, 200)}`,
      };
    }

    const responseBody = await res.json();
    logger.info(`${prefix} ✓ Connectivity successful (${responseTime.toFixed(0)}ms)`);
    logger.debug(`${prefix} Response body: ${JSON.stringify(responseBody)}`);

    return {
      provider: "glm",
      configured: true,
      ok: true,
      responseTimeMs: responseTime,
      responseBody,
    };
  } catch (e) {
    const responseTime = performance.now() - t0;
    const msg = e instanceof Error ? e.message : String(e);
    logger.error(`[${config.provider.toUpperCase()}] Exception: ${msg}`);
    return {
      provider: config.provider,
      configured: true,
      ok: false,
      responseTimeMs: responseTime,
      error: msg,
    };
  }
}

export async function testLLMConnectivity(
  provider: LLMProviderName,
  env: NodeJS.ProcessEnv = process.env,
): Promise<LLMProviderTestResult> {
  const config = parseLLMProviderConfigFromEnv(provider, env);
  if (config === undefined) {
    return { provider, configured: false, ok: false };
  }
  return validateLLMProvider(config);
}

export function createLLMTestContext(env: NodeJS.ProcessEnv = process.env): LLMTestContext {
  const mock = env.AGENT_RUNTIME_LIVE_LLM !== "1";
  return {
    mockLlmForced: mock,
    anthropicConfigured: parseLLMProviderConfigFromEnv("anthropic", env) !== undefined,
    openaiConfigured: parseLLMProviderConfigFromEnv("openai", env) !== undefined,
    glmConfigured: parseLLMProviderConfigFromEnv("glm", env) !== undefined,
  };
}

export function resolveLLMProviderPreferenceOrder(
  preferred: LLMProviderName,
): readonly LLMProviderName[] {
  const all: LLMProviderName[] = ["anthropic", "openai", "glm"];
  const rest = all.filter((p) => p !== preferred);
  return [preferred, ...rest];
}

/**
 * First provider in `order` that is configured in env (GLM requires base URL + key).
 */
export function pickFirstConfiguredProvider(
  order: readonly LLMProviderName[],
  env: NodeJS.ProcessEnv = process.env,
): LLMProviderName | undefined {
  for (const p of order) {
    if (parseLLMProviderConfigFromEnv(p, env) !== undefined) {
      return p;
    }
  }
  return undefined;
}
