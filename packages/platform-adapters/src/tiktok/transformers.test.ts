import { describe, expect, it } from "vitest";

import { normalizeTikTokRawMetrics } from "./transformers";

describe("normalizeTikTokRawMetrics", () => {
  it("returns empty records for invalid payload", () => {
    const snap = normalizeTikTokRawMetrics(
      {},
      {
        startInclusive: "2026-01-01",
        endInclusive: "2026-01-07",
      },
    );
    expect(snap.platform).toBe("tiktok");
    expect(snap.records).toEqual([]);
  });

  it("normalizes campaigns, ads, and integrated rows", () => {
    const snap = normalizeTikTokRawMetrics(
      {
        advertiserId: "a1",
        fetchedAt: "2026-01-01T00:00:00.000Z",
        campaigns: [
          {
            campaign_id: "c1",
            campaign_name: "C",
            operation_status: "ENABLE",
            objective_type: "TRAFFIC",
            budget: 100,
          },
        ],
        adGroups: [
          {
            adgroup_id: "g1",
            adgroup_name: "G",
            campaign_id: "c1",
            budget: 50,
          },
        ],
        ads: [
          {
            ad_id: "ad1",
            ad_name: "Ad",
            adgroup_id: "g1",
            campaign_id: "c1",
          },
        ],
        integratedRows: [
          {
            metrics: { impressions: "100", clicks: "5", spend: "2" },
            dimensions: { campaign_id: "c1", stat_time_day: "2026-01-01" },
          },
        ],
      },
      { startInclusive: "2026-01-01", endInclusive: "2026-01-07" },
    );

    expect(snap.records.some((r) => r.metricKey === "tiktok.campaign.budget")).toBe(true);
    expect(snap.records.some((r) => r.metricKey === "tiktok.impressions")).toBe(true);
    expect(snap.records.filter((r) => r.metricKey === "tiktok.spend").length).toBeGreaterThan(0);
  });

  it("skips ad groups and ads with empty ids", () => {
    const snap = normalizeTikTokRawMetrics(
      {
        advertiserId: "a1",
        fetchedAt: "2026-01-01T00:00:00.000Z",
        campaigns: [],
        adGroups: [{ adgroup_id: "", budget: 1 }],
        ads: [{ ad_id: "" }],
        integratedRows: [],
      },
      { startInclusive: "2026-01-01", endInclusive: "2026-01-01" },
    );
    expect(snap.records.filter((r) => r.metricKey.startsWith("tiktok.adgroup"))).toHaveLength(0);
    expect(snap.records.filter((r) => r.metricKey.startsWith("tiktok.ad"))).toHaveLength(0);
  });

  it("uses m_campaign_id fallback and pickMetric flat m_* when metrics omit a field", () => {
    const snap = normalizeTikTokRawMetrics(
      {
        advertiserId: "a1",
        fetchedAt: "2026-01-01T00:00:00.000Z",
        campaigns: [],
        adGroups: [],
        ads: [],
        integratedRows: [
          {
            metrics: { spend: "1" },
            dimensions: { m_campaign_id: "cx", stat_time_day: "2026-01-02" },
          },
          {
            metrics: { impressions: "0" },
            dimensions: { campaign_id: "c2", stat_time_day: "2026-01-03" },
          },
        ],
      },
      { startInclusive: "2026-01-01", endInclusive: "2026-01-07" },
    );

    const spendRow = snap.records.find(
      (r) => r.metricKey === "tiktok.spend" && r.dimensions?.campaignId === "cx",
    );
    expect(spendRow?.value).toBe(1);

    const impRow = snap.records.find(
      (r) => r.metricKey === "tiktok.impressions" && r.dimensions?.campaignId === "c2",
    );
    expect(impRow?.value).toBe(0);
  });
});
