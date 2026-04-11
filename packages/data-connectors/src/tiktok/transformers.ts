import type { DateRangeIso } from "../date-range";
import type { NormalizedMetricRecord, NormalizedConnectorSnapshot } from "../normalization";
import type { TikTokRawMetricsPayload } from "./models";

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

function flatMetricDimensions(row: {
  readonly metrics?: Record<string, string | number | undefined>;
  readonly dimensions?: Record<string, string | undefined>;
}): Record<string, string> {
  const out: Record<string, string> = {};
  const m = row.metrics ?? {};
  const d = row.dimensions ?? {};
  for (const [k, v] of Object.entries(m)) {
    out[`m_${k}`] = v === undefined || v === null ? "" : String(v);
  }
  for (const [k, v] of Object.entries(d)) {
    out[k] = v ?? "";
  }
  return out;
}

function isTikTokRawPayload(raw: unknown): raw is TikTokRawMetricsPayload {
  if (typeof raw !== "object" || raw === null) {
    return false;
  }
  const r = raw as Partial<TikTokRawMetricsPayload>;
  return (
    typeof r.advertiserId === "string" &&
    typeof r.fetchedAt === "string" &&
    Array.isArray(r.campaigns) &&
    Array.isArray(r.adGroups) &&
    Array.isArray(r.ads) &&
    Array.isArray(r.integratedRows)
  );
}

/**
 * Maps {@link TikTokRawMetricsPayload} into unified {@link NormalizedConnectorSnapshot} records.
 */
export function normalizeTikTokRawMetrics(
  raw: unknown,
  dateRange: DateRangeIso,
): NormalizedConnectorSnapshot {
  if (!isTikTokRawPayload(raw)) {
    return { connector: "tiktok", dateRange, records: [] };
  }

  const capturedAt = raw.fetchedAt;
  const records: NormalizedMetricRecord[] = [];

  for (const c of raw.campaigns) {
    const id = c.campaign_id ?? "";
    if (!id) {
      continue;
    }
    const dims: Record<string, string> = {
      entityType: "campaign",
      campaignId: id,
      name: c.campaign_name ?? "",
      status: c.operation_status ?? "",
      objective: c.objective_type ?? "",
    };
    records.push({
      metricKey: "tiktok.campaign.budget",
      value: num(c.budget),
      dimensions: dims,
      capturedAt,
    });
  }

  for (const g of raw.adGroups) {
    const id = g.adgroup_id ?? "";
    if (!id) {
      continue;
    }
    records.push({
      metricKey: "tiktok.adgroup.budget",
      value: num(g.budget),
      dimensions: {
        entityType: "adgroup",
        adgroupId: id,
        campaignId: g.campaign_id ?? "",
        name: g.adgroup_name ?? "",
        status: g.operation_status ?? "",
      },
      capturedAt,
    });
  }

  for (const a of raw.ads) {
    const id = a.ad_id ?? "";
    if (!id) {
      continue;
    }
    records.push({
      metricKey: "tiktok.ad.present",
      value: 1,
      dimensions: {
        entityType: "ad",
        adId: id,
        adgroupId: a.adgroup_id ?? "",
        campaignId: a.campaign_id ?? "",
        name: a.ad_name ?? "",
        status: a.operation_status ?? "",
      },
      capturedAt,
    });
  }

  for (const row of raw.integratedRows) {
    const flat = flatMetricDimensions(row);
    const campaignId = flat.campaign_id ?? flat.m_campaign_id ?? "";
    const statDay = flat.stat_time_day ?? "";

    const dims: Record<string, string> = {
      entityType: "campaign_insights",
      campaignId,
      statTimeDay: statDay,
    };

    const pickMetric = (key: string): number => {
      const direct = row.metrics?.[key];
      if (direct !== undefined) {
        return num(direct);
      }
      return num(flat[`m_${key}`]);
    };

    records.push({
      metricKey: "tiktok.impressions",
      value: pickMetric("impressions"),
      dimensions: dims,
      capturedAt,
    });
    records.push({
      metricKey: "tiktok.clicks",
      value: pickMetric("clicks"),
      dimensions: dims,
      capturedAt,
    });
    records.push({
      metricKey: "tiktok.spend",
      value: pickMetric("spend"),
      dimensions: dims,
      capturedAt,
    });
    records.push({
      metricKey: "tiktok.cpc",
      value: pickMetric("cpc"),
      dimensions: dims,
      capturedAt,
    });
    records.push({
      metricKey: "tiktok.cpm",
      value: pickMetric("cpm"),
      dimensions: dims,
      capturedAt,
    });
    records.push({
      metricKey: "tiktok.ctr",
      value: pickMetric("ctr"),
      dimensions: dims,
      capturedAt,
    });
    records.push({
      metricKey: "tiktok.reach",
      value: pickMetric("reach"),
      dimensions: dims,
      capturedAt,
    });
    records.push({
      metricKey: "tiktok.conversion",
      value: pickMetric("conversion"),
      dimensions: dims,
      capturedAt,
    });
  }

  return { connector: "tiktok", dateRange, records };
}
