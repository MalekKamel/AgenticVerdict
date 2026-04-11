import { describe, expect, it } from "vitest";

import { AdapterMethodMetrics, healthScoreFromMetrics } from "./adapter-metrics";

describe("AdapterMethodMetrics", () => {
  it("snapshotAll includes every platform key", () => {
    const m = new AdapterMethodMetrics();
    const all = m.snapshotAll();
    expect(Object.keys(all)).toEqual(["meta", "ga4", "gsc", "gbp", "tiktok"]);
  });

  it("healthScoreFromMetrics is 100 when no samples", () => {
    expect(
      healthScoreFromMetrics({
        successCount: 0,
        failureCount: 0,
        cacheHits: 0,
        cacheMisses: 0,
        latencyMsP50: null,
        latencyMsP95: null,
        latencyMsP99: null,
      }),
    ).toBe(100);
  });

  it("records cache hit and miss only for successful fetchMetrics", () => {
    const m = new AdapterMethodMetrics();
    m.record({
      connector: "ga4",
      operation: "fetchMetrics",
      outcome: "success",
      durationMs: 5,
      cacheHit: true,
    });
    m.record({
      connector: "ga4",
      operation: "fetchMetrics",
      outcome: "success",
      durationMs: 6,
      cacheHit: false,
    });
    m.record({
      connector: "ga4",
      operation: "authenticate",
      outcome: "success",
      durationMs: 1,
      cacheHit: true,
    });

    const s = m.snapshotForConnector("ga4");
    expect(s.cacheHits).toBe(1);
    expect(s.cacheMisses).toBe(1);
  });

  it("trims latency samples beyond the cap", () => {
    const m = new AdapterMethodMetrics();
    for (let i = 0; i < 260; i += 1) {
      m.record({
        connector: "meta",
        operation: "fetchMetrics",
        outcome: "success",
        durationMs: i,
      });
    }
    const s = m.snapshotForConnector("meta");
    expect(s.latencyMsP99).not.toBeNull();
  });

  it("returns null percentiles when only failures were recorded", () => {
    const m = new AdapterMethodMetrics();
    m.record({
      connector: "gsc",
      operation: "fetchMetrics",
      outcome: "failure",
      durationMs: 0,
    });
    const s = m.snapshotForConnector("gsc");
    expect(s.latencyMsP50).toBeNull();
    expect(s.failureCount).toBe(1);
  });
});
