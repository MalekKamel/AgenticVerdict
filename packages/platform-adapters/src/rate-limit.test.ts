import { afterEach, describe, expect, it, vi } from "vitest";

import { withExponentialBackoff } from "./rate-limit";

describe("withExponentialBackoff", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("retries when retryOn matches then succeeds", async () => {
    vi.useFakeTimers();
    let calls = 0;
    const promise = withExponentialBackoff(
      {
        initialDelayMs: 100,
        factor: 2,
        maxDelayMs: 400,
        maxAttempts: 3,
        retryOn: () => true,
      },
      async () => {
        calls += 1;
        if (calls < 2) {
          throw new Error("429 throttle");
        }
        return "ok";
      },
    );

    await vi.advanceTimersByTimeAsync(100);
    const result = await promise;
    expect(result).toBe("ok");
    expect(calls).toBe(2);
  });

  it("stops when retryOn is false", async () => {
    await expect(
      withExponentialBackoff(
        {
          initialDelayMs: 1,
          factor: 2,
          maxDelayMs: 10,
          maxAttempts: 5,
          retryOn: () => false,
        },
        async () => {
          throw new Error("fatal");
        },
      ),
    ).rejects.toThrow("fatal");
  });
});
