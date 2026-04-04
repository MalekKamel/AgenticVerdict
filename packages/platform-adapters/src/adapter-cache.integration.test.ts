import { describe, expect, it } from "vitest";

import { MemoryPlatformCache } from "./cache/memory-cache";
import { AdapterMethodMetrics } from "./adapter-metrics";
import type { DateRangeIso } from "./date-range";
import { MockPlatformAdapter } from "./mock-adapter";

describe("BasePlatformAdapter caching", () => {
  it("uses cache on second fetchMetrics call", async () => {
    const cache = new MemoryPlatformCache();
    const metrics = new AdapterMethodMetrics();
    let fetches = 0;

    class Counting extends MockPlatformAdapter {
      protected override async fetchRawMetrics(_dateRange: DateRangeIso) {
        void _dateRange;
        fetches += 1;
        return { n: fetches };
      }
    }

    const adapter = new Counting("meta", {
      tenantId: "t1",
      cache,
      metrics,
      backoff: { maxAttempts: 1, retryOn: () => false },
    });

    const range = { startInclusive: "2026-01-01", endInclusive: "2026-01-07" };
    await adapter.authenticate({ token: "x" });
    const first = await adapter.fetchMetrics(range);
    const second = await adapter.fetchMetrics(range);

    expect(fetches).toBe(1);
    expect(first).toEqual(second);

    const snap = metrics.snapshotForPlatform("meta");
    expect(snap.cacheHits).toBeGreaterThanOrEqual(1);
    expect(snap.cacheMisses).toBeGreaterThanOrEqual(1);
  });
});
