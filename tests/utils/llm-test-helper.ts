/**
 * LLM Test Helper Utilities
 *
 * Provides utilities for testing with GLM and other LLM providers
 * in containerized environments.
 */

import { parseGlmConfigFromEnv } from "@agenticverdict/agent-runtime";

import {
  validateLLMProvider,
  type LLMProviderConfig as ProbeLLMProviderConfig,
} from "./llm-provider-helpers";
import { evaluateLlmResponse } from "./llm-response-evaluation";

export interface LLMProviderConfig {
  provider: "anthropic" | "openai" | "glm";
  apiKey: string;
  baseUrl: string;
  model: string;
  timeout: number;
}

export interface LLMTestResult {
  provider: string;
  model: string;
  success: boolean;
  duration: number;
  error?: string;
  response?: {
    content: string;
    inputTokens: number;
    outputTokens: number;
  };
}

export class LLMTestHelper {
  /**
   * Check if live LLM testing should be used
   */
  static shouldUseLiveLLM(): boolean {
    return process.env.AGENT_RUNTIME_LIVE_LLM === "1" && !!process.env.GLM_API_KEY;
  }

  /**
   * Docker E2E policy: GLM only when {@link shouldUseLiveLLM} is true; otherwise mock.
   */
  static getE2eLlmProvider(): "mock" | "glm" {
    if (this.shouldUseLiveLLM()) {
      return "glm";
    }
    return "mock";
  }

  /**
   * Resolved provider for tests: requires `AGENT_RUNTIME_LIVE_LLM=1` before any real provider; then prefers live GLM, then other configured keys.
   */
  static getLLMProvider(): "mock" | "glm" | "anthropic" | "openai" {
    if (process.env.AGENT_RUNTIME_LIVE_LLM !== "1") {
      return "mock";
    }

    if (this.shouldUseLiveLLM()) {
      return "glm";
    }

    if (process.env.ANTHROPIC_API_KEY) {
      return "anthropic";
    }

    if (process.env.OPENAI_API_KEY) {
      return "openai";
    }

    if (process.env.GLM_API_KEY) {
      return "glm";
    }

    return "mock";
  }

  /**
   * Parse GLM configuration from environment (delegates to `@agenticverdict/agent-runtime`).
   */
  static parseGLMConfig(env: NodeJS.ProcessEnv): LLMProviderConfig | null {
    const glm = parseGlmConfigFromEnv(env);
    if (glm === null) {
      return null;
    }
    return {
      provider: "glm",
      apiKey: glm.apiKey,
      baseUrl: glm.baseUrl,
      model: glm.model,
      timeout: glm.timeoutMs,
    };
  }

  /**
   * Test GLM connectivity using the same probe as scenario health checks (OpenAI- and Anthropic-compatible GLM bases).
   */
  static async testGLMConnectivity(options?: {
    budgetTracker?: LLMTestBudgetTracker;
    env?: NodeJS.ProcessEnv;
  }): Promise<LLMTestResult> {
    const env = options?.env ?? process.env;
    const glm = parseGlmConfigFromEnv(env);

    if (glm === null) {
      return {
        provider: "glm",
        model: "unknown",
        success: false,
        duration: 0,
        error: "GLM_API_KEY not configured",
      };
    }

    const probe: ProbeLLMProviderConfig = {
      provider: "glm",
      apiKey: glm.apiKey,
      baseUrl: glm.baseUrl,
      model: glm.model,
      timeoutMs: glm.timeoutMs,
    };

    const startTime = Date.now();
    const result = await validateLLMProvider(probe, { timeoutMs: glm.timeoutMs });
    const duration = Date.now() - startTime;

    if (!result.ok) {
      return {
        provider: "glm",
        model: glm.model,
        success: false,
        duration,
        error: result.error ?? "connectivity failed",
      };
    }

    const usage = extractTokenUsageFromLlmJson(result.responseBody);
    const content = extractAssistantTextFromLlmJson(result.responseBody);

    if (options?.budgetTracker !== undefined) {
      const allowed = options.budgetTracker.trackCost("glm", usage.input, usage.output, glm.model);
      if (!allowed) {
        return {
          provider: "glm",
          model: glm.model,
          success: false,
          duration,
          error: "LLM test budget exceeded",
          response: {
            content,
            inputTokens: usage.input,
            outputTokens: usage.output,
          },
        };
      }
    }

    return {
      provider: "glm",
      model: glm.model,
      success: true,
      duration,
      response: {
        content,
        inputTokens: usage.input,
        outputTokens: usage.output,
      },
    };
  }

