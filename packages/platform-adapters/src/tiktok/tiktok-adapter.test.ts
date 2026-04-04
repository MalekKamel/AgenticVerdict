import { afterEach, describe, expect, it, vi } from "vitest";

import { PlatformAuthError } from "../errors";
import { testAdapterTenantId } from "../test-utils";
import { TikTokPlatformAdapter, tiktokCredentialKeys } from "./tiktok-adapter";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("TikTokPlatformAdapter", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("rejects missing advertiserId", async () => {
    const adapter = new TikTokPlatformAdapter({
      tenantId: testAdapterTenantId,
      requestTokenBucket: null,
    });
    await expect(
      adapter.authenticate({
        [tiktokCredentialKeys.accessToken]: "t",
      }),
    ).rejects.toThrow(PlatformAuthError);
  });

  it("rejects when no usable token or oauth inputs", async () => {
    const adapter = new TikTokPlatformAdapter({
      tenantId: testAdapterTenantId,
      requestTokenBucket: null,
    });
    await expect(
      adapter.authenticate({
        [tiktokCredentialKeys.advertiserId]: "123",
        [tiktokCredentialKeys.appId]: "app",
      }),
    ).rejects.toThrow(PlatformAuthError);
  });

  it("authenticates with accessToken and validates advertiser", async () => {
    const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>();
    fetchMock.mockImplementation(async (input) => {
      const u = String(input);
      if (u.includes("/user/info/")) {
        return jsonResponse({ code: 0, message: "OK", data: {} });
      }
      if (u.includes("/advertiser/info/")) {
        return jsonResponse({
          code: 0,
          message: "OK",
          data: { list: [{ advertiser_id: "99" }] },
        });
      }
      return jsonResponse({ code: 40_999, message: u }, 400);
    });

    const adapter = new TikTokPlatformAdapter({
      tenantId: testAdapterTenantId,
      fetchImpl: fetchMock as typeof fetch,
      requestTokenBucket: null,
    });

    await adapter.authenticate({
      [tiktokCredentialKeys.accessToken]: "tok",
      [tiktokCredentialKeys.advertiserId]: "99",
    });

    expect(fetchMock.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it("exchanges authCode when provided with app credentials", async () => {
    const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>();
    fetchMock.mockImplementation(async (input) => {
      const u = String(input);
      if (u.includes("/oauth2/access_token/")) {
        return jsonResponse({
          code: 0,
          message: "OK",
          data: { access_token: "from-code" },
        });
      }
      if (u.includes("/user/info/")) {
        return jsonResponse({ code: 0, message: "OK", data: {} });
      }
      if (u.includes("/advertiser/info/")) {
        return jsonResponse({ code: 0, message: "OK", data: { list: [] } });
      }
      return jsonResponse({ code: 40_999, message: u }, 400);
    });

    const adapter = new TikTokPlatformAdapter({
      tenantId: testAdapterTenantId,
      fetchImpl: fetchMock as typeof fetch,
      requestTokenBucket: null,
    });

    await adapter.authenticate({
      [tiktokCredentialKeys.appId]: "app",
      [tiktokCredentialKeys.appSecret]: "sec",
      [tiktokCredentialKeys.authCode]: "code",
      [tiktokCredentialKeys.advertiserId]: "7",
    });

    expect(
      fetchMock.mock.calls.some(
        ([, init]) =>
          String(init?.body ?? "").includes("auth_code") && String(init?.body).includes("code"),
      ),
    ).toBe(true);
  });

  it("refreshes via appId, secret, refreshToken before validate", async () => {
    const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>();
    fetchMock.mockImplementation(async (input, init) => {
      const u = String(input);
      if (u.includes("/oauth2/access_token/")) {
        return jsonResponse({
          code: 0,
          message: "OK",
          data: { access_token: "fresh" },
        });
      }
      if (u.includes("/user/info/")) {
        return jsonResponse({ code: 0, message: "OK", data: {} });
      }
      if (u.includes("/advertiser/info/")) {
        return jsonResponse({ code: 0, message: "OK", data: { list: [] } });
      }
      return jsonResponse({ code: 40_999, message: `${u} ${init?.method}` }, 400);
    });

    const adapter = new TikTokPlatformAdapter({
      tenantId: testAdapterTenantId,
      fetchImpl: fetchMock as typeof fetch,
      requestTokenBucket: null,
    });

    await adapter.authenticate({
      [tiktokCredentialKeys.appId]: "app",
      [tiktokCredentialKeys.appSecret]: "sec",
      [tiktokCredentialKeys.refreshToken]: "rt",
      [tiktokCredentialKeys.advertiserId]: "1",
    });

    expect(fetchMock.mock.calls.some(([u]) => String(u).includes("/oauth2/access_token/"))).toBe(
      true,
    );
  });

  it("fetchMetrics aggregates list and report calls", async () => {
    const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>();
    fetchMock.mockImplementation(async (input) => {
      const u = String(input);
      if (u.includes("/user/info/") || u.includes("/advertiser/info/")) {
        return jsonResponse({ code: 0, message: "OK", data: { list: [] } });
      }
      if (u.includes("/campaign/get/")) {
        return jsonResponse({
          code: 0,
          message: "OK",
          data: {
            list: [{ campaign_id: "c1", campaign_name: "N" }],
            page_info: { total_number: 1 },
          },
        });
      }
      if (u.includes("/adgroup/get/") || u.includes("/ad/get/")) {
        return jsonResponse({
          code: 0,
          message: "OK",
          data: { list: [], page_info: { total_number: 0 } },
        });
      }
      if (u.includes("/report/integrated/get/")) {
        return jsonResponse({
          code: 0,
          message: "OK",
          data: {
            list: [
              {
                metrics: { impressions: "1" },
                dimensions: { campaign_id: "c1", stat_time_day: "2026-01-01" },
              },
            ],
            page_info: { total_number: 1 },
          },
        });
      }
      return jsonResponse({ code: 40_999, message: u }, 400);
    });

    const adapter = new TikTokPlatformAdapter({
      tenantId: testAdapterTenantId,
      fetchImpl: fetchMock as typeof fetch,
      requestTokenBucket: null,
    });

    await adapter.authenticate({
      [tiktokCredentialKeys.accessToken]: "tok",
      [tiktokCredentialKeys.advertiserId]: "adv",
    });

    const raw = await adapter.fetchMetrics({
      startInclusive: "2026-01-01",
      endInclusive: "2026-01-10",
    });

    expect(fetchMock.mock.calls.some(([u]) => String(u).includes("/campaign/get/"))).toBe(true);
    expect(fetchMock.mock.calls.some(([u]) => String(u).includes("/report/integrated/get/"))).toBe(
      true,
    );

    const normalized = adapter.normalizeData(raw, {
      startInclusive: "2026-01-01",
      endInclusive: "2026-01-10",
    });
    expect(normalized.platform).toBe("tiktok");
    expect(normalized.records.length).toBeGreaterThan(0);
  });
});
