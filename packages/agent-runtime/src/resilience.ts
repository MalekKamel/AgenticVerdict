export type RetryAttemptInfo = {
  attempt: number;
  maxAttempts: number;
  delayMs: number;
  error: unknown;
};

export interface RetryOptions {
  maxAttempts: number;
  /**
   * Fixed delay between retries when {@link backoffMultiplier} is omitted.
   * @default 0 when neither exponential nor delay is configured
   */
  delayMs?: number;
  retryOn: (error: unknown) => boolean;
  /** Base delay for exponential backoff (defaults to {@link delayMs} or 1000ms). */
  initialDelayMs?: number;
  /** Upper cap for backoff delay in milliseconds. */
  maxDelayMs?: number;
  /** When set, delay after attempt `k` is `min(maxDelayMs, base * multiplier^k)` (before jitter). */
  backoffMultiplier?: number;
  /**
   * When true (default for exponential mode), scales the computed delay by a factor in `(0.5, 1]`
   * to reduce thundering herds.
   */
  jitter?: boolean;
  /** Invoked before sleeping for the next attempt (not called after the final failure). */
  onRetry?: (info: RetryAttemptInfo) => void;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/** Visible for tests: deterministic jitter when `rng` is fixed. */
export function computeRetryDelayMs(
  zeroBasedAttempt: number,
  options: Pick<
    RetryOptions,
    "delayMs" | "initialDelayMs" | "maxDelayMs" | "backoffMultiplier" | "jitter"
  >,
  rng: () => number = Math.random,
): number {
  const usesExponential = options.backoffMultiplier !== undefined;
  if (!usesExponential) {
    return options.delayMs ?? 0;
  }
  const base =
    options.initialDelayMs ??
    (options.delayMs !== undefined && options.delayMs > 0 ? options.delayMs : 1000);
  const mult = options.backoffMultiplier ?? 2;
  const maxCap = options.maxDelayMs ?? 16_000;
  const raw = Math.min(base * mult ** zeroBasedAttempt, maxCap);
  if (options.jitter === false) {
    return raw;
  }
  const factor = 0.5 + rng() * 0.5;
  return Math.min(Math.floor(raw * factor), maxCap);
}

export async function withRetries<T>(options: RetryOptions, fn: () => Promise<T>): Promise<T> {
  let last: unknown;
  for (let attempt = 1; attempt <= options.maxAttempts; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      last = error;
      const retry = attempt < options.maxAttempts && options.retryOn(error);
      if (!retry) {
        throw error;
      }
      const delayMs = computeRetryDelayMs(attempt - 1, options);
      options.onRetry?.({
        attempt,
        maxAttempts: options.maxAttempts,
        delayMs,
        error,
      });
      await sleep(delayMs);
    }
  }
  throw last;
}

export async function withPrimaryFallback<T>(
  primary: () => Promise<T>,
  fallback: () => Promise<T>,
  useFallbackOn: (error: unknown) => boolean,
  onFallback?: (error: unknown) => void,
): Promise<T> {
  try {
    return await primary();
  } catch (error) {
    if (!useFallbackOn(error)) {
      throw error;
    }
    onFallback?.(error);
    return fallback();
  }
}

export {
  CircuitBreaker,
  CircuitState,
  type CircuitBreakerOptions,
  type CircuitBreakerEvent,
} from "./resilience/circuitBreaker";
export {
  FailoverHandler,
  type FailoverChainConfig,
  type FailoverEvent,
  type FailoverHandlerOptions,
  type ProviderHealth,
} from "./resilience/failoverHandler";
export {
  HealthBasedRouter,
  type HealthBasedRouterOptions,
  type RoutingDecision,
} from "./resilience/healthBasedRouter";