  /**
   * Calculate estimated cost for GLM API call
   * Pricing estimates (subject to change):
   * - GLM-4: ~¥0.50/1M input tokens, ~¥2.00/1M output tokens
   * - GLM-4-Air: ~¥0.10/1M input tokens, ~¥0.50/1M output tokens
   */
  static estimateGLMCost(inputTokens: number, outputTokens: number, model: string): number {
    const pricing: Record<string, { input: number; output: number }> = {
      "glm-4": { input: 0.0005, output: 0.002 }, // CNY per 1K tokens
      "glm-4.7": { input: 0.0005, output: 0.002 },
      "glm-4-air": { input: 0.0001, output: 0.0005 },
      "glm-4-flash": { input: 0.00008, output: 0.0004 },
      "glm-4-plus": { input: 0.0007, output: 0.0025 },
    };

    const rates = pricing[model] ?? pricing["glm-4"]!;
    const inputCost = (inputTokens / 1000) * rates.input;
    const outputCost = (outputTokens / 1000) * rates.output;

    return inputCost + outputCost;
  }

  /**
   * Verbose logging for LLM requests (for debugging)
   */
  static logLLMRequest(
    provider: string,
    url: string,
    model: string,
    payload: unknown,
    response: unknown,
    duration: number,
  ): void {
    if (process.env.SCENARIO_VERBOSE_LLM !== "1" && process.env.VERBOSE !== "1") {
      return;
    }

    // Mask API keys in URLs
    const maskedUrl = url.replace(/api_key=[^&]+/, "api_key=***");
    const maskedPayload = JSON.stringify(payload, (key, value) =>
      key === "apiKey" || key === "authorization" ? "***" : value,
    );

    console.log(`[LLM Request] ${provider}`);
    console.log(`  URL: ${maskedUrl}`);
    console.log(`  Model: ${model}`);
    console.log(`  Payload: ${maskedPayload.substring(0, 200)}...`);
    console.log(`  Response: ${JSON.stringify(response).substring(0, 200)}...`);
    console.log(`  Duration: ${duration}ms`);
  }

  /**
   * Create a response cache for cost optimization
   */
  static createResponseCache<T>(ttl = 24 * 60 * 60 * 1000) {
    const cache = new Map<string, { response: T; timestamp: number }>();

    return {
      get(key: string): T | null {
        const cached = cache.get(key);
        if (!cached) return null;

        if (Date.now() - cached.timestamp > ttl) {
          cache.delete(key);
          return null;
        }

        return cached.response;
      },

      set(key: string, response: T): void {
        cache.set(key, { response, timestamp: Date.now() });
      },

      clear(): void {
        cache.clear();
      },

      size(): number {
        return cache.size;
      },
    };
  }

  /**
   * Evaluate LLM response quality
   */
  static evaluateResponse(
    response: string,
    criteria: {
      minLength?: number;
      maxLength?: number;
      requiredKeywords?: string[];
      forbiddenPatterns?: RegExp[];
    },
  ): { passed: boolean; reasons: string[] } {
    const report = evaluateLlmResponse(response, {
      minLength: criteria.minLength,
      maxLength: criteria.maxLength,
      requiredPhrases: criteria.requiredKeywords,
      forbiddenPatterns: criteria.forbiddenPatterns,
      minKeywordOverlap: 1,
    });
    return { passed: report.passed, reasons: report.reasons };
  }

  /**
   * Wait for rate limit cooldown between LLM calls
   */
  static async rateLimitDelay(provider: "glm" | "anthropic" | "openai"): Promise<void> {
    const delays = {
      glm: 1000, // 1 second between calls
      anthropic: 500,
      openai: 500,
    };

    await new Promise((resolve) => setTimeout(resolve, delays[provider] || 500));
  }

