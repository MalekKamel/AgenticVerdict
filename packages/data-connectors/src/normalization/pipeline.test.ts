import { describe, expect, it } from "vitest";

import { runNormalizationPipeline } from "./pipeline";

const range = { startInclusive: "2026-01-01", endInclusive: "2026-01-31" };

describe("runNormalizationPipeline", () => {
  it("produces metadata and a high score for a clean snapshot", () => {
    const res = runNormalizationPipeline(
      {
        connector: "meta",
        dateRange: range,
        records: [
          {
            metricKey: "meta.impressions",
            value: 1000,
            dimensions: { campaign_id: "c1", date_start: "2026-01-01" },
            capturedAt: "2026-01-01T12:00:00.000Z",
          },
          {
            metricKey: "meta.clicks",
            value: 50,
            dimensions: { campaign_id: "c1", date_start: "2026-01-01" },
            capturedAt: "2026-01-01T12:00:00.000Z",
          },
          {
            metricKey: "meta.ctr",
            value: 0.05,
            dimensions: { campaign_id: "c1", date_start: "2026-01-01" },
            capturedAt: "2026-01-01T12:00:00.000Z",
          },
        ],
      },
      { convertSpendToUsd: false, detectOutliers: false },
    );
    expect(res.snapshot.metadata?.pipelineVersion).toBeDefined();
    expect(res.qualityScore).toBeGreaterThanOrEqual(90);
    expect(res.outliers).toHaveLength(0);
  });

  it("flags negative counts and lowers the quality score", () => {
    const res = runNormalizationPipeline(
      {
        connector: "meta",
        dateRange: range,
        records: [
          {
            metricKey: "meta.impressions",
            value: -1,
            capturedAt: "2026-01-01T12:00:00.000Z",
          },
        ],
      },
      { detectOutliers: false },
    );
    expect(res.issues.some((i) => i.code === "range.negative_count")).toBe(true);
    expect(res.qualityScore).toBeLessThan(100);
  });

  it("detects statistical outliers when enabled", () => {
    const values = [1, 1.1, 0.9, 1.05, 100];
    const records = values.map((value) => ({
      metricKey: "meta.test.signal",
      value,
      capturedAt: "2026-01-01T12:00:00.000Z",
    }));
    const res = runNormalizationPipeline(
      { connector: "meta", dateRange: range, records },
      { detectOutliers: true, minGroupSizeForOutliers: 4 },
    );
    expect(res.outliers.length).toBeGreaterThan(0);
    expect(res.qualityScore).toBeLessThan(100);
  });

  it("surfaces schema errors when the final snapshot is not Zod-valid", () => {
    const res = runNormalizationPipeline(
      {
        connector: "meta",
        dateRange: range,
        records: [
          {
            metricKey: "meta.x",
            value: Number.NaN,
            capturedAt: "2026-01-01T12:00:00.000Z",
          },
        ],
      },
      { normalizeCountMetrics: false, detectOutliers: false },
    );
    expect(res.issues.some((issue) => issue.code === "schema.invalid_snapshot")).toBe(true);
  });

  it("converts EUR spend to USD when requested", () => {
    const res = runNormalizationPipeline(
      {
        connector: "meta",
        dateRange: range,
        records: [
          {
            metricKey: "meta.spend",
            value: 100,
            dimensions: { currency: "EUR" },
            capturedAt: "2026-01-01T12:00:00.000Z",
          },
        ],
      },
      { convertSpendToUsd: true, detectOutliers: false },
    );
    expect(res.snapshot.records[0]!.value).toBeCloseTo(108, 4);
  });
});
