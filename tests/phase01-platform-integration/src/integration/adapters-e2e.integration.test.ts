import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  Ga4PlatformAdapter,
  GbpPlatformAdapter,
  GscPlatformAdapter,
  MemoryPlatformCache,
  MetaPlatformAdapter,
  TikTokPlatformAdapter,
  ga4CredentialKeys,
  gbpCredentialKeys,
  gscCredentialKeys,
  metaCredentialKeys,
  runNormalizationPipeline,
  tiktokCredentialKeys,
} from "@agenticverdict/platform-adapters";

import { createDefaultChaosState } from "../mock-servers/chaos";
import { startPlatformMockGateway } from "../mock-servers/gateway";
import { createRewritingFetch } from "../mock-servers/rewrite-fetch";

describe("Phase 01 mock API — adapter E2E (auth → fetch → normalize → pipeline)", () => {
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

  const range = { startInclusive: "2025-01-01", endInclusive: "2025-01-31" };

  it("Meta: authenticate, fetchMetrics, normalize, pipeline", async () => {
    const fetchImpl = createRewritingFetch(port);
    const cache = new MemoryPlatformCache();
    const adapter = new MetaPlatformAdapter({
      fetchImpl,
      requestTokenBucket: null,
      tenantId: "t1",
      cache,
    });
    await adapter.authenticate({
      [metaCredentialKeys.accessToken]: "meta-token",
      [metaCredentialKeys.adAccountId]: "12345",
    });
    const raw = await adapter.fetchMetrics(range);
    const norm = adapter.normalizeData(raw, range);
    expect(norm.platform).toBe("meta");
    expect(norm.records.length).toBeGreaterThan(0);
    const piped = runNormalizationPipeline(norm);
    expect(piped.qualityScore).toBeGreaterThanOrEqual(0);
    expect(piped.qualityScore).toBeLessThanOrEqual(100);
  });

  it("GA4: authenticate, fetchMetrics, normalize, pipeline", async () => {
    const fetchImpl = createRewritingFetch(port);
    const adapter = new Ga4PlatformAdapter({
      tenantId: "t-ga4-e2e",
      fetchImpl,
      requestTokenBucket: null,
      dailyQuotaOptions: { maxRequestsPerUtcDay: 500, currentUtcDay: () => "2026-04-04" },
    });
    await adapter.authenticate({
      [ga4CredentialKeys.accessToken]: "ga4-token",
      [ga4CredentialKeys.propertyId]: "properties/999",
    });
    const raw = await adapter.fetchMetrics(range);
    const norm = adapter.normalizeData(raw, range);
    expect(norm.platform).toBe("ga4");
    const piped = runNormalizationPipeline(norm);
    expect(piped.snapshot.records.length).toBeGreaterThanOrEqual(0);
  });

  it("GSC: authenticate, fetchMetrics, normalize, pipeline", async () => {
    const fetchImpl = createRewritingFetch(port);
    const adapter = new GscPlatformAdapter({
      tenantId: "t-gsc-e2e",
      fetchImpl,
      requestTokenBucket: null,
      searchAnalyticsRowLimit: 100,
    });
    await adapter.authenticate({
      [gscCredentialKeys.accessToken]: "gsc-token",
      [gscCredentialKeys.siteUrl]: "https://example.com/",
    });
    const raw = await adapter.fetchMetrics(range);
    const norm = adapter.normalizeData(raw, range);
    expect(norm.platform).toBe("gsc");
    expect(norm.records.some((r) => r.metricKey === "gsc.search.clicks")).toBe(true);
    const piped = runNormalizationPipeline(norm);
    expect(piped.issues.length).toBeGreaterThanOrEqual(0);
  });

  it("GBP: authenticate, fetchMetrics, normalize, pipeline", async () => {
    const fetchImpl = createRewritingFetch(port);
    const adapter = new GbpPlatformAdapter({
      tenantId: "t-gbp-e2e",
      fetchImpl,
      requestTokenBucket: null,
      maxLocations: 3,
    });
    await adapter.authenticate({
      [gbpCredentialKeys.accessToken]: "gbp-token",
    });
    const raw = await adapter.fetchMetrics(range);
    const norm = adapter.normalizeData(raw, range);
    expect(norm.platform).toBe("gbp");
    expect(norm.records.length).toBeGreaterThan(0);
    runNormalizationPipeline(norm);
  });

  it("TikTok (sandbox): authenticate, fetchMetrics, normalize, pipeline", async () => {
    const fetchImpl = createRewritingFetch(port);
    const adapter = new TikTokPlatformAdapter({
      tenantId: "t-tiktok-e2e",
      fetchImpl,
      requestTokenBucket: null,
    });
    await adapter.authenticate({
      [tiktokCredentialKeys.accessToken]: "tt-tok",
      [tiktokCredentialKeys.advertiserId]: "777",
      [tiktokCredentialKeys.sandbox]: "true",
    });
    const raw = await adapter.fetchMetrics(range);
    const norm = adapter.normalizeData(raw, range);
    expect(norm.platform).toBe("tiktok");
    expect(norm.records.length).toBeGreaterThan(0);
    runNormalizationPipeline(norm);
  });

  it("uses MemoryPlatformCache on second fetch (same range)", async () => {
    const fetchImpl = createRewritingFetch(port);
    const cache = new MemoryPlatformCache();
    let graphCalls = 0;
    const countingFetch: typeof fetch = (input, init) => {
      const u =
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      if (u.includes("graph.facebook.com")) {
        graphCalls += 1;
      }
      return fetchImpl(input as RequestInfo, init);
    };
    const adapter = new MetaPlatformAdapter({
      fetchImpl: countingFetch,
      requestTokenBucket: null,
      tenantId: "tenant-cache",
      cache,
    });
    await adapter.authenticate({
      [metaCredentialKeys.accessToken]: "meta-token",
      [metaCredentialKeys.adAccountId]: "999",
    });
    const before = graphCalls;
    await adapter.fetchMetrics(range);
    const afterFirst = graphCalls;
    await adapter.fetchMetrics(range);
    const afterSecond = graphCalls;
    expect(afterFirst - before).toBeGreaterThan(0);
    expect(afterSecond).toBe(afterFirst);
  });
});