  /**
   * Create a retry handler for LLM requests
   */
  static async withRetry<T>(
    fn: () => Promise<T>,
    options: {
      maxAttempts?: number;
      initialDelayMs?: number;
      backoffMultiplier?: number;
      onRetry?: (attempt: number, error: Error) => void;
    } = {},
  ): Promise<T> {
    const { maxAttempts = 3, initialDelayMs = 1000, backoffMultiplier = 2, onRetry } = options;

    let lastError: Error | undefined;
    let delay = initialDelayMs;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < maxAttempts) {
          onRetry?.(attempt, lastError);
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay *= backoffMultiplier;
        }
      }
    }

    throw lastError;
  }
}

function extractTokenUsageFromLlmJson(body: unknown): { input: number; output: number } {
  if (body === null || typeof body !== "object") {
    return { input: 0, output: 0 };
  }
  const root = body as Record<string, unknown>;
  const usage = root.usage;
  if (usage !== null && typeof usage === "object") {
    const u = usage as Record<string, unknown>;
    const input =
      typeof u.prompt_tokens === "number"
        ? u.prompt_tokens
        : typeof u.input_tokens === "number"
          ? u.input_tokens
          : 0;
    const output =
      typeof u.completion_tokens === "number"
        ? u.completion_tokens
        : typeof u.output_tokens === "number"
          ? u.output_tokens
          : 0;
    return { input, output };
  }
  return { input: 0, output: 0 };
}

function extractAssistantTextFromLlmJson(body: unknown): string {
  if (body === null || typeof body !== "object") {
    return "";
  }
  const root = body as Record<string, unknown>;
  const choices = root.choices;
  if (Array.isArray(choices) && choices[0] !== undefined && typeof choices[0] === "object") {
    const c0 = choices[0] as Record<string, unknown>;
    const msg = c0.message;
    if (msg !== null && typeof msg === "object") {
      const content = (msg as Record<string, unknown>).content;
      return typeof content === "string" ? content : "";
    }
  }
  const contentArr = root.content;
  if (Array.isArray(contentArr)) {
    for (const block of contentArr) {
      if (block !== null && typeof block === "object") {
        const b = block as Record<string, unknown>;
        if (b.type === "text" && typeof b.text === "string") {
          return b.text;
        }
      }
    }
  }
  return "";
}

/**
 * Track LLM usage for budget management in tests.
 */
export class LLMTestBudgetTracker {
  private spent: Map<string, number> = new Map();
  private readonly limits: Map<string, number>;

  constructor(dailyLimitsCNY: Record<string, number>) {
    this.limits = new Map(Object.entries(dailyLimitsCNY));
  }

  trackCost(provider: string, inputTokens: number, outputTokens: number, model: string): boolean {
    const cost =
      provider === "glm" ? LLMTestHelper.estimateGLMCost(inputTokens, outputTokens, model) : 0;

    const currentSpent = this.spent.get(provider) || 0;
    const newTotal = currentSpent + cost;
    const limit = this.limits.get(provider) || Infinity;

    if (newTotal > limit) {
      console.warn(
        `[LLM Budget] ${provider} would exceed ¥${limit.toFixed(2)} daily limit ` +
          `(current: ¥${currentSpent.toFixed(2)}, this call: ¥${cost.toFixed(2)})`,
      );
      return false;
    }

    this.spent.set(provider, newTotal);
    return true;
  }

  getSpent(provider: string): number {
    return this.spent.get(provider) || 0;
  }

  getRemaining(provider: string): number {
    const spent = this.getSpent(provider);
    const limit = this.limits.get(provider) || Infinity;
    return Math.max(0, limit - spent);
  }

  reset(): void {
    this.spent.clear();
  }
}

/**
 * Pre-configured budget limits for testing
 */
export const TEST_BUDGET_LIMITS = {
  glm: 10, // ¥10 per day
  anthropic: 2, // $2 per day
  openai: 2, // $2 per day
};

/**
 * Create a singleton budget tracker for tests
 */
export const testBudgetTracker = new LLMTestBudgetTracker(TEST_BUDGET_LIMITS);
