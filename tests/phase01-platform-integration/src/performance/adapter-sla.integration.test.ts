import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  MemoryPlatformCache,
  MetaConnectorAdapter,
  metaCredentialKeys,
} from "@agenticverdict/data-connectors";

import { createDefaultChaosState } from "../mock-servers/chaos";
import { startPlatformMockGateway } from "../mock-servers/gateway";
import { createRewritingFetch } from "../mock-servers/rewrite-fetch";

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) {
    return 0;
  }
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[idx] ?? 0;
}

/**
 * AC-2.1.1 / AC-2.1.2 / Task 4.3 — automated regression-style checks vs mock upstream (local lab).
 */
describe("Phase 01 performance — latency baselines (mock APIs)", () => {
  const chaos = createDefaultChaosState();
  let port = 0;
  let closeGw: () => Promise<void>;

  beforeAll(async () => {
    const gw = await startPlatformMockGateway(chaos);
    port = gw.port;
    closeGw = () => gw.close();
  });

  afterAll(async () => {
    await closeGw();
  });

  const range = { startInclusive: "2025-04-01", endInclusive: "2025-04-07" };

  it("cached fetchMetrics p95 stays within AC-2.1.1 budget (mock lab)", async () => {
    const fetchImpl = createRewritingFetch(port);
    const cache = new MemoryPlatformCache();
    const adapter = new MetaConnectorAdapter({
      fetchImpl,
      requestTokenBucket: null,
      tenantId: "perf-cache",
      cache,
    });
    await adapter.authenticate({
      [metaCredentialKeys.accessToken]: "tok",
      [metaCredentialKeys.adAccountId]: "1001",
    });
    await adapter.fetchMetrics(range);
    const samples: number[] = [];
    for (let i = 0; i < 40; i += 1) {
      const t0 = performance.now();
      await adapter.fetchMetrics(range);
      samples.push(performance.now() - t0);
    }
    samples.sort((a, b) => a - b);
    expect(percentile(samples, 95)).toBeLessThan(200);
  });

  it("uncached fetchMetrics p95 stays within AC-2.1.2 budget (mock lab)", async () => {
    const fetchImpl = createRewritingFetch(port);
    const durations: number[] = [];
    for (let i = 0; i < 8; i += 1) {
      const adapter = new MetaConnectorAdapter({
        fetchImpl,
        requestTokenBucket: null,
        tenantId: `perf-uncached-${i}`,
      });
      await adapter.authenticate({
        [metaCredentialKeys.accessToken]: "tok",
        [metaCredentialKeys.adAccountId]: String(2000 + i),
      });
      const t0 = performance.now();
      await adapter.fetchMetrics(range);
      durations.push(performance.now() - t0);
    }
    durations.sort((a, b) => a - b);
    expect(percentile(durations, 95)).toBeLessThan(2000);
  });

  it("authentication completes within AC-2.1.3 budget (mock lab)", async () => {
    const fetchImpl = createRewritingFetch(port);
    const adapter = new MetaConnectorAdapter({
      fetchImpl,
      requestTokenBucket: null,
      tenantId: "perf-auth",
    });
    const samples: number[] = [];
    for (let i = 0; i < 10; i += 1) {
      const t0 = performance.now();
      await adapter.authenticate({
        [metaCredentialKeys.accessToken]: `tok-${i}`,
        [metaCredentialKeys.adAccountId]: String(3000 + i),
      });
      samples.push(performance.now() - t0);
    }
    samples.sort((a, b) => a - b);
    expect(percentile(samples, 95)).toBeLessThan(5000);
  });
});
