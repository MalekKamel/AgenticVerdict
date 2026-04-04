export interface RetryOptions {
  maxAttempts: number;
  delayMs: number;
  retryOn: (error: unknown) => boolean;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
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
      await sleep(options.delayMs);
    }
  }
  throw last;
}

export async function withPrimaryFallback<T>(
  primary: () => Promise<T>,
  fallback: () => Promise<T>,
  useFallbackOn: (error: unknown) => boolean,
): Promise<T> {
  try {
    return await primary();
  } catch (error) {
    if (!useFallbackOn(error)) {
      throw error;
    }
    return fallback();
  }
}
