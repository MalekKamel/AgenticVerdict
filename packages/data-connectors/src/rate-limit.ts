import { recordBackoffAttemptOutcome } from "@agenticverdict/observability";
import type { ExponentialBackoffOptions, ExponentialBackoffTelemetry } from "@agenticverdict/types";

import { isRetryableConnectorError } from "./error-classifier";

/**
 * Jitter ±20% to reduce thundering herd (Task 1.5).
 */
export function applyBackoffJitter(baseMs: number): number {
  const jitterRange = baseMs * 0.2;
  return Math.max(0, Math.round(baseMs - jitterRange + Math.random() * 2 * jitterRange));
}

export const defaultBackoffOptions: ExponentialBackoffOptions = {
  initialDelayMs: 1000,
  factor: 2,
  maxDelayMs: 16_000,
  maxAttempts: 6,
  retryOn: isRetryableConnectorError,
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Runs `fn`, retrying with exponential backoff (1s, 2s, 4s, 8s, 16s) and jitter when `retryOn` matches.
 */
export async function withExponentialBackoff<T>(
  options: ExponentialBackoffOptions,
  fn: () => Promise<T>,
  telemetry?: ExponentialBackoffTelemetry,
): Promise<T> {
  let delay = options.initialDelayMs;
  let lastError: unknown;

  for (let attempt = 1; attempt <= options.maxAttempts; attempt += 1) {
    try {
      const result = await fn();
      if (telemetry) {
        recordBackoffAttemptOutcome({
          platform: telemetry.platform,
          operation: telemetry.operation,
          outcome: "success",
          attempts: attempt,
        });
      }
      return result;
    } catch (error) {
      lastError = error;
      const canRetry = attempt < options.maxAttempts && options.retryOn(error);
      if (!canRetry) {
        if (telemetry) {
          recordBackoffAttemptOutcome({
            platform: telemetry.platform,
            operation: telemetry.operation,
            outcome: "exhausted",
            attempts: attempt,
          });
        }
        throw error;
      }
      const waitMs = applyBackoffJitter(Math.min(delay, options.maxDelayMs));
      await sleep(waitMs);
      delay = Math.min(delay * options.factor, options.maxDelayMs);
    }
  }

  throw lastError;
}
