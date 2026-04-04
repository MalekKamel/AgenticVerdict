import { describe, expect, it, vi } from "vitest";

import { computeRetryDelayMs, withPrimaryFallback, withRetries } from "./resilience";

describe("computeRetryDelayMs", () => {
  it("uses fixed delayMs when exponential mode is off", () => {
    expect(computeRetryDelayMs(2, { delayMs: 42 })).toBe(42);
  });

  it("applies exponential growth capped by maxDelayMs", () => {
    expect(
      computeRetryDelayMs(2, {
        initialDelayMs: 1000,
        maxDelayMs: 5000,
        backoffMultiplier: 2,
        jitter: false,
      }),
    ).toBe(4000);
    expect(
      computeRetryDelayMs(4, {
        initialDelayMs: 1000,
        maxDelayMs: 5000,
        backoffMultiplier: 2,
        jitter: false,
      }),
    ).toBe(5000);
  });

  it("applies jitter with a fixed rng", () => {
    const delay = computeRetryDelayMs(
      0,
      {
        initialDelayMs: 1000,
        maxDelayMs: 10_000,
        backoffMultiplier: 2,
        jitter: true,
      },
      () => 0,
    );
    expect(delay).toBe(500);
  });
});

describe("withRetries", () => {
  it("retries until success", async () => {
    let n = 0;
    const result = await withRetries(
      { maxAttempts: 3, delayMs: 0, retryOn: () => true },
      async () => {
        n += 1;
        if (n < 2) {
          throw new Error("transient");
        }
        return 7;
      },
    );
    expect(result).toBe(7);
  });

  it("invokes onRetry before sleeping", async () => {
    const onRetry = vi.fn();
    let n = 0;
    await withRetries(
      {
        maxAttempts: 3,
        delayMs: 0,
        retryOn: () => true,
        onRetry,
      },
      async () => {
        n += 1;
        if (n < 2) throw Object.assign(new Error("429"), { status: 429 });
        return 1;
      },
    );
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onRetry.mock.calls[0]?.[0]?.delayMs).toBe(0);
  });
});

describe("withPrimaryFallback", () => {
  it("uses fallback when predicate matches", async () => {
    const primary = vi.fn(async () => {
      throw new Error("primary down");
    });
    const fallback = vi.fn(async () => "fb");
    const v = await withPrimaryFallback(primary, fallback, () => true);
    expect(v).toBe("fb");
    expect(primary).toHaveBeenCalledTimes(1);
    expect(fallback).toHaveBeenCalledTimes(1);
  });

  it("notifies onFallback when provided", async () => {
    const err = new Error("boom");
    const primary = vi.fn(async () => {
      throw err;
    });
    const onFallback = vi.fn();
    await withPrimaryFallback(
      primary,
      async () => "ok",
      () => true,
      onFallback,
    );
    expect(onFallback).toHaveBeenCalledWith(err);
  });
});
