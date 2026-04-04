import { describe, expect, it } from "vitest";

import type { Ga4RawMetricsPayload } from "./ga4/models";
import { normalizeGa4RawMetrics } from "./ga4/transformers";
import type { GbpRawMetricsPayload } from "./gbp/models";
import { normalizeGbpRawMetrics } from "./gbp/transformers";
import type { GscRawMetricsPayload } from "./gsc/models";
import { normalizeGscRawMetrics } from "./gsc/transformers";
import { normalizeMetaRawMetrics } from "./meta/transformers";
import { runNormalizationPipeline } from "./normalization/pipeline";
import { normalizeTikTokRawMetrics } from "./tiktok/transformers";

const range = { startInclusive: "2026-01-01", endInclusive: "2026-01-31" };

describe("normalization pipeline across adapters (integration)", () => {
  it("runs Meta fixture through normalize + pipeline with acceptable quality", () => {
    const raw = {
      adAccountId: "act_1",
      fetchedAt: "2026-01-01T00:00:00.000Z",
      campaigns: [
        {
          id: "c1",
          name: "C",
          status: "ACTIVE",
          objective: "REACH",
          daily_budget: "100",
          lifetime_budget: "0",
        },
      ],
      adSets: [],
      ads: [],
      insights: [
        {
          campaign_id: "c1",
          campaign_name: "C",
          impressions: "1000",
          clicks: "50",
          spend: "25",
          ctr: "0.05",
          cpc: "0.5",
          reach: "800",
        },
      ],
    };
    const snap = normalizeMetaRawMetrics(raw, range);
    const res = runNormalizationPipeline(snap, {
      detectOutliers: false,
      convertSpendToUsd: false,
    });
    expect(snap.records.length).toBeGreaterThan(0);
    expect(res.qualityScore).toBeGreaterThanOrEqual(80);
  });

  it("runs GA4 fixture through normalize + pipeline", () => {
    const raw: Ga4RawMetricsPayload = {
      propertyId: "123",
      fetchedAt: "2026-04-04T00:00:00.000Z",
      requestedRange: range,
      eventReport: {
        dimensionHeaders: [{ name: "date" }],
        metricHeaders: [{ name: "eventCount" }],
        rows: [{ dimensionValues: [{ value: "20260101" }], metricValues: [{ value: "42" }] }],
      },
      trafficReport: { rows: [] },
      realtimeReport: null,
      funnelReport: null,
      sampling: { sampled: false, sources: [] },
      dataApiCalls: 2,
    };
    const snap = normalizeGa4RawMetrics(raw, range);
    const res = runNormalizationPipeline(snap, { detectOutliers: false });
    expect(snap.records.length).toBeGreaterThan(0);
    expect(res.qualityScore).toBeGreaterThanOrEqual(80);
  });

  it("runs GSC fixture through normalize + pipeline", () => {
    const raw: GscRawMetricsPayload = {
      siteUrl: "https://example.com/",
      fetchedAt: "2026-01-01T00:00:00.000Z",
      requestedRange: range,
      searchAnalytics: [
        {
          rows: [
            { keys: ["2026-01-01", "q"], clicks: 3, impressions: 100, ctr: 0.03, position: 4.2 },
          ],
        },
      ],
      sitemaps: null,
      urlInspection: null,
    };
    const snap = normalizeGscRawMetrics(raw, range);
    const res = runNormalizationPipeline(snap, { detectOutliers: false });
    expect(snap.records.length).toBeGreaterThan(0);
    expect(res.qualityScore).toBeGreaterThanOrEqual(80);
  });

  it("runs GBP fixture through normalize + pipeline", () => {
    const raw: GbpRawMetricsPayload = {
      fetchedAt: "2026-01-01T00:00:00.000Z",
      requestedRange: range,
      accounts: [{ name: "accounts/1" }],
      locations: [],
    };
    const snap = normalizeGbpRawMetrics(raw, range);
    const res = runNormalizationPipeline(snap, { detectOutliers: false });
    expect(snap.records.length).toBeGreaterThan(0);
    expect(res.qualityScore).toBeGreaterThanOrEqual(80);
  });

  it("runs TikTok fixture through normalize + pipeline", () => {
    const snap = normalizeTikTokRawMetrics(
      {
        advertiserId: "a1",
        fetchedAt: "2026-01-01T00:00:00.000Z",
        campaigns: [{ campaign_id: "c1", campaign_name: "N", operation_status: "ENABLE" }],
        adGroups: [],
        ads: [],
        integratedRows: [],
      },
      range,
    );
    const res = runNormalizationPipeline(snap, { detectOutliers: false });
    expect(snap.records.length).toBeGreaterThan(0);
    expect(res.qualityScore).toBeGreaterThanOrEqual(80);
  });
});
