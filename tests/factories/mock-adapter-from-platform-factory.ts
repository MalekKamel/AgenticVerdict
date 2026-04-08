import type { PlatformType } from "@agenticverdict/types";

import {
  MockPlatformAdapter,
  type NormalizedMetricRecord,
} from "@agenticverdict/platform-adapters";

import {
  PlatformDataFactory,
  type GA4Session,
  type GBPMetric,
  type GSCQuery,
  type MetaCampaign,
  type TikTokAd,
} from "./platform-data-factory";

/**
 * Converts a Date to ISO string format with millisecond precision truncated.
 *
 * **Why truncate milliseconds?**
 *
 * The mock adapters use Faker.js to generate test data, which includes timestamps.
 * While Faker can be seeded for deterministic output, `faker.date.recent()` generates
 * dates relative to `Date.now()`, which can vary by milliseconds between test runs
 * or when other tests have modified Faker's internal state.
 *
 * Truncating milliseconds ensures that:
 * 1. Tests remain deterministic when run in isolation or in the full suite
 * 2. The determinism test (`is deterministic for a fixed seed`) passes consistently
 * 3. Test data is still realistic and functionally equivalent
 *
 * The millisecond precision is not needed for the business logic being tested.
 */
function toIso(d: Date): string {
  // Remove milliseconds: 2026-03-05T17:39:34.427Z -> 2026-03-05T17:39:34Z
  return d.toISOString().replace(/\.\d+Z$/, "Z");
}

export function metaCampaignsToRecords(campaigns: MetaCampaign[]): NormalizedMetricRecord[] {
  const records: NormalizedMetricRecord[] = [];
  for (const c of campaigns) {
    const capturedAt = toIso(c.startDate);
    records.push(
      {
        metricKey: "meta.mock.spend",
        value: c.spend,
        dimensions: { campaign_id: c.id, campaign_name: c.name, currency: "USD" },
        capturedAt,
      },
      {
        metricKey: "meta.mock.impressions",
        value: c.impressions,
        dimensions: { campaign_id: c.id },
        capturedAt,
      },
      {
        metricKey: "meta.mock.clicks",
        value: c.clicks,
        dimensions: { campaign_id: c.id },
        capturedAt,
      },
      {
        metricKey: "meta.mock.conversions",
        value: c.conversions,
        dimensions: { campaign_id: c.id },
        capturedAt,
      },
    );
  }
  return records;
}

export function ga4SessionsToRecords(sessions: GA4Session[]): NormalizedMetricRecord[] {
  return sessions.map((s) => ({
    metricKey: "ga4.mock.sessions",
    value: 1,
    dimensions: {
      session_id: s.sessionId,
      source: s.source,
      medium: s.medium,
      converted: String(s.converted),
    },
    capturedAt: toIso(s.timestamp),
  }));
}

export function gscQueriesToRecords(queries: GSCQuery[]): NormalizedMetricRecord[] {
  return queries.map((q) => ({
    metricKey: "gsc.mock.query.impressions",
    value: q.impressions,
    dimensions: { query: q.query },
    capturedAt: toIso(q.date),
  }));
}

export function gbpMetricsToRecords(metrics: GBPMetric[]): NormalizedMetricRecord[] {
  const records: NormalizedMetricRecord[] = [];
  for (const m of metrics) {
    const capturedAt = toIso(m.date);
    records.push(
      {
        metricKey: "gbp.mock.views",
        value: m.views,
        capturedAt,
      },
      {
        metricKey: "gbp.mock.searches",
        value: m.searches,
        capturedAt,
      },
    );
  }
  return records;
}

export function tiktokAdsToRecords(ads: TikTokAd[]): NormalizedMetricRecord[] {
  const records: NormalizedMetricRecord[] = [];
  for (const a of ads) {
    const capturedAt = toIso(a.startDate);
    records.push(
      {
        metricKey: "tiktok.mock.spend",
        value: a.spend,
        dimensions: { ad_id: a.id, currency: "USD" },
        capturedAt,
      },
      {
        metricKey: "tiktok.mock.impressions",
        value: a.impressions,
        dimensions: { ad_id: a.id },
        capturedAt,
      },
    );
  }
  return records;
}

export interface FakerBackedMockAdapterOptions {
  readonly tenantId: string;
  readonly campaignCount?: number;
  readonly sessionCount?: number;
  readonly queryCount?: number;
  readonly gbpDays?: number;
  readonly tiktokAdCount?: number;
  readonly seed?: number;
}

/**
 * Builds a {@link MockPlatformAdapter} whose normalized rows are derived from {@link PlatformDataFactory} output.
 */
export function createFakerBackedMockAdapter(
  platform: PlatformType,
  options: FakerBackedMockAdapterOptions,
): MockPlatformAdapter {
  const seed = options.seed ?? 10_321;
  const tenantId = options.tenantId;

  switch (platform) {
    case "meta": {
      const count = options.campaignCount ?? 4;
      const campaigns = PlatformDataFactory.generateMetaCampaigns(count, seed);
      const records = metaCampaignsToRecords(campaigns);
      return new MockPlatformAdapter("meta", {
        tenantId,
        rawResponse: { campaigns },
        records,
      });
    }
    case "ga4": {
      const count = options.sessionCount ?? 20;
      const sessions = PlatformDataFactory.generateGA4Sessions(count, seed);
      const records = ga4SessionsToRecords(sessions);
      return new MockPlatformAdapter("ga4", {
        tenantId,
        rawResponse: { sessions },
        records,
      });
    }
    case "gsc": {
      const count = options.queryCount ?? 12;
      const queries = PlatformDataFactory.generateGSCQueries(count, seed);
      const records = gscQueriesToRecords(queries);
      return new MockPlatformAdapter("gsc", {
        tenantId,
        rawResponse: { queries },
        records,
      });
    }
    case "gbp": {
      const days = options.gbpDays ?? 5;
      const metrics = PlatformDataFactory.generateGBPMetrics(days, seed);
      const records = gbpMetricsToRecords(metrics);
      return new MockPlatformAdapter("gbp", {
        tenantId,
        rawResponse: { metrics },
        records,
      });
    }
    case "tiktok": {
      const count = options.tiktokAdCount ?? 3;
      const ads = PlatformDataFactory.generateTikTokAds(count, seed);
      const records = tiktokAdsToRecords(ads);
      return new MockPlatformAdapter("tiktok", {
        tenantId,
        rawResponse: { ads },
        records,
      });
    }
    default: {
      const exhaustive: never = platform;
      throw new Error(`Unsupported platform: ${String(exhaustive)}`);
    }
  }
}
