import type { DateRangeIso } from "../date-range";
import type { NormalizedMetricRecord, NormalizedConnectorSnapshot } from "../normalization";
import type { GbpRawMetricsPayload } from "./models";

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

function isGbpRawPayload(raw: unknown): raw is GbpRawMetricsPayload {
  if (typeof raw !== "object" || raw === null) {
    return false;
  }
  const r = raw as Partial<GbpRawMetricsPayload>;
  return (
    typeof r.fetchedAt === "string" &&
    r.requestedRange !== undefined &&
    typeof r.requestedRange.startInclusive === "string" &&
    typeof r.requestedRange.endInclusive === "string" &&
    Array.isArray(r.accounts) &&
    Array.isArray(r.locations)
  );
}

/**
 * Maps {@link GbpRawMetricsPayload} into unified {@link NormalizedConnectorSnapshot} records.
 */
export function normalizeGbpRawMetrics(
  raw: unknown,
  dateRange: DateRangeIso,
): NormalizedConnectorSnapshot {
  const capturedAt = new Date().toISOString();
  if (!isGbpRawPayload(raw)) {
    return { connector: "gbp", dateRange, records: [] };
  }

  const records: NormalizedMetricRecord[] = [];

  records.push({
    metricKey: "gbp.account.count",
    value: raw.accounts.length,
    capturedAt,
  });

  records.push({
    metricKey: "gbp.location.count",
    value: raw.locations.length,
    capturedAt,
  });

  for (const bundle of raw.locations) {
    const loc = bundle.location;
    const locName = loc.name ?? "";
    const dims: Record<string, string> = {
      location: locName,
      title: loc.title ?? "",
    };

    const rev = bundle.reviews;
    if (rev) {
      records.push({
        metricKey: "gbp.reviews.total_count",
        value: num(rev.totalReviewCount),
        dimensions: dims,
        capturedAt,
      });
      records.push({
        metricKey: "gbp.reviews.average_rating",
        value: num(rev.averageRating),
        dimensions: dims,
        capturedAt,
      });
      const list = rev.reviews ?? [];
      records.push({
        metricKey: "gbp.reviews.page_count",
        value: list.length,
        dimensions: dims,
        capturedAt,
      });
    }

    if (bundle.performanceError) {
      records.push({
        metricKey: "gbp.performance.error",
        value: 1,
        dimensions: { ...dims, message: bundle.performanceError.slice(0, 200) },
        capturedAt,
      });
    }

    const series = bundle.performance?.multiDailyMetricTimeSeries ?? [];
    for (const s of series) {
      const metricKey = s.dailyMetric ?? "unknown";
      const values = s.timeSeries?.datedValues ?? [];
      let sum = 0;
      for (const dv of values) {
        sum += num(dv.value);
      }
      if (values.length > 0 || sum > 0) {
        records.push({
          metricKey: `gbp.performance.${metricKey}`,
          value: sum,
          dimensions: dims,
          capturedAt,
        });
      }
    }
  }

  return { connector: "gbp", dateRange, records };
}
