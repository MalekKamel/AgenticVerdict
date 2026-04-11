import { describe, expect, it, vi } from "vitest";

import { PlatformAuthError, PlatformError } from "../errors";
import { testAdapterTenantId } from "../test-utils";
import { GbpConnectorAdapter } from "./gbp-adapter";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("GbpConnectorAdapter", () => {
  it("authenticates with access token", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({ expires_in: 3600, aud: "x.apps.googleusercontent.com" }),
      );
    const a = new GbpConnectorAdapter({
      tenantId: testAdapterTenantId,
      fetchImpl,
      requestTokenBucket: null,
    });
    await a.authenticate({ accessToken: "t" });
    expect(fetchImpl.mock.calls[0]?.[0]).toContain("tokeninfo");
  });

  it("lists accounts, locations, reviews, and performance", async () => {
    const fetchImpl = vi.fn().mockImplementation((url: string) => {
      const u = String(url);
      if (u.includes("tokeninfo")) {
        return Promise.resolve(jsonResponse({ expires_in: 3600, aud: "x" }));
      }
      if (
        u.includes("mybusinessaccountmanagement") &&
        u.includes("/accounts") &&
        !u.includes("pageToken")
      ) {
        return Promise.resolve(
          jsonResponse({
            accounts: [{ name: "accounts/1", accountName: "Acc" }],
          }),
        );
      }
      if (u.includes("mybusinessbusinessinformation") && u.includes("/locations")) {
        return Promise.resolve(
          jsonResponse({
            locations: [
              {
                name: "accounts/1/locations/77",
                title: "Store",
                websiteUri: "https://store.example",
              },
            ],
          }),
        );
      }
      if (u.includes("mybusiness.googleapis.com/v4") && u.includes("/reviews")) {
        return Promise.resolve(
          jsonResponse({
            averageRating: 4.2,
            totalReviewCount: 10,
            reviews: [{ starRating: "FIVE", comment: "great" }],
          }),
        );
      }
      if (
        u.includes("businessprofileperformance") &&
        u.includes(":fetchMultiDailyMetricsTimeSeries")
      ) {
        return Promise.resolve(
          jsonResponse({
            multiDailyMetricTimeSeries: [
              {
                dailyMetric: "CALL_CLICKS",
                timeSeries: { datedValues: [{ value: "3" }, { value: "1" }] },
              },
            ],
          }),
        );
      }
      return Promise.resolve(jsonResponse({}, 404));
    });

    const a = new GbpConnectorAdapter({
      tenantId: testAdapterTenantId,
      fetchImpl,
      requestTokenBucket: null,
      maxLocations: 5,
    });
    await a.authenticate({ accessToken: "t" });
    const range = { startInclusive: "2025-01-01", endInclusive: "2025-01-07" };
    const raw = await a.fetchMetrics(range);
    const norm = a.normalizeData(raw, range);
    expect(norm.records.some((r) => r.metricKey === "gbp.location.count")).toBe(true);
    expect(norm.records.some((r) => r.metricKey === "gbp.performance.CALL_CLICKS")).toBe(true);
  });

  it("throws when accountResourceName filter matches nothing", async () => {
    const fetchImpl = vi.fn().mockImplementation((url: string) => {
      if (String(url).includes("tokeninfo")) {
        return Promise.resolve(jsonResponse({ expires_in: 3600, aud: "x" }));
      }
      if (String(url).includes("mybusinessaccountmanagement")) {
        return Promise.resolve(jsonResponse({ accounts: [{ name: "accounts/99" }] }));
      }
      return Promise.resolve(jsonResponse({}, 404));
    });
    const a = new GbpConnectorAdapter({
      tenantId: testAdapterTenantId,
      fetchImpl,
      requestTokenBucket: null,
    });
    await a.authenticate({
      accessToken: "t",
      accountResourceName: "accounts/1",
    });
    await expect(
      a.fetchMetrics({ startInclusive: "2025-01-01", endInclusive: "2025-01-02" }),
    ).rejects.toThrow(PlatformError);
  });

  it("requires access token or refresh bundle", async () => {
    const a = new GbpConnectorAdapter({
      tenantId: testAdapterTenantId,
      requestTokenBucket: null,
    });
    await expect(a.authenticate({})).rejects.toThrow(PlatformAuthError);
  });

  it("refreshes access token when refresh bundle is present", async () => {
    const fetchImpl = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
      const u = String(url);
      if (u.includes("tokeninfo")) {
        return Promise.resolve(jsonResponse({ expires_in: 3600, aud: "x" }));
      }
      if (!u.includes("tokeninfo") && u.includes("oauth2.googleapis.com") && u.endsWith("/token")) {
        expect(init?.method).toBe("POST");
        return Promise.resolve(jsonResponse({ access_token: "fresh", expires_in: 3600 }));
      }
      return Promise.resolve(jsonResponse({}, 404));
    });
    const a = new GbpConnectorAdapter({
      tenantId: testAdapterTenantId,
      fetchImpl,
      requestTokenBucket: null,
    });
    await a.authenticate({
      clientId: "c",
      clientSecret: "s",
      refreshToken: "r",
    });
    expect(fetchImpl.mock.calls.some((c) => String(c[0]).includes("/token"))).toBe(true);
  });

  it("skips performance when location id cannot be parsed", async () => {
    const fetchImpl = vi.fn().mockImplementation((url: string) => {
      const u = String(url);
      if (u.includes("tokeninfo")) {
        return Promise.resolve(jsonResponse({ expires_in: 3600, aud: "x" }));
      }
      if (u.includes("mybusinessaccountmanagement")) {
        return Promise.resolve(jsonResponse({ accounts: [{ name: "accounts/1" }] }));
      }
      if (u.includes("mybusinessbusinessinformation")) {
        return Promise.resolve(jsonResponse({ locations: [{ name: "bad-name", title: "X" }] }));
      }
      if (u.includes("/reviews")) {
        return Promise.resolve(jsonResponse({ reviews: [], totalReviewCount: 0 }));
      }
      return Promise.resolve(jsonResponse({}, 404));
    });
    const a = new GbpConnectorAdapter({
      tenantId: testAdapterTenantId,
      fetchImpl,
      requestTokenBucket: null,
      maxLocations: 2,
    });
    await a.authenticate({ accessToken: "t" });
    const range = { startInclusive: "2025-01-01", endInclusive: "2025-01-03" };
    const raw = await a.fetchMetrics(range);
    const norm = a.normalizeData(raw, range);
    expect(norm.records.some((r) => r.metricKey.startsWith("gbp.performance."))).toBe(false);
  });
});
