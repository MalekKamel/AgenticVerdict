import { describe, expect, it, vi, type MockedFunction } from "vitest";

import { PlatformAuthError, PlatformError } from "../errors";
import { testAdapterTenantId } from "../test-utils";
import { Ga4PlatformAdapter, ga4CredentialKeys } from "./ga4-adapter";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function fetchInputToString(input: Parameters<typeof fetch>[0]): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.href;
  return input.url;
}

function createAnalyticsFetch(): MockedFunction<typeof fetch> {
  return vi.fn(async (input: Parameters<typeof fetch>[0]) => {
    const url = fetchInputToString(input);
    if (url.includes("tokeninfo")) {
      return jsonResponse({ expires_in: "3600", aud: "test.apps.googleusercontent.com" });
    }
    if (url.includes("oauth2.googleapis.com/token") && !url.includes("tokeninfo")) {
      return jsonResponse({ access_token: "refreshed", expires_in: 3600, token_type: "Bearer" });
    }
    if (url.includes(":runReport")) {
      return jsonResponse({
        dimensionHeaders: [{ name: "date" }],
        metricHeaders: [{ name: "sessions" }],
        rows: [],
      });
    }
    if (url.includes(":runRealtimeReport")) {
      return jsonResponse({ rows: [], dimensionHeaders: [], metricHeaders: [] });
    }
    if (url.includes(":runFunnelReport")) {
      return jsonResponse({ kind: "analyticsData#funnelReport" });
    }
    return jsonResponse({ error: { message: `unexpected ${url}`, status: "UNKNOWN" } }, 500);
  });
}

