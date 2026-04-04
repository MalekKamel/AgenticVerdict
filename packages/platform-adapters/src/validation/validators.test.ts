import { describe, expect, it } from "vitest";

import type { NormalizedPlatformSnapshot } from "../normalization/types";

import {
  validateCrossFieldCtr,
  validateNormalizedSnapshot,
  validateSpendVersusCpcClicks,
} from "./validators";

const base: NormalizedPlatformSnapshot = {
  platform: "meta",
  dateRange: { startInclusive: "2026-01-01", endInclusive: "2026-01-02" },
  records: [],
};

describe("validateNormalizedSnapshot", () => {
  it("errors on non-finite values", () => {
    const issues = validateNormalizedSnapshot({
      ...base,
      records: [{ metricKey: "meta.x", value: Number.NaN, capturedAt: "2026-01-01T00:00:00.000Z" }],
    });
    expect(issues.some((i) => i.code === "range.non_finite")).toBe(true);
  });

  it("errors on negative impressions", () => {
    const issues = validateNormalizedSnapshot({
      ...base,
      records: [
        {
          metricKey: "meta.impressions",
          value: -2,
          capturedAt: "2026-01-01T00:00:00.000Z",
        },
      ],
    });
    expect(issues.some((i) => i.code === "range.negative_count")).toBe(true);
  });

  it("warns on bad capturedAt", () => {
    const issues = validateNormalizedSnapshot({
      ...base,
      records: [
        {
          metricKey: "meta.x",
          value: 1,
          capturedAt: "not-a-date",
        },
      ],
    });
    expect(issues.some((i) => i.code === "timestamp.unparseable")).toBe(true);
  });
});

describe("validateCrossFieldCtr", () => {
  it("is silent when CTR aligns with clicks/impressions", () => {
    const dims = { campaign_id: "c1" };
    const issues = validateCrossFieldCtr({
      ...base,
      records: [
        {
          metricKey: "meta.impressions",
          value: 100,
          dimensions: dims,
          capturedAt: "2026-01-01T00:00:00.000Z",
        },
        {
          metricKey: "meta.clicks",
          value: 5,
          dimensions: dims,
          capturedAt: "2026-01-01T00:00:00.000Z",
        },
        {
          metricKey: "meta.ctr",
          value: 0.05,
          dimensions: dims,
          capturedAt: "2026-01-01T00:00:00.000Z",
        },
      ],
    });
    expect(issues).toHaveLength(0);
  });

  it("warns when CTR does not match clicks/impressions", () => {
    const dims = { campaign_id: "c1" };
    const issues = validateCrossFieldCtr({
      ...base,
      records: [
        {
          metricKey: "meta.impressions",
          value: 100,
          dimensions: dims,
          capturedAt: "2026-01-01T00:00:00.000Z",
        },
        {
          metricKey: "meta.clicks",
          value: 10,
          dimensions: dims,
          capturedAt: "2026-01-01T00:00:00.000Z",
        },
        {
          metricKey: "meta.ctr",
          value: 0.5,
          dimensions: dims,
          capturedAt: "2026-01-01T00:00:00.000Z",
        },
      ],
    });
    expect(issues.some((i) => i.code === "crossfield.ctr_mismatch")).toBe(true);
  });
});

describe("validateSpendVersusCpcClicks", () => {
  it("is silent when spend matches cpc*clicks", () => {
    const dims = { campaign_id: "c1" };
    const issues = validateSpendVersusCpcClicks([
      { metricKey: "meta.spend", value: 20, dimensions: dims, capturedAt: "t" },
      { metricKey: "meta.cpc", value: 2, dimensions: dims, capturedAt: "t" },
      { metricKey: "meta.clicks", value: 10, dimensions: dims, capturedAt: "t" },
    ]);
    expect(issues).toHaveLength(0);
  });

  it("warns when spend diverges from cpc*clicks", () => {
    const dims = { campaign_id: "c1" };
    const issues = validateSpendVersusCpcClicks([
      {
        metricKey: "meta.spend",
        value: 10,
        dimensions: dims,
        capturedAt: "t",
      },
      {
        metricKey: "meta.cpc",
        value: 1,
        dimensions: dims,
        capturedAt: "t",
      },
      {
        metricKey: "meta.clicks",
        value: 20,
        dimensions: dims,
        capturedAt: "t",
      },
    ]);
    expect(issues.some((i) => i.code === "crossfield.spend_cpc_clicks")).toBe(true);
  });
});
