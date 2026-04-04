import { describe, expect, it, vi } from "vitest";

import { PlatformAuthError, PlatformError } from "../errors";
import { testAdapterTenantId } from "../test-utils";
import { GscPlatformAdapter } from "./gsc-adapter";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("GscPlatformAdapter", () => {
  it("requires siteUrl", async () => {
    const a = new GscPlatformAdapter({
      tenantId: testAdapterTenantId,
      requestTokenBucket: null,
    });
    await expect(a.authenticate({ accessToken: "t" })).rejects.toThrow(PlatformAuthError);
  });

  it("authenticates and validates token", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({ expires_in: 3600, aud: "x.apps.googleusercontent.com" }),
      );
    const a = new GscPlatformAdapter({
      tenantId: testAdapterTenantId,
      fetchImpl,
      requestTokenBucket: null,
    });
    await a.authenticate({ siteUrl: "https://example.com/", accessToken: "t" });
    expect(fetchImpl.mock.calls[0]?.[0]).toContain("tokeninfo");
  });

  it("rejects search analytics ranges beyond the GSC cap", async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(jsonResponse({ expires_in: 3600, aud: "x" }));
    const a = new GscPlatformAdapter({
      tenantId: testAdapterTenantId,
      fetchImpl,
      requestTokenBucket: null,
    });
    await a.authenticate({ siteUrl: "https://example.com/", accessToken: "t" });
    await expect(
      a.fetchMetrics({ startInclusive: "2020-01-01", endInclusive: "2025-12-31" }),
    ).rejects.toThrow(PlatformError);
  });

  it("paginates search analytics until a short page", async () => {
    const row = {
      keys: ["q1", "/p", "MOBILE", "usa"],
      clicks: 2,
      impressions: 20,
      ctr: 0.1,
      position: 3.5,
    };
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ expires_in: 3600, aud: "x" }))
      .mockResolvedValueOnce(jsonResponse({ rows: [row] }))
      .mockResolvedValueOnce(jsonResponse({ rows: [] }))
      .mockResolvedValueOnce(
        jsonResponse({ sitemap: [{ path: "https://example.com/s.xml", isPending: true }] }),
      );

    const a = new GscPlatformAdapter({
      tenantId: testAdapterTenantId,
      fetchImpl,
      requestTokenBucket: null,
      searchAnalyticsRowLimit: 1,
    });
    await a.authenticate({ siteUrl: "https://example.com/", accessToken: "t" });
    const range = { startInclusive: "2025-01-01", endInclusive: "2025-01-31" };
    const raw = await a.fetchMetrics(range);
    const norm = a.normalizeData(raw, range);
    expect(norm.platform).toBe("gsc");
    expect(norm.records.some((r) => r.metricKey === "gsc.search.clicks")).toBe(true);
    expect(norm.records.some((r) => r.metricKey === "gsc.sitemap.pending_count")).toBe(true);
    const posts = fetchImpl.mock.calls.filter((c) => {
      const u = String(c[0]);
      return u.includes("webmasters") && c[1]?.method === "POST";
    });
    expect(posts.length).toBe(2);
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
    const a = new GscPlatformAdapter({
      tenantId: testAdapterTenantId,
      fetchImpl,
      requestTokenBucket: null,
    });
    await a.authenticate({
      siteUrl: "https://example.com/",
      clientId: "c",
      clientSecret: "s",
      refreshToken: "r",
    });
    expect(fetchImpl.mock.calls.some((c) => String(c[0]).includes("/token"))).toBe(true);
  });

  it("runs URL inspection when inspectionUrl credential is set", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ expires_in: 3600, aud: "x" }))
      .mockResolvedValueOnce(jsonResponse({ rows: [] }))
      .mockResolvedValueOnce(jsonResponse({ sitemap: [] }))
      .mockResolvedValueOnce(
        jsonResponse({
          inspectionResult: {
            indexStatusResult: { verdict: "PASS", coverageState: "Submitted and indexed" },
            mobileUsabilityResult: { verdict: "PASS", issues: [] },
          },
        }),
      );

    const a = new GscPlatformAdapter({
      tenantId: testAdapterTenantId,
      fetchImpl,
      requestTokenBucket: null,
    });
    await a.authenticate({
      siteUrl: "https://example.com/",
      accessToken: "t",
      inspectionUrl: "https://example.com/hello",
    });
    const range = { startInclusive: "2025-01-01", endInclusive: "2025-01-07" };
    const raw = await a.fetchMetrics(range);
    const lastUrl = String(fetchImpl.mock.calls[fetchImpl.mock.calls.length - 1]?.[0]);
    expect(lastUrl).toContain("searchconsole.googleapis.com");
    const norm = a.normalizeData(raw, range);
    expect(norm.records.some((r) => r.metricKey === "gsc.inspection.index_verdict")).toBe(true);
  });
});
