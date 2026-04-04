import { describe, expect, it } from "vitest";

import { MemoryPlatformCache } from "./memory-cache";

describe("MemoryPlatformCache", () => {
  it("achieves high hit rate on repeated reads (AC-1.7.2 synthetic check)", async () => {
    const cache = new MemoryPlatformCache();
    const key = "k1";
    await cache.set(key, "v", 60);

    const iterations = 100;
    let hits = 0;
    for (let i = 0; i < iterations; i += 1) {
      const v = await cache.get(key);
      if (v === "v") {
        hits += 1;
      }
    }
    expect(hits / iterations).toBeGreaterThan(0.8);

    const m = cache.getMetrics();
    expect(m.hits).toBe(iterations);
    expect(m.misses).toBe(0);
  });

  it("tracks latency samples for operations", async () => {
    const cache = new MemoryPlatformCache();
    await cache.get("missing");
    const m = cache.getMetrics();
    expect(m.operations).toBeGreaterThan(0);
    expect(m.totalLatencyMs).toBeGreaterThanOrEqual(0);
  });
});
