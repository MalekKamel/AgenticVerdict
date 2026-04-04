import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  MemoryPlatformCache,
  MetaPlatformAdapter,
  metaCredentialKeys,
} from "@agenticverdict/platform-adapters";

import { createDefaultChaosState } from "../mock-servers/chaos";
import { startPlatformMockGateway } from "../mock-servers/gateway";
import { createRewritingFetch } from "../mock-servers/rewrite-fetch";

/**
 * AC-2.2.1 / AC-2.2.2 style checks against local mock APIs (not production traffic).
 */
describe("Phase 01 load — concurrency and request volume (mock APIs)", () => {
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

  const range = { startInclusive: "2025-02-01", endInclusive: "2025-02-28" };

  it("completes 100 concurrent fetchMetrics calls without errors", async () => {
    const fetchImpl = createRewritingFetch(port);
    const tasks = Array.from({ length: 100 }, async (__, i) => {
      const adapter = new MetaPlatformAdapter({
        fetchImpl,
        requestTokenBucket: null,
        tenantId: `load-${i}`,
      });
      await adapter.authenticate({
        [metaCredentialKeys.accessToken]: `tok-${i}`,
        [metaCredentialKeys.adAccountId]: String(10_000 + i),
      });
      return adapter.fetchMetrics(range);
    });
    const results = await Promise.all(tasks);
    expect(results).toHaveLength(100);
  });

  it("processes 1000 sequential cache reads under local SLA-shaped budget", async () => {
    const fetchImpl = createRewritingFetch(port);
    const cache = new MemoryPlatformCache();
    const adapter = new MetaPlatformAdapter({
      fetchImpl,
      requestTokenBucket: null,
      tenantId: "throughput-one",
      cache,
    });
    await adapter.authenticate({
      [metaCredentialKeys.accessToken]: "tok",
      [metaCredentialKeys.adAccountId]: "555",
    });
    await adapter.fetchMetrics(range);
    const t0 = performance.now();
    for (let i = 0; i < 1000; i += 1) {
      await adapter.fetchMetrics(range);
    }
    const ms = performance.now() - t0;
    expect(ms).toBeLessThan(30_000);
  });

  it("stress burst: 400 parallel cache reads completes (AC-3.3.2 lab proxy)", async () => {
    const fetchImpl = createRewritingFetch(port);
    const cache = new MemoryPlatformCache();
    const adapter = new MetaPlatformAdapter({
      fetchImpl,
      requestTokenBucket: null,
      tenantId: "stress-one",
      cache,
    });
    await adapter.authenticate({
      [metaCredentialKeys.accessToken]: "tok",
      [metaCredentialKeys.adAccountId]: "6000",
    });
    await adapter.fetchMetrics(range);
    await Promise.all(Array.from({ length: 400 }, () => adapter.fetchMetrics(range)));
  });

  it("endurance-style loop: many iterations without throwing (AC-3.3.3 lab proxy)", async () => {
    const fetchImpl = createRewritingFetch(port);
    const adapter = new MetaPlatformAdapter({
      fetchImpl,
      requestTokenBucket: null,
      tenantId: "endurance",
    });
    await adapter.authenticate({
      [metaCredentialKeys.accessToken]: "tok",
      [metaCredentialKeys.adAccountId]: "6001",
    });
    for (let i = 0; i < 120; i += 1) {
      await adapter.fetchMetrics(range);
    }
  });
});
