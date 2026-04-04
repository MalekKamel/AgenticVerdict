import { describe, expect, it, vi } from "vitest";

import { PlatformError } from "../errors";
import {
  tiktokFetchAllListPages,
  tiktokFetchIntegratedCampaignReport,
  tiktokMarketingGet,
} from "./api-client";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("tiktokMarketingGet", () => {
  it("throws when HTTP status is not ok", async () => {
    const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>();
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ code: 40_999, message: "x" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(
      tiktokMarketingGet(
        "campaign/get/",
        { advertiser_id: "a" },
        {
          accessToken: "t",
          fetchImpl: fetchMock as typeof fetch,
        },
      ),
    ).rejects.toThrow(PlatformError);
  });

  it("omits empty string query params", async () => {
    const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>();
    fetchMock.mockResolvedValue(
      jsonResponse({
        code: 0,
        message: "OK",
        data: {},
      }),
    );

    await tiktokMarketingGet(
      "x/",
      { advertiser_id: "1", empty: "" },
      { accessToken: "t", fetchImpl: fetchMock as typeof fetch },
    );

    const url = String(fetchMock.mock.calls[0]![0]);
    expect(url).not.toContain("empty=");
  });

  it("returns data on success envelope", async () => {
    const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>();
    fetchMock.mockResolvedValue(
      jsonResponse({
        code: 0,
        message: "OK",
        data: { list: [{ id: "1" }], page_info: { total_number: 1 } },
      }),
    );

    const data = await tiktokMarketingGet<{ list: { id: string }[] }>(
      "campaign/get/",
      { advertiser_id: "adv", page: "1", page_size: "10" },
      { accessToken: "t", fetchImpl: fetchMock as typeof fetch },
    );

    expect(data.list).toHaveLength(1);
    expect(fetchMock.mock.calls[0]![1]?.headers).toBeDefined();
  });
});

describe("tiktokFetchAllListPages", () => {
  it("follows page_info total_number across pages", async () => {
    const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>();
    let n = 0;
    fetchMock.mockImplementation(async (input) => {
      const u = String(input);
      if (u.includes("page=1")) {
        return jsonResponse({
          code: 0,
          message: "OK",
          data: {
            list: [{ campaign_id: "c1" }],
            page_info: { total_number: 2 },
          },
        });
      }
      if (u.includes("page=2")) {
        n += 1;
        return jsonResponse({
          code: 0,
          message: "OK",
          data: {
            list: [{ campaign_id: "c2" }],
            page_info: { total_number: 2 },
          },
        });
      }
      return jsonResponse({ code: 40_999, message: "unexpected url" }, 400);
    });

    const rows = await tiktokFetchAllListPages<{ campaign_id: string }>("campaign/get/", "adv1", {
      accessToken: "t",
      fetchImpl: fetchMock as typeof fetch,
    });

    expect(rows.map((r) => r.campaign_id)).toEqual(["c1", "c2"]);
    expect(n).toBe(1);
  });
});

describe("tiktokFetchIntegratedCampaignReport", () => {
  it("aggregates paginated integrated rows", async () => {
    const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>();
    fetchMock.mockResolvedValue(
      jsonResponse({
        code: 0,
        message: "OK",
        data: {
          list: [
            {
              metrics: { impressions: "10", spend: "1.5" },
              dimensions: { campaign_id: "c1", stat_time_day: "2026-01-01" },
            },
          ],
          page_info: { total_number: 1 },
        },
      }),
    );

    const rows = await tiktokFetchIntegratedCampaignReport("adv", "2026-01-01", "2026-01-07", {
      accessToken: "t",
      fetchImpl: fetchMock as typeof fetch,
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]?.dimensions?.campaign_id).toBe("c1");
  });
});
