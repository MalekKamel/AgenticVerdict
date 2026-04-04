import { describe, expect, it } from "vitest";

import { detectMetricValueOutliers } from "./outliers";

describe("detectMetricValueOutliers", () => {
  it("returns empty when sample size is below threshold", () => {
    const flags = detectMetricValueOutliers(
      [
        { metricKey: "k", value: 1, capturedAt: "t" },
        { metricKey: "k", value: 100, capturedAt: "t" },
      ],
      { minValuesPerMetricKey: 4 },
    );
    expect(flags).toHaveLength(0);
  });

  it("does not flag when IQR collapses to zero", () => {
    const records = [1, 1, 1, 1, 1].map((value) => ({
      metricKey: "x.m",
      value,
      capturedAt: "2026-01-01T00:00:00.000Z",
    }));
    const flags = detectMetricValueOutliers(records, { minValuesPerMetricKey: 4 });
    expect(flags).toHaveLength(0);
  });

  it("flags extreme values for the same metric key", () => {
    const records = [1, 1.2, 0.8, 1.1, 50].map((value) => ({
      metricKey: "x.m",
      value,
      capturedAt: "2026-01-01T00:00:00.000Z",
    }));
    const flags = detectMetricValueOutliers(records, {
      minValuesPerMetricKey: 4,
      iqrMultiplier: 1.5,
    });
    expect(flags.some((f) => f.value === 50)).toBe(true);
  });
});
