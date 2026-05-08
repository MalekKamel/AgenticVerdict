import { describe, expect, it, vi } from "vitest";

import { parseAgentConfig } from "./agent-config";
import {
  LlmInvocationCache,
  buildLlmInvocationCacheKey,
  factoryConfigCacheFingerprint,
} from "./llm-invocation-cache";

describe("LlmInvocationCache", () => {
  it("returns hit on identical key and tracks hit rate", () => {
    const cache = new LlmInvocationCache({ maxEntries: 8, ttlMs: 60_000 });
    const key = buildLlmInvocationCacheKey({
      tenantId: "t1",
      factoryFingerprint: "fp",
      systemMessage: "sys",
      userMessage: "goal",
      memorySnapshotJson: "[]",
    });
    cache.set(key, { answer: "cached", steps: [] });
    expect(cache.get(key)).toEqual({ answer: "cached", steps: [] });
    expect(cache.getMetrics().hits).toBe(1);
    expect(cache.getMetrics().misses).toBe(0);
    cache.get("missing");
    expect(cache.getMetrics().misses).toBe(1);
  });

  it("evicts LRU when over maxEntries", () => {
    const cache = new LlmInvocationCache({ maxEntries: 2, ttlMs: 60_000 });
    cache.set("a", { answer: "1", steps: [] });
    cache.set("b", { answer: "2", steps: [] });
    cache.get("a");
    cache.set("c", { answer: "3", steps: [] });
    expect(cache.get("b")).toBeUndefined();
    expect(cache.get("a")?.answer).toBe("1");
  });

  it("expires entries after ttl", async () => {
    vi.useFakeTimers();
    const cache = new LlmInvocationCache({ maxEntries: 8, ttlMs: 100 });
    cache.set("k", { answer: "x", steps: [] });
    await vi.advanceTimersByTimeAsync(150);
    expect(cache.get("k")).toBeUndefined();
    vi.useRealTimers();
  });
});

describe("factoryConfigCacheFingerprint", () => {
  it("is stable for parsed config", () => {
    const cfg = parseAgentConfig({
      name: "test-agent",
      role: "analysis",
      memoryMode: "none",
      systemMessage: "Test system message",
    });
    expect(factoryConfigCacheFingerprint(cfg)).toContain("analysis");
  });
});
