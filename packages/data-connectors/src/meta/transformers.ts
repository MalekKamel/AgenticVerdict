import type { DateRangeIso } from "../date-range";
import type { NormalizedMetricRecord, NormalizedConnectorSnapshot } from "../normalization";
import type { MetaInsightAction, MetaRawMetricsPayload } from "./models";

function num(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) {
    return v;
  }
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function sumAttributedConversions(actions: readonly MetaInsightAction[] | undefined): number {
  if (!Array.isArray(actions)) {
    return 0;
  }
  let total = 0;
  for (const a of actions) {
    const type = a?.action_type ?? "";
    if (
      /(purchase|lead|complete_registration|submit_application|offsite_conversion|omni_purchase|onsite_conversion)/i.test(
        type,
      )
    ) {
      total += num(a?.value);
    }
  }
  return total;
}

function isMetaRawPayload(raw: unknown): raw is MetaRawMetricsPayload {
  if (typeof raw !== "object" || raw === null) {
    return false;
  }
  const r = raw as Partial<MetaRawMetricsPayload>;
  return (
    typeof r.adAccountId === "string" &&
    typeof r.fetchedAt === "string" &&
    Array.isArray(r.campaigns) &&
    Array.isArray(r.adSets) &&
    Array.isArray(r.ads) &&
    Array.isArray(r.insights)
  );
}

/**
 * Maps {@link MetaRawMetricsPayload} into unified {@link NormalizedConnectorSnapshot} records.
 */
export function normalizeMetaRawMetrics(
  raw: unknown,
  dateRange: DateRangeIso,
): NormalizedConnectorSnapshot {
  if (!isMetaRawPayload(raw)) {
    return { connector: "meta", dateRange, records: [] };
  }

  const capturedAt = raw.fetchedAt;
  const records: NormalizedMetricRecord[] = [];

  for (const c of raw.campaigns) {
    const id = c.id ?? "";
    if (!id) {
      continue;
    }
    const dims: Record<string, string> = {
      entityType: "campaign",
      campaignId: id,
      name: c.name ?? "",
      status: c.status ?? "",
      objective: c.objective ?? "",
    };
    records.push({
      metricKey: "meta.campaign.daily_budget",
      value: num(c.daily_budget),
      dimensions: dims,
      capturedAt,
    });
    records.push({
      metricKey: "meta.campaign.lifetime_budget",
      value: num(c.lifetime_budget),
      dimensions: dims,
      capturedAt,
    });
  }

  for (const a of raw.adSets) {
    const id = a.id ?? "";
    if (!id) {
      continue;
    }
    records.push({
      metricKey: "meta.adset.daily_budget",
      value: num(a.daily_budget),
      dimensions: {
        entityType: "adset",
        adsetId: id,
        campaignId: a.campaign_id ?? "",
        name: a.name ?? "",
        status: a.status ?? "",
      },
      capturedAt,
    });
    records.push({
      metricKey: "meta.adset.lifetime_budget",
      value: num(a.lifetime_budget),
      dimensions: {
        entityType: "adset",
        adsetId: id,
        campaignId: a.campaign_id ?? "",
        name: a.name ?? "",
        status: a.status ?? "",
      },
      capturedAt,
    });
  }

  for (const ad of raw.ads) {
    const id = ad.id ?? "";
    if (!id) {
      continue;
    }
    records.push({
      metricKey: "meta.ad.present",
      value: 1,
      dimensions: {
        entityType: "ad",
        adId: id,
        adsetId: ad.adset_id ?? "",
        campaignId: ad.campaign_id ?? "",
        name: ad.name ?? "",
        status: ad.status ?? "",
      },
      capturedAt,
    });
  }

  for (const row of raw.insights) {
    const dims: Record<string, string> = {
      entityType: "campaign_insights",
      campaignId: row.campaign_id ?? "",
      campaignName: row.campaign_name ?? "",
    };
    if (row.date_start) {
      dims.dateStart = row.date_start;
    }
    if (row.date_stop) {
      dims.dateStop = row.date_stop;
    }

    records.push({
      metricKey: "meta.impressions",
      value: num(row.impressions),
      dimensions: dims,
      capturedAt,
    });
    records.push({
      metricKey: "meta.clicks",
      value: num(row.clicks),
      dimensions: dims,
      capturedAt,
    });
    records.push({
      metricKey: "meta.spend",
      value: num(row.spend),
      dimensions: dims,
      capturedAt,
    });
    records.push({
      metricKey: "meta.ctr",
      value: num(row.ctr),
      dimensions: dims,
      capturedAt,
    });
    records.push({
      metricKey: "meta.cpc",
      value: num(row.cpc),
      dimensions: dims,
      capturedAt,
    });
    records.push({
      metricKey: "meta.reach",
      value: num(row.reach),
      dimensions: dims,
      capturedAt,
    });
    records.push({
      metricKey: "meta.conversions",
      value: sumAttributedConversions(row.actions),
      dimensions: dims,
      capturedAt,
    });
  }

  return { connector: "meta", dateRange, records };
}
