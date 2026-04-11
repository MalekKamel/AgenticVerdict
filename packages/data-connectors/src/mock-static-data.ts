import type { ConnectorType } from "@agenticverdict/types";

import type { DateRangeIso } from "./date-range";
import type { NormalizedMetricRecord } from "./normalization";

/** Scenario presets aligned with the E2E static injection plan. */
export type MockAdapterScenario =
  | "normal"
  | "realistic"
  | "high-volume"
  | "zero-conversions"
  | "error";

export interface MockStaticDataOptions {
  readonly connector: ConnectorType;
  readonly scenario: MockAdapterScenario;
  readonly seed: number;
  readonly dateRange?: DateRangeIso;
}

/** Deterministic PRNG in [0, 1). */
export function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function isoDay(dateRange: DateRangeIso | undefined, dayOffset: number): string {
  const start = dateRange?.startInclusive ?? "2026-01-01";
  const base = new Date(`${start}T00:00:00.000Z`);
  base.setUTCDate(base.getUTCDate() + dayOffset);
  return base.toISOString();
}

function nextInt(rng: () => number, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

function scaleForScenario(scenario: MockAdapterScenario, base: number): number {
  if (scenario === "high-volume") {
    return Math.round(base * 3.5);
  }
  if (scenario === "realistic") {
    return Math.round(base * 1.35);
  }
  return base;
}

function baseCurrencyByConnector(connector: ConnectorType): "SAR" | "USD" {
  if (connector === "meta" || connector === "tiktok") {
    return "SAR";
  }
  return "USD";
}

/**
 * Builds normalized metric rows for mock adapters without network or Faker (stable in `data-connectors`).
 */
export function buildScenarioRecords(options: MockStaticDataOptions): NormalizedMetricRecord[] {
  const { connector, scenario, seed, dateRange } = options;
  if (scenario === "error") {
    return [];
  }

  const rng = mulberry32(seed ^ 0x9e37_79b9);
  const rowCount = scenario === "high-volume" ? 36 : scenario === "realistic" ? 14 : 8;
  const records: NormalizedMetricRecord[] = [];
  const currency = baseCurrencyByConnector(connector);

  for (let i = 0; i < rowCount; i++) {
    const capturedAt = isoDay(dateRange, i % 7);
    const dimSuffix = `row_${i}`;

    const impressions = scaleForScenario(
      scenario,
      nextInt(rng, 1_000, connector === "tiktok" ? 500_000 : 200_000),
    );
    const clicks = Math.min(
      impressions,
      nextInt(rng, 50, Math.max(50, Math.floor(impressions * 0.12))),
    );
    const spend = Number((nextInt(rng, 50, 8000) + rng()).toFixed(2));
    const conversions =
      scenario === "zero-conversions" ? 0 : nextInt(rng, 0, Math.max(1, Math.floor(clicks * 0.08)));
    const qualifiedConversions =
      scenario === "zero-conversions" ? 0 : Math.floor(conversions * (0.7 + rng() * 0.25));
    const dmLeads =
      scenario === "zero-conversions" ? 0 : Math.floor(conversions * (0.45 + rng() * 0.2));
    const fleetLeads =
      scenario === "zero-conversions" ? 0 : Math.floor(conversions * (0.4 + rng() * 0.2));
    const regionalLeads =
      scenario === "zero-conversions" ? 0 : Math.floor(conversions * (0.3 + rng() * 0.15));
    const sessions = scaleForScenario(scenario, nextInt(rng, 200, 8000));
    const sessionLang = rng() < 0.55 ? "ar" : "en";
    const ctr = impressions > 0 ? Number((clicks / impressions).toFixed(4)) : 0;
    const cpc = clicks > 0 ? Number((spend / clicks).toFixed(2)) : 0;
    const cpa = conversions > 0 ? Number((spend / conversions).toFixed(2)) : 0;
    const engagementRate = Number((0.01 + rng() * 0.15).toFixed(4));
    const bounceRate = Number((0.25 + rng() * 0.5).toFixed(4));
    const avgSessionDurationSec = nextInt(rng, 20, 240);
    const rankPosition = Number((1 + rng() * 25).toFixed(2));

    if (scenario === "realistic") {
      switch (connector) {
        case "meta":
          records.push(
            {
              metricKey: "meta.impressions",
              value: impressions,
              dimensions: { campaign: dimSuffix },
              capturedAt,
            },
            {
              metricKey: "meta.clicks",
              value: clicks,
              dimensions: { campaign: dimSuffix },
              capturedAt,
            },
            {
              metricKey: "meta.spend",
              value: spend,
              dimensions: { campaign: dimSuffix, currency },
              capturedAt,
            },
            {
              metricKey: "meta.conversions",
              value: conversions,
              dimensions: { campaign: dimSuffix },
              capturedAt,
            },
            { metricKey: "meta.ctr", value: ctr, dimensions: { campaign: dimSuffix }, capturedAt },
            {
              metricKey: "meta.cpc",
              value: cpc,
              dimensions: { campaign: dimSuffix, currency },
              capturedAt,
            },
            {
              metricKey: "meta.cpa",
              value: cpa,
              dimensions: { campaign: dimSuffix, currency },
              capturedAt,
            },
          );
          break;
        case "ga4":
          records.push(
            {
              metricKey: "ga4.event.sessions",
              value: sessions,
              dimensions: { channelGroup: "organic", language: sessionLang },
              capturedAt,
            },
            {
              metricKey: "ga4.event.users",
              value: Math.max(1, Math.floor(sessions * (0.7 + rng() * 0.15))),
              dimensions: { channelGroup: "organic" },
              capturedAt,
            },
            {
              metricKey: "ga4.event.engagementRate",
              value: engagementRate,
              dimensions: { channelGroup: "organic" },
              capturedAt,
            },
            {
              metricKey: "ga4.traffic.bounceRate",
              value: bounceRate,
              dimensions: { sourceMedium: "google/organic" },
              capturedAt,
            },
            {
              metricKey: "ga4.traffic.avgSessionDurationSec",
              value: avgSessionDurationSec,
              dimensions: { sourceMedium: "google/organic" },
              capturedAt,
            },
            {
              metricKey: "ga4.conversion.leads",
              value: qualifiedConversions,
              dimensions: { eventName: "generate_lead" },
              capturedAt,
            },
          );
          break;
        case "gsc":
          records.push(
            {
              metricKey: "gsc.search.clicks",
              value: clicks,
              dimensions: { queryCategory: "fleet_tracking" },
              capturedAt,
            },
            {
              metricKey: "gsc.search.impressions",
              value: impressions,
              dimensions: { queryCategory: "fleet_tracking" },
              capturedAt,
            },
            {
              metricKey: "gsc.search.ctr",
              value: ctr,
              dimensions: { queryCategory: "fleet_tracking" },
              capturedAt,
            },
            {
              metricKey: "gsc.search.position",
              value: rankPosition,
              dimensions: { queryCategory: "fleet_tracking" },
              capturedAt,
            },
          );
          break;
        case "gbp":
          records.push(
            {
              metricKey: "gbp.performance.searchViews",
              value: impressions,
              dimensions: { location: "riyadh_hq" },
              capturedAt,
            },
            {
              metricKey: "gbp.performance.websiteClicks",
              value: clicks,
              dimensions: { location: "riyadh_hq" },
              capturedAt,
            },
            {
              metricKey: "gbp.performance.callClicks",
              value: Math.max(0, Math.floor(clicks * (0.2 + rng() * 0.2))),
              dimensions: { location: "riyadh_hq" },
              capturedAt,
            },
            {
              metricKey: "gbp.performance.directionRequests",
              value: Math.max(0, Math.floor(clicks * (0.1 + rng() * 0.1))),
              dimensions: { location: "riyadh_hq" },
              capturedAt,
            },
          );
          break;
        case "tiktok":
          records.push(
            {
              metricKey: "tiktok.impressions",
              value: impressions,
              dimensions: { campaign: dimSuffix },
              capturedAt,
            },
            {
              metricKey: "tiktok.clicks",
              value: clicks,
              dimensions: { campaign: dimSuffix },
              capturedAt,
            },
            {
              metricKey: "tiktok.spend",
              value: spend,
              dimensions: { campaign: dimSuffix, currency },
              capturedAt,
            },
            {
              metricKey: "tiktok.videoPlayActions",
              value: Math.max(clicks, Math.floor(impressions * (0.12 + rng() * 0.18))),
              dimensions: { campaign: dimSuffix },
              capturedAt,
            },
            {
              metricKey: "tiktok.conversions",
              value: conversions,
              dimensions: { campaign: dimSuffix },
              capturedAt,
            },
            {
              metricKey: "tiktok.cpa",
              value: cpa,
              dimensions: { campaign: dimSuffix, currency },
              capturedAt,
            },
          );
          break;
      }
      continue;
    }

    records.push(
      {
        metricKey: `${connector}.mock.impressions`,
        value: impressions,
        dimensions: { series: dimSuffix },
        capturedAt,
      },
      {
        metricKey: `${connector}.mock.clicks`,
        value: clicks,
        dimensions: { series: dimSuffix },
        capturedAt,
      },
      {
        metricKey: `${connector}.mock.spend`,
        value: spend,
        dimensions: { series: dimSuffix, currency },
        capturedAt,
      },
      {
        metricKey: `${connector}.mock.conversions`,
        value: conversions,
        dimensions: { series: dimSuffix },
        capturedAt,
      },
      {
        metricKey: `${connector}.mock.qualified_conversions`,
        value: qualifiedConversions,
        dimensions: { series: dimSuffix },
        capturedAt,
      },
      {
        metricKey: `${connector}.mock.leads_dm`,
        value: dmLeads,
        dimensions: { series: dimSuffix },
        capturedAt,
      },
      {
        metricKey: `${connector}.mock.leads_fleet`,
        value: fleetLeads,
        dimensions: { series: dimSuffix },
        capturedAt,
      },
      {
        metricKey: `${connector}.mock.leads_regional`,
        value: regionalLeads,
        dimensions: { series: dimSuffix, region: "SA" },
        capturedAt,
      },
      {
        metricKey: `${connector}.mock.sessions`,
        value: sessions,
        dimensions: { series: dimSuffix, language: sessionLang },
        capturedAt,
      },
    );
  }

  return records;
}
