import { describe, expect, it } from "vitest";

import { createAdapterRegistry } from "./registry";
import { createSyntheticAdapter } from "./test-utils";

function percentileMs(samples: number[], p: number): number {
  if (samples.length === 0) {
    return 0;
  }
  const sorted = [...samples].sort((a, b) => a - b);
  const rank = Math.ceil((p / 100) * sorted.length) - 1;
  const idx = Math.min(Math.max(rank, 0), sorted.length - 1);
  return sorted[idx] ?? 0;
}

describe("ConnectorAdapterRegistry performance (migration plan Part 6)", () => {
  it("keeps in-process resolve() p99 under 50ms", () => {
    const registry = createAdapterRegistry<undefined>();
    registry.register("ga4", () => createSyntheticAdapter("ga4"));

    const iterations = 5_000;
    const samples: number[] = [];

    for (let i = 0; i < iterations; i += 1) {
      const t0 = performance.now();
      registry.resolve("ga4", undefined);
      samples.push(performance.now() - t0);
    }

    expect(percentileMs(samples, 99)).toBeLessThan(50);
  });
});
