export interface ExponentialBackoffOptions {
  /** First delay in milliseconds. */
  initialDelayMs: number;
  /** Multiplier applied after each retryable failure. */
  factor: number;
  /** Hard cap on delay between attempts. */
  maxDelayMs: number;
  /** Maximum attempts including the first try. */
  maxAttempts: number;
  /** When true, the final error is rethrown after exhausting attempts. */
  retryOn: (error: unknown) => boolean;
}

const defaultRetryOn = (error: unknown): boolean => {
  if (error instanceof Error && /rate|429|throttl/i.test(error.message)) {
    return true;
  }
  return false;
};

export const defaultBackoffOptions: ExponentialBackoffOptions = {
  initialDelayMs: 200,
  factor: 2,
  maxDelayMs: 10_000,
  maxAttempts: 4,
  retryOn: defaultRetryOn,
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Runs `fn`, retrying with exponential backoff when `retryOn` matches.
 */
export async function withExponentialBackoff<T>(
  options: ExponentialBackoffOptions,
  fn: () => Promise<T>,
): Promise<T> {
  let delay = options.initialDelayMs;
  let lastError: unknown;

  for (let attempt = 1; attempt <= options.maxAttempts; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const canRetry = attempt < options.maxAttempts && options.retryOn(error);
      if (!canRetry) {
        throw error;
      }
      await sleep(Math.min(delay, options.maxDelayMs));
      delay = Math.min(delay * options.factor, options.maxDelayMs);
    }
  }

  throw lastError;
}
