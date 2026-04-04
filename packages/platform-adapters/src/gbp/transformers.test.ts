import { describe, expect, it } from "vitest";

import type { GbpRawMetricsPayload } from "./models";
import { normalizeGbpRawMetrics } from "./transformers";

describe("normalizeGbpRawMetrics", () => {
  it("returns empty snapshot for invalid raw", () => {
    const r = normalizeGbpRawMetrics(
      {},
      { startInclusive: "2025-01-01", endInclusive: "2025-01-02" },
    );
    expect(r.records).toHaveLength(0);
  });

  it("normalizes accounts, locations, reviews, performance, and errors", () => {
    const raw: GbpRawMetricsPayload = {
      fetchedAt: "2025-01-01T00:00:00.000Z",
      requestedRange: { startInclusive: "2025-01-01", endInclusive: "2025-01-07" },
      accounts: [{ name: "accounts/1" }],
      locations: [
        {
          accountName: "accounts/1",
          location: { name: "accounts/1/locations/2", title: "Shop" },
          reviews: null,
          performance: {
            multiDailyMetricTimeSeries: [
              { dailyMetric: "WEBSITE_CLICKS", timeSeries: { datedValues: [{ value: "x" }] } },
            ],
          },
        },
        {
          accountName: "accounts/1",
          location: { name: "accounts/1/locations/3", title: "Other" },
          reviews: { reviews: [], totalReviewCount: 0, averageRating: 0 },
          performance: null,
          performanceError: "performance api disabled",
        },
      ],
    };
    const range = raw.requestedRange;
    const r = normalizeGbpRawMetrics(raw, range);
    expect(r.records.find((x) => x.metricKey === "gbp.performance.error")).toBeDefined();
    expect(r.records.some((x) => x.metricKey === "gbp.account.count")).toBe(true);
  });
});
