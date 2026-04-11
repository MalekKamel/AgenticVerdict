import { describe, expect, it } from "vitest";

import { normalizeMetaRawMetrics } from "./transformers";

const range = { startInclusive: "2026-01-01", endInclusive: "2026-01-31" };

describe("normalizeMetaRawMetrics", () => {
  it("returns empty snapshot for non-object raw", () => {
    const snap = normalizeMetaRawMetrics(null, range);
    expect(snap.records).toEqual([]);
  });

  it("returns empty snapshot when shape is incomplete", () => {
    const snap = normalizeMetaRawMetrics({ adAccountId: "act_1" }, range);
    expect(snap.records).toEqual([]);
  });

  it("normalizes campaigns, ad sets, and ads", () => {
    const snap = normalizeMetaRawMetrics(
      {
        adAccountId: "act_1",
        fetchedAt: "2026-01-01T00:00:00.000Z",
        campaigns: [
          {
            id: "c1",
            name: "C",
            status: "ACTIVE",
            objective: "REACH",
            daily_budget: "1000",
            lifetime_budget: "0",
          },
        ],
        adSets: [
          {
            id: "s1",
            name: "S",
            status: "ACTIVE",
            campaign_id: "c1",
            daily_budget: "500",
            lifetime_budget: "2000",
          },
        ],
        ads: [
          {
            id: "a1",
            name: "Ad",
            status: "PAUSED",
            adset_id: "s1",
            campaign_id: "c1",
          },
        ],
        insights: [],
      },
      range,
    );

    expect(
      snap.records.some((r) => r.metricKey === "meta.campaign.daily_budget" && r.value === 1000),
    ).toBe(true);
    expect(
      snap.records.some((r) => r.metricKey === "meta.adset.lifetime_budget" && r.value === 2000),
    ).toBe(true);
    expect(snap.records.some((r) => r.metricKey === "meta.ad.present")).toBe(true);
  });

  it("treats non-numeric insight fields as zero", () => {
    const snap = normalizeMetaRawMetrics(
      {
        adAccountId: "act_1",
        fetchedAt: "2026-01-01T00:00:00.000Z",
        campaigns: [],
        adSets: [],
        ads: [],
        insights: [
          {
            campaign_id: "c1",
            campaign_name: "C",
            impressions: Number.NaN,
            clicks: "not-a-number",
            spend: "x",
            ctr: "y",
            cpc: "z",
            reach: "",
          },
        ],
      },
      range,
    );
    const imp = snap.records.find((r) => r.metricKey === "meta.impressions");
    expect(imp?.value).toBe(0);
  });

  it("adds date dimensions on insights when present", () => {
    const snap = normalizeMetaRawMetrics(
      {
        adAccountId: "act_1",
        fetchedAt: "2026-01-01T00:00:00.000Z",
        campaigns: [],
        adSets: [],
        ads: [],
        insights: [
          {
            campaign_id: "c1",
            campaign_name: "C",
            impressions: 10,
            clicks: 1,
            spend: "2",
            ctr: "10",
            cpc: "2",
            reach: "9",
            date_start: "2026-01-01",
            date_stop: "2026-01-07",
          },
        ],
      },
      range,
    );
    const imp = snap.records.find((r) => r.metricKey === "meta.impressions");
    expect(imp?.dimensions?.dateStart).toBe("2026-01-01");
    expect(imp?.dimensions?.dateStop).toBe("2026-01-07");
    expect(imp?.value).toBe(10);
  });

  it("skips entities with empty id", () => {
    const snap = normalizeMetaRawMetrics(
      {
        adAccountId: "act_1",
        fetchedAt: "2026-01-01T00:00:00.000Z",
        campaigns: [{ name: "x" }],
        adSets: [{}],
        ads: [{}],
        insights: [],
      },
      range,
    );
    expect(snap.records.filter((r) => r.metricKey.startsWith("meta.campaign"))).toHaveLength(0);
    expect(snap.records.filter((r) => r.metricKey.startsWith("meta.adset"))).toHaveLength(0);
    expect(snap.records.filter((r) => r.metricKey.startsWith("meta.ad"))).toHaveLength(0);
  });
});