describe("Ga4PlatformAdapter", () => {
  it("requires propertyId on authenticate", async () => {
    const adapter = new Ga4PlatformAdapter({
      tenantId: testAdapterTenantId,
      fetchImpl: createAnalyticsFetch(),
      requestTokenBucket: null,
    });
    await expect(adapter.authenticate({ accessToken: "t" })).rejects.toThrow(PlatformAuthError);
  });

  it("authenticates with accessToken and validates via tokeninfo", async () => {
    const fetchImpl = createAnalyticsFetch();
    const adapter = new Ga4PlatformAdapter({
      tenantId: testAdapterTenantId,
      fetchImpl,
      requestTokenBucket: null,
    });
    await adapter.authenticate({
      [ga4CredentialKeys.accessToken]: "at",
      [ga4CredentialKeys.propertyId]: "properties/999",
    });
    expect(fetchImpl).toHaveBeenCalled();
  });

  it("refreshes when client credentials and refresh token are present", async () => {
    const fetchImpl = createAnalyticsFetch();
    const adapter = new Ga4PlatformAdapter({
      tenantId: testAdapterTenantId,
      fetchImpl,
      requestTokenBucket: null,
    });
    await adapter.authenticate({
      [ga4CredentialKeys.clientId]: "cid",
      [ga4CredentialKeys.clientSecret]: "sec",
      [ga4CredentialKeys.refreshToken]: "rt",
      [ga4CredentialKeys.propertyId]: "1",
    });
    const urls = fetchImpl.mock.calls.map((c) => String(c[0]));
    expect(urls.some((u) => u.includes("oauth2.googleapis.com/token"))).toBe(true);
  });

  it("fetchRawMetrics splits long ranges and counts Data API calls", async () => {
    const fetchImpl = createAnalyticsFetch();
    const adapter = new Ga4PlatformAdapter({
      tenantId: testAdapterTenantId,
      fetchImpl,
      requestTokenBucket: null,
      dailyQuotaOptions: { maxRequestsPerUtcDay: 500, currentUtcDay: () => "2026-04-04" },
    });
    await adapter.authenticate({
      [ga4CredentialKeys.accessToken]: "at",
      [ga4CredentialKeys.propertyId]: "1",
    });

    const raw = await adapter.fetchMetrics({
      startInclusive: "2024-01-01",
      endInclusive: "2025-02-03",
    });
    expect((raw as { dataApiCalls?: number }).dataApiCalls).toBe(6);

    const reportCalls = fetchImpl.mock.calls.filter((c) =>
      String(c[0]).includes(":runReport"),
    ).length;
    expect(reportCalls).toBe(4);
  });

  it("throws when daily quota is exceeded", async () => {
    const fetchImpl = createAnalyticsFetch();
    const adapter = new Ga4PlatformAdapter({
      tenantId: testAdapterTenantId,
      fetchImpl,
      requestTokenBucket: null,
      dailyQuotaOptions: { maxRequestsPerUtcDay: 1, currentUtcDay: () => "2026-04-04" },
    });
    await adapter.authenticate({
      [ga4CredentialKeys.accessToken]: "at",
      [ga4CredentialKeys.propertyId]: "1",
    });
    await expect(
      adapter.fetchMetrics({ startInclusive: "2024-01-01", endInclusive: "2024-01-07" }),
    ).rejects.toThrow(PlatformError);
  });

  it("records sampling when traffic report signals data loss", async () => {
    let reportCall = 0;
    const fetchImpl = vi.fn(async (url: string) => {
      if (url.includes("tokeninfo")) {
        return jsonResponse({ expires_in: "3600", aud: "x" });
      }
      if (url.includes(":runReport")) {
        reportCall += 1;
        if (reportCall % 2 === 0) {
          return jsonResponse({
            rows: [],
            dimensionHeaders: [],
            metricHeaders: [],
            metadata: { dataLossFromOtherReason: true },
          });
        }
        return jsonResponse({ rows: [], dimensionHeaders: [], metricHeaders: [] });
      }
      if (url.includes(":runRealtimeReport")) {
        return jsonResponse({ rows: [], dimensionHeaders: [], metricHeaders: [] });
      }
      if (url.includes(":runFunnelReport")) {
        return jsonResponse({});
      }
      return jsonResponse({ error: { message: "unexpected" } }, 500);
    }) as unknown as typeof fetch;

    const adapter = new Ga4PlatformAdapter({
      tenantId: testAdapterTenantId,
      fetchImpl,
      requestTokenBucket: null,
      dailyQuotaOptions: { maxRequestsPerUtcDay: 50, currentUtcDay: () => "2026-04-04" },
    });
    await adapter.authenticate({
      [ga4CredentialKeys.accessToken]: "at",
      [ga4CredentialKeys.propertyId]: "1",
    });
    const dr = { startInclusive: "2024-01-01", endInclusive: "2024-01-07" };
    const raw = (await adapter.fetchMetrics(dr)) as { sampling: { sources: string[] } };
    expect(raw.sampling.sources).toContain("trafficReport");
  });

  it("records sampling when realtime metadata indicates sampling", async () => {
    const fetchImpl = vi.fn(async (url: string) => {
      if (url.includes("tokeninfo")) {
        return jsonResponse({ expires_in: "3600", aud: "x" });
      }
      if (url.includes(":runReport")) {
        return jsonResponse({ rows: [], dimensionHeaders: [], metricHeaders: [] });
      }
      if (url.includes(":runRealtimeReport")) {
        return jsonResponse({
          rows: [],
          metadata: {
            samplingMetadatas: [{ samplesReadCount: "1", samplingSpaceSize: "100" }],
          },
        });
      }
      if (url.includes(":runFunnelReport")) {
        return jsonResponse({});
      }
      return jsonResponse({ error: { message: "unexpected" } }, 500);
    }) as unknown as typeof fetch;

    const adapter = new Ga4PlatformAdapter({
      tenantId: testAdapterTenantId,
      fetchImpl,
      requestTokenBucket: null,
      dailyQuotaOptions: { maxRequestsPerUtcDay: 50, currentUtcDay: () => "2026-04-04" },
    });
    await adapter.authenticate({
      [ga4CredentialKeys.accessToken]: "at",
      [ga4CredentialKeys.propertyId]: "1",
    });
    const dr = { startInclusive: "2024-01-01", endInclusive: "2024-01-07" };
    const raw = (await adapter.fetchMetrics(dr)) as { sampling: { sources: string[] } };
    expect(raw.sampling.sources).toContain("realtimeReport");
  });

  it("normalizeData maps raw payload", async () => {
    const fetchImpl = createAnalyticsFetch();
    const adapter = new Ga4PlatformAdapter({
      tenantId: testAdapterTenantId,
      fetchImpl,
      requestTokenBucket: null,
      dailyQuotaOptions: { maxRequestsPerUtcDay: 100, currentUtcDay: () => "2026-04-04" },
    });
    await adapter.authenticate({
      [ga4CredentialKeys.accessToken]: "at",
      [ga4CredentialKeys.propertyId]: "1",
    });
    const dr = { startInclusive: "2024-01-01", endInclusive: "2024-01-07" };
    const raw = await adapter.fetchMetrics(dr);
    const snap = adapter.normalizeData(raw, dr);
    expect(snap.platform).toBe("ga4");
    expect(snap.records.some((r) => r.metricKey === "ga4.meta.dataApiCalls")).toBe(true);
  });
});
