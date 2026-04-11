import { afterEach, describe, expect, it, vi } from "vitest";

import { TokenBucket } from "./token-bucket";

describe("TokenBucket", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("tryConsume respects capacity", () => {
    const b = new TokenBucket(2, 10, 2);
    expect(b.tryConsume(1)).toBe(true);
    expect(b.tryConsume(1)).toBe(true);
    expect(b.tryConsume(1)).toBe(false);
  });

  it("consume waits for refill", async () => {
    vi.useFakeTimers();
    const b = new TokenBucket(1, 60, 0);
    const p = b.consume(1, 5000);
    await vi.advanceTimersByTimeAsync(1100);
    await expect(p).resolves.toBeUndefined();
  });
});
