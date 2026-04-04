import { describe, expect, it, vi } from "vitest";

import { withPrimaryFallback, withRetries } from "./resilience";

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
});
