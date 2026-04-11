import { afterEach, describe, expect, it, vi } from "vitest";

import { CircuitBreaker } from "./circuit-breaker";

describe("CircuitBreaker", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("opens after repeated failures and rejects fast (AC-1.7.4)", async () => {
    vi.useFakeTimers();
    const breaker = new CircuitBreaker({
      failureThreshold: 2,
      resetTimeoutMs: 1000,
      halfOpenSuccessThreshold: 1,
    });

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

  it("moves to half-open after reset timeout and closes after configured successes (AC-1.7.5)", async () => {
    vi.useFakeTimers();
    const breaker = new CircuitBreaker({
      failureThreshold: 1,
      resetTimeoutMs: 500,
      halfOpenSuccessThreshold: 1,
    });

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

  it("requires three consecutive successes in half-open when threshold is 3 (AC-1.7.5)", async () => {
    vi.useFakeTimers();
    const breaker = new CircuitBreaker({
      failureThreshold: 1,
      resetTimeoutMs: 1000,
      halfOpenSuccessThreshold: 3,
    });

    await expect(
      breaker.execute(async () => {
        throw new Error("fail");
      }),
    ).rejects.toThrow("fail");

    vi.advanceTimersByTime(1000);
    expect(breaker.getState()).toBe("half-open");

    await breaker.execute(async () => 1);
    expect(breaker.getState()).toBe("half-open");
    await breaker.execute(async () => 2);
    expect(breaker.getState()).toBe("half-open");
    await breaker.execute(async () => 3);
    expect(breaker.getState()).toBe("closed");
  });

  it("reopens from half-open on a single failure", async () => {
    vi.useFakeTimers();
    const breaker = new CircuitBreaker({
      failureThreshold: 1,
      resetTimeoutMs: 200,
      halfOpenSuccessThreshold: 3,
    });

    await expect(
      breaker.execute(async () => {
        throw new Error("a");
      }),
    ).rejects.toThrow("a");

    vi.advanceTimersByTime(200);
    await expect(
      breaker.execute(async () => {
        throw new Error("b");
      }),
    ).rejects.toThrow("b");
    expect(breaker.getState()).toBe("open");
  });
});
