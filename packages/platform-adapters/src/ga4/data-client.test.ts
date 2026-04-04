import { describe, expect, it, vi, type MockedFunction } from "vitest";

import { PlatformAuthError, PlatformError, PlatformRateLimitError } from "../errors";
import {
  ga4DataApiPost,
  mapGa4DataApiHttpError,
  mergeGa4RunReports,
  normalizeGa4PropertyResourceId,
  runGa4FunnelReportSafe,
} from "./data-client";
import type { Ga4RunReportResponse } from "./models";

describe("normalizeGa4PropertyResourceId", () => {
  it("strips properties/ prefix", () => {
    expect(normalizeGa4PropertyResourceId("properties/12345")).toBe("12345");
    expect(normalizeGa4PropertyResourceId(" 12345 ")).toBe("12345");
  });
});

describe("mapGa4DataApiHttpError", () => {
  it("maps 401 to auth", () => {
    const e = mapGa4DataApiHttpError(401, { error: { message: "nope" } });
    expect(e).toBeInstanceOf(PlatformAuthError);
  });

  it("maps 403 to auth", () => {
    expect(mapGa4DataApiHttpError(403, {})).toBeInstanceOf(PlatformAuthError);
  });

  it("maps 429 to rate limit", () => {
    const e = mapGa4DataApiHttpError(429, { error: { message: "slow down" } });
    expect(e).toBeInstanceOf(PlatformRateLimitError);
  });

  it("maps quota wording on 4xx to rate limit", () => {
    const e = mapGa4DataApiHttpError(400, { error: { message: "Daily quota exceeded" } });
    expect(e).toBeInstanceOf(PlatformRateLimitError);
  });

  it("maps 404 to not_found", () => {
    const e = mapGa4DataApiHttpError(404, { error: { message: "x" } });
    expect(e).toBeInstanceOf(PlatformError);
    expect((e as PlatformError).code).toBe("not_found");
  });

  it("maps 5xx to upstream_error", () => {
    const e = mapGa4DataApiHttpError(503, { error: { message: "down" } });
    expect(e).toBeInstanceOf(PlatformError);
    expect((e as PlatformError).code).toBe("upstream_error");
  });
});

describe("ga4DataApiPost", () => {
  it("normalizes path without leading slash and surfaces API errors", async () => {
    const fetchImpl = () =>
      Promise.resolve(
        new Response(JSON.stringify({ error: { message: "bad", status: "INVALID_ARGUMENT" } }), {
          status: 400,
        }),
      );
    await expect(
      ga4DataApiPost("v1beta/properties/x:runReport", {}, { accessToken: "t", fetchImpl }),
    ).rejects.toMatchObject({ code: "invalid_request" });
  });

  it("accepts paths that already start with /", async () => {
    const fetchImpl = vi.fn(() =>
      Promise.resolve(new Response(JSON.stringify({ rows: [] }), { status: 200 })),
    ) as MockedFunction<typeof fetch>;
    await ga4DataApiPost("/v1beta/properties/x:runReport", {}, { accessToken: "t", fetchImpl });
    expect(fetchImpl.mock.calls[0]?.[0]).toBe(
      "https://analyticsdata.googleapis.com/v1beta/properties/x:runReport",
    );
  });
});

describe("runGa4FunnelReportSafe", () => {
  it("returns an error envelope when the funnel call fails", async () => {
    const fetchImpl = () => Promise.resolve(new Response("{}", { status: 500 }));
    const r = await runGa4FunnelReportSafe({
      propertyResourceId: "1",
      startDate: "2024-01-01",
      endDate: "2024-01-07",
      options: { accessToken: "t", fetchImpl },
    });
    expect("error" in r).toBe(true);
  });
});

describe("mergeGa4RunReports", () => {
  it("returns an empty object for an empty input list", () => {
    expect(mergeGa4RunReports([])).toEqual({});
  });

  it("concatenates rows and preserves headers from the first report", () => {
    const a: Ga4RunReportResponse = {
      dimensionHeaders: [{ name: "date" }],
      metricHeaders: [{ name: "sessions" }],
      rows: [
        {
          dimensionValues: [{ value: "20240101" }],
          metricValues: [{ value: "1" }],
        },
      ],
    };
    const b: Ga4RunReportResponse = {
      rows: [
        {
          dimensionValues: [{ value: "20240102" }],
          metricValues: [{ value: "2" }],
        },
      ],
    };
    const m = mergeGa4RunReports([a, b]);
    expect(m.rows).toHaveLength(2);
    expect(m.dimensionHeaders).toEqual(a.dimensionHeaders);
  });

  it("marks merged metadata when any chunk is sampled", () => {
    const clean: Ga4RunReportResponse = { rows: [] };
    const dirty: Ga4RunReportResponse = {
      rows: [],
      metadata: { dataLossFromOtherReason: true },
    };
    const m = mergeGa4RunReports([clean, dirty]);
    expect(m.metadata?.dataLossFromOtherReason).toBe(true);
  });
});
