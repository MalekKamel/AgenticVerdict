import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  defaultBackoffOptions,
  MemoryPlatformCache,
  MetaPlatformAdapter,
  PlatformCircuitOpenError,
  metaCredentialKeys,
  type PlatformCache,
} from "@agenticverdict/platform-adapters";

import { createDefaultChaosState } from "../mock-servers/chaos";
import { startPlatformMockGateway } from "../mock-servers/gateway";
import { createRewritingFetch } from "../mock-servers/rewrite-fetch";

describe("Phase 01 chaos — network, upstream, cache degradation (mock APIs)", () => {
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

  const range = { startInclusive: "2025-03-01", endInclusive: "2025-03-15" };

  it("opens circuit after repeated upstream failures then recovers (AC-1.7.4 / AC-1.7.5)", async () => {
    const fetchImpl = createRewritingFetch(port);
    chaos.metaGraph500Remaining = 0;
    chaos.protectMetaAuthPaths = true;

    const fastBreaker = {
      failureThreshold: 5,
      resetTimeoutMs: 40,
      halfOpenSuccessThreshold: 3,
    };

    const adapter = new MetaPlatformAdapter({
      fetchImpl,
      requestTokenBucket: null,
      tenantId: "chaos-breaker",
      circuitBreakerOptions: fastBreaker,
      backoff: {
        ...defaultBackoffOptions,
        maxAttempts: 1,
        retryOn: () => false,
      },
    });

    await adapter.authenticate({
      [metaCredentialKeys.accessToken]: "tok",
      [metaCredentialKeys.adAccountId]: "4242",
    });

    chaos.metaGraph500Remaining = 20;
    for (let i = 0; i < 5; i += 1) {
      await expect(adapter.fetchMetrics(range)).rejects.toThrow();
    }

    await expect(adapter.fetchMetrics(range)).rejects.toThrow(PlatformCircuitOpenError);

    chaos.metaGraph500Remaining = 0;
    chaos.protectMetaAuthPaths = true;
    await new Promise((r) => setTimeout(r, 60));

    for (let j = 0; j < 3; j += 1) {
      await expect(adapter.fetchMetrics(range)).resolves.toBeDefined();
    }

    await expect(adapter.isHealthy()).resolves.toBe(true);
  });

  it("network failure surfaces as rejected fetch (AC-3.4.1)", async () => {
    const boom: typeof fetch = () =>
      Promise.reject(new Error("ECONNRESET: simulated network failure"));
    const adapter = new MetaPlatformAdapter({
      fetchImpl: boom,
      requestTokenBucket: null,
      tenantId: "chaos-net",
    });
    await expect(
      adapter.authenticate({
        [metaCredentialKeys.accessToken]: "tok",
        [metaCredentialKeys.adAccountId]: "1",
      }),
    ).rejects.toThrow();
  });

  it("cache set failures do not fail successful fetch (AC-3.4.3)", async () => {
    const fetchImpl = createRewritingFetch(port);
    const baseCache = new MemoryPlatformCache();
    let armed = true;
    const cache: PlatformCache = {
      get: (key) => baseCache.get(key),
      set: async (key, value, ttl) => {
        if (armed) {
          armed = false;
          throw new Error("cache unavailable");
        }
        return baseCache.set(key, value, ttl);
      },
      delete: (key) => baseCache.delete(key),
      getMetrics: () => baseCache.getMetrics(),
      isDistributed: () => baseCache.isDistributed(),
    };

    const adapter = new MetaPlatformAdapter({
      fetchImpl,
      requestTokenBucket: null,
      tenantId: "chaos-cache",
      cache,
    });
    await adapter.authenticate({
      [metaCredentialKeys.accessToken]: "tok",
      [metaCredentialKeys.adAccountId]: "88",
    });
    const raw = await adapter.fetchMetrics(range);
    expect(raw).toBeDefined();
  });
});
