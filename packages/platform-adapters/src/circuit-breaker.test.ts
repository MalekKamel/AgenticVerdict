import { afterEach, describe, expect, it, vi } from "vitest";

import { CircuitBreaker } from "./circuit-breaker";

describe("CircuitBreaker", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("opens after repeated failures and rejects fast", async () => {
    vi.useFakeTimers();
    const breaker = new CircuitBreaker({ failureThreshold: 2, resetTimeoutMs: 1000 });

    await expect(
      breaker.execute(async () => {
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");
    await expect(
      breaker.execute(async () => {
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");

    expect(breaker.getState()).toBe("open");

    await expect(
      breaker.execute(async () => {
        return 1;
      }),
    ).rejects.toThrow("Circuit breaker is open");
  });

  it("moves to half-open after reset timeout and closes on success", async () => {
    vi.useFakeTimers();
    const breaker = new CircuitBreaker({ failureThreshold: 1, resetTimeoutMs: 500 });

    await expect(
      breaker.execute(async () => {
        throw new Error("fail");
      }),
    ).rejects.toThrow("fail");
    expect(breaker.getState()).toBe("open");

    vi.advanceTimersByTime(500);
    expect(breaker.getState()).toBe("half-open");

    const value = await breaker.execute(async () => 42);
    expect(value).toBe(42);
    expect(breaker.getState()).toBe("closed");
  });
});
