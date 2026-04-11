import type { DateRangeIso } from "../date-range";
import type { NormalizedMetricRecord, NormalizedConnectorSnapshot } from "../normalization";
import type { GscRawMetricsPayload, GscSearchAnalyticsRow } from "./models";

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

function isGscRawPayload(raw: unknown): raw is GscRawMetricsPayload {
  if (typeof raw !== "object" || raw === null) {
    return false;
  }
  const r = raw as Partial<GscRawMetricsPayload>;
  return (
    typeof r.siteUrl === "string" &&
    typeof r.fetchedAt === "string" &&
    r.requestedRange !== undefined &&
    typeof r.requestedRange.startInclusive === "string" &&
    typeof r.requestedRange.endInclusive === "string" &&
    Array.isArray(r.searchAnalytics)
  );
}

function rowDims(row: GscSearchAnalyticsRow, dimNames: readonly string[]): Record<string, string> {
  const keys = row.keys ?? [];
  const out: Record<string, string> = {};
  for (let i = 0; i < dimNames.length; i += 1) {
    const k = dimNames[i];
    if (k) {
      out[k] = keys[i] ?? "";
    }
  }
  return out;
}

/**
 * Maps {@link GscRawMetricsPayload} into unified {@link NormalizedConnectorSnapshot} records.
 */
export function normalizeGscRawMetrics(
  raw: unknown,
  dateRange: DateRangeIso,
): NormalizedConnectorSnapshot {
  const capturedAt = new Date().toISOString();
  if (!isGscRawPayload(raw)) {
    return { connector: "gsc", dateRange, records: [] };
  }

  const records: NormalizedMetricRecord[] = [];
  const dimOrder = ["query", "page", "device", "country"] as const;

  for (const page of raw.searchAnalytics) {
    for (const row of page.rows ?? []) {
      const dims = rowDims(row, dimOrder);
      const hasDims = Object.keys(dims).some((k) => dims[k] !== "");
      const baseDims = hasDims ? dims : undefined;
      if (num(row.clicks) > 0) {
        records.push({
          metricKey: "gsc.search.clicks",
          value: num(row.clicks),
          dimensions: baseDims,
          capturedAt,
        });
      }
      if (num(row.impressions) > 0) {
        records.push({
          metricKey: "gsc.search.impressions",
          value: num(row.impressions),
          dimensions: baseDims,
          capturedAt,
        });
      }
      records.push({
        metricKey: "gsc.search.ctr",
        value: num(row.ctr),
        dimensions: baseDims,
        capturedAt,
      });
      records.push({
        metricKey: "gsc.search.position",
        value: num(row.position),
        dimensions: baseDims,
        capturedAt,
      });
    }
  }

  const sm = raw.sitemaps?.sitemap;
  if (Array.isArray(sm)) {
    records.push({
      metricKey: "gsc.sitemap.count",
      value: sm.length,
      capturedAt,
    });
    const pending = sm.filter((s) => s.isPending === true).length;
    records.push({
      metricKey: "gsc.sitemap.pending_count",
      value: pending,
      capturedAt,
    });
  }

  const ir = raw.urlInspection?.inspectionResult;
  if (ir) {
    const idx = ir.indexStatusResult;
    if (idx?.verdict) {
      records.push({
        metricKey: "gsc.inspection.index_verdict",
        value: 1,
        dimensions: { verdict: idx.verdict, coverageState: idx.coverageState ?? "" },
        capturedAt,
      });
    }
    if (idx?.coverageState) {
      records.push({
        metricKey: "gsc.coverage.state",
        value: 1,
        dimensions: { coverageState: idx.coverageState },
        capturedAt,
      });
    }
    const mob = ir.mobileUsabilityResult;
    if (mob) {
      const issueCount = mob.issues?.length ?? 0;
      records.push({
        metricKey: "gsc.mobile_usability.issue_count",
        value: issueCount,
        dimensions: mob.verdict ? { verdict: mob.verdict } : undefined,
        capturedAt,
      });
    }
    if (ir.richResultsResult?.verdict) {
      records.push({
        metricKey: "gsc.rich_results.verdict",
        value: 1,
        dimensions: { verdict: ir.richResultsResult.verdict },
        capturedAt,
      });
    }
  }

  return { connector: "gsc", dateRange, records };
}
