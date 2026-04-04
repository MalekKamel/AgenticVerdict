import { afterEach, describe, expect, it, vi } from "vitest";

import { PlatformAuthError, PlatformRateLimitError } from "../errors";
import { MemoryPlatformCache } from "../cache/memory-cache";
import { testAdapterTenantId } from "../test-utils";
import { TokenBucket } from "../token-bucket";
import { MetaPlatformAdapter, metaCredentialKeys, normalizeMetaAdAccountId } from "./meta-adapter";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("normalizeMetaAdAccountId", () => {
  it("prefixes numeric ids", () => {
    expect(normalizeMetaAdAccountId("12345")).toBe("act_12345");
  });

  it("preserves act_ prefix", () => {
    expect(normalizeMetaAdAccountId("act_99")).toBe("act_99");
  });
});

describe("MetaPlatformAdapter", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("rejects when neither access token nor exchange triplet is usable", async () => {
    const adapter = new MetaPlatformAdapter({
      tenantId: testAdapterTenantId,
      requestTokenBucket: null,
    });
    await expect(
      adapter.authenticate({
        [metaCredentialKeys.refreshToken]: "only-refresh",
        [metaCredentialKeys.adAccountId]: "1",
      }),
    ).rejects.toThrow(PlatformAuthError);
  });

  it("rejects missing ad account id", async () => {
    const adapter = new MetaPlatformAdapter({
      tenantId: testAdapterTenantId,
      requestTokenBucket: null,
    });
    await expect(adapter.authenticate({ accessToken: "t" })).rejects.toThrow(PlatformAuthError);
  });

  it("authenticates with access token", async () => {
    const fetchMock = vi.fn<(input: Parameters<typeof fetch>[0]) => Promise<Response>>();
    fetchMock.mockImplementation(async (input) => {
      const url = typeof input === "string" ? input : (input as Request).url;
      if (url.includes("/me?")) {
        return jsonResponse({ id: "u1" });
      }
      return jsonResponse({ data: [] });
    });

    const adapter = new MetaPlatformAdapter({
      tenantId: testAdapterTenantId,
      fetchImpl: fetchMock as typeof fetch,
      requestTokenBucket: null,
    });

    await adapter.authenticate({
      [metaCredentialKeys.accessToken]: "token",
      [metaCredentialKeys.adAccountId]: "123",
    });

    expect(fetchMock).toHaveBeenCalled();
  });

  it("accepts tokenToExchange as an alternative to refreshToken", async () => {
    const fetchMock = vi.fn<(input: Parameters<typeof fetch>[0]) => Promise<Response>>();
    fetchMock.mockImplementation(async (input) => {
      const url = typeof input === "string" ? input : (input as Request).url;
      if (url.includes("/oauth/access_token")) {
        return jsonResponse({ access_token: "from-exchange" });
      }
      if (url.includes("/me?")) {
        return jsonResponse({ id: "u1" });
      }
      return jsonResponse({ data: [] });
    });

    const adapter = new MetaPlatformAdapter({
      tenantId: testAdapterTenantId,
      fetchImpl: fetchMock as typeof fetch,
      requestTokenBucket: null,
    });

    await adapter.authenticate({
      [metaCredentialKeys.appId]: "app",
      [metaCredentialKeys.appSecret]: "sec",
      [metaCredentialKeys.tokenToExchange]: "tok",
      [metaCredentialKeys.adAccountId]: "act_1",
    });

    expect(fetchMock.mock.calls.some(([u]) => String(u).includes("/oauth/access_token"))).toBe(
      true,
    );
  });

  it("exchanges token when app credentials and refresh token are present", async () => {
    const fetchMock = vi.fn<(input: Parameters<typeof fetch>[0]) => Promise<Response>>();
    fetchMock.mockImplementation(async (input) => {
      const url = typeof input === "string" ? input : (input as Request).url;
      if (url.includes("/oauth/access_token")) {
        return jsonResponse({ access_token: "long-lived", expires_in: 5183944 });
      }
      if (url.includes("/me?")) {
        return jsonResponse({ id: "u1" });
      }
      return jsonResponse({ data: [] });
    });

    const adapter = new MetaPlatformAdapter({
      tenantId: testAdapterTenantId,
      fetchImpl: fetchMock as typeof fetch,
      requestTokenBucket: null,
    });

    await adapter.authenticate({
      [metaCredentialKeys.appId]: "app",
      [metaCredentialKeys.appSecret]: "sec",
      [metaCredentialKeys.refreshToken]: "short",
      [metaCredentialKeys.adAccountId]: "act_1",
    });

    const exchangeCall = fetchMock.mock.calls.find(([u]) => {
      const url = typeof u === "string" ? u : (u as Request).url;
      return url.includes("/oauth/access_token");
    });
    expect(exchangeCall).toBeDefined();
  });

  it("aggregates campaign pagination across pages", async () => {
    const fetchMock = vi.fn<(input: Parameters<typeof fetch>[0]) => Promise<Response>>();
    let campaignRequests = 0;

    fetchMock.mockImplementation(async (input) => {
      const url = typeof input === "string" ? input : (input as Request).url;
      if (url.includes("/me?")) {
        return jsonResponse({ id: "u1" });
      }
      if (url.includes("/campaigns")) {
        campaignRequests += 1;
        if (campaignRequests === 1) {
          const items = Array.from({ length: 500 }, (_, i) => ({
            id: `c${i}`,
            name: `Campaign ${i}`,
            status: "ACTIVE",
            objective: "OUTCOME_TRAFFIC",
          }));
          return jsonResponse({
            data: items,
            paging: {
              next: "https://graph.facebook.com/v21.0/act_1/campaigns?access_token=x&after=abc",
            },
          });
        }
        const items = Array.from({ length: 520 }, (_, i) => ({
          id: `c${500 + i}`,
          name: `Campaign ${500 + i}`,
          status: "PAUSED",
          objective: "OUTCOME_LEADS",
        }));
        return jsonResponse({ data: items });
      }
      return jsonResponse({ data: [] });
    });

    const adapter = new MetaPlatformAdapter({
      tenantId: testAdapterTenantId,
      fetchImpl: fetchMock as typeof fetch,
      requestTokenBucket: null,
    });

    await adapter.authenticate({
      [metaCredentialKeys.accessToken]: "token",
      [metaCredentialKeys.adAccountId]: "1",
    });

    const raw = (await adapter.fetchMetrics({
      startInclusive: "2026-01-01",
      endInclusive: "2026-01-31",
    })) as { campaigns: { id: string }[] };

    expect(raw.campaigns.length).toBe(1020);
  });

  it("maps Graph rate limit errors to PlatformRateLimitError", async () => {
    const fetchMock = vi.fn<(input: Parameters<typeof fetch>[0]) => Promise<Response>>();
    fetchMock.mockResolvedValue(
      jsonResponse(
        {
          error: {
            message: "User request limit reached",
            type: "OAuthException",
            code: 17,
          },
        },
        400,
      ),
    );

    const adapter = new MetaPlatformAdapter({
      tenantId: testAdapterTenantId,
      fetchImpl: fetchMock as typeof fetch,
      requestTokenBucket: null,
    });

    await expect(
      adapter.authenticate({
        [metaCredentialKeys.accessToken]: "token",
        [metaCredentialKeys.adAccountId]: "1",
      }),
    ).rejects.toThrow(PlatformRateLimitError);
  });

  it("normalizeData emits insight metrics", async () => {
    const adapter = new MetaPlatformAdapter({
      tenantId: testAdapterTenantId,
      requestTokenBucket: null,
    });
    const snap = adapter.normalizeData(
      {
        adAccountId: "act_1",
        campaigns: [],
        adSets: [],
        ads: [],
        insights: [
          {
            campaign_id: "c1",
            campaign_name: "A",
            impressions: "1000",
            clicks: "40",
            spend: "12.50",
            ctr: "4",
            cpc: "0.31",
            reach: "900",
            actions: [{ action_type: "offsite_conversion.fb_pixel_purchase", value: "3" }],
          },
        ],
        fetchedAt: "2026-01-01T00:00:00.000Z",
      },
      { startInclusive: "2026-01-01", endInclusive: "2026-01-07" },
    );

    const spend = snap.records.find((r) => r.metricKey === "meta.spend");
    expect(spend?.value).toBe(12.5);
    const conv = snap.records.find((r) => r.metricKey === "meta.conversions");
    expect(conv?.value).toBe(3);
  });

  it("consumes the per-request token bucket when one is configured", async () => {
    const fetchMock = vi.fn<(input: Parameters<typeof fetch>[0]) => Promise<Response>>();
    fetchMock.mockImplementation(async (input) => {
      const url = typeof input === "string" ? input : (input as Request).url;
      if (url.includes("/me?")) {
        return jsonResponse({ id: "u1" });
      }
      return jsonResponse({ data: [] });
    });

    const bucket = new TokenBucket(20, 20, 20);
    const adapter = new MetaPlatformAdapter({
      tenantId: testAdapterTenantId,
      fetchImpl: fetchMock as typeof fetch,
      requestTokenBucket: bucket,
    });

    await adapter.authenticate({
      [metaCredentialKeys.accessToken]: "token",
      [metaCredentialKeys.adAccountId]: "1",
    });

    const before = bucket.snapshot().tokens;
    await adapter.fetchMetrics({
      startInclusive: "2026-03-01",
      endInclusive: "2026-03-31",
    });
    expect(bucket.snapshot().tokens).toBeLessThan(before);
  });

  it("throws when ad account id is missing after auth (defensive)", async () => {
    const fetchMock = vi.fn<(input: Parameters<typeof fetch>[0]) => Promise<Response>>();
    fetchMock.mockImplementation(async (input) => {
      const url = typeof input === "string" ? input : (input as Request).url;
      if (url.includes("/me?")) {
        return jsonResponse({ id: "u1" });
      }
      return jsonResponse({ data: [] });
    });

    const adapter = new MetaPlatformAdapter({
      tenantId: testAdapterTenantId,
      fetchImpl: fetchMock as typeof fetch,
      requestTokenBucket: null,
    });

    await adapter.authenticate({
      [metaCredentialKeys.accessToken]: "token",
      [metaCredentialKeys.adAccountId]: "1",
    });

    (adapter as unknown as { adAccountId: string | null }).adAccountId = null;

    await expect(
      adapter.fetchMetrics({ startInclusive: "2026-03-01", endInclusive: "2026-03-31" }),
    ).rejects.toThrow(PlatformAuthError);
  });

  it("uses cache on repeated fetchMetrics when cache enabled", async () => {
    const fetchMock = vi.fn<(input: Parameters<typeof fetch>[0]) => Promise<Response>>();
    fetchMock.mockImplementation(async (input) => {
      const url = typeof input === "string" ? input : (input as Request).url;
      if (url.includes("/me?")) {
        return jsonResponse({ id: "u1" });
      }
      return jsonResponse({ data: [] });
    });

    const cache = new MemoryPlatformCache();
    const adapter = new MetaPlatformAdapter({
      tenantId: "tenant-a",
      fetchImpl: fetchMock as typeof fetch,
      requestTokenBucket: null,
      cache,
    });

    await adapter.authenticate({
      [metaCredentialKeys.accessToken]: "token",
      [metaCredentialKeys.adAccountId]: "1",
    });

    const range = { startInclusive: "2026-02-01", endInclusive: "2026-02-28" };
    await adapter.fetchMetrics(range);
    await adapter.fetchMetrics(range);

    const graphCalls = fetchMock.mock.calls.filter(([u]) => {
      const url = typeof u === "string" ? u : (u as Request).url;
      return (
        url.includes("/campaigns") ||
        url.includes("/adsets") ||
        url.includes("/ads") ||
        url.includes("/insights")
      );
    });
    expect(graphCalls.length).toBe(4);
  });
});
