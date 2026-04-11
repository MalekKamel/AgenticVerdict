import type { DateRangeIso } from "../date-range";
import type { NormalizedMetricRecord, NormalizedConnectorSnapshot } from "../normalization";
import type { Ga4RawMetricsPayload, Ga4RunReportResponse } from "./models";

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

function headerNames(headers: readonly { name?: string }[] | undefined): string[] {
  if (!Array.isArray(headers)) {
    return [];
  }
  return headers.map((h) => (typeof h.name === "string" ? h.name : ""));
}

function isGa4RawPayload(raw: unknown): raw is Ga4RawMetricsPayload {
  if (typeof raw !== "object" || raw === null) {
    return false;
  }
  const r = raw as Partial<Ga4RawMetricsPayload>;
  return (
    typeof r.propertyId === "string" &&
    typeof r.fetchedAt === "string" &&
    r.requestedRange !== undefined &&
    typeof r.requestedRange.startInclusive === "string" &&
    typeof r.requestedRange.endInclusive === "string" &&
    r.eventReport !== undefined &&
    r.trafficReport !== undefined &&
    typeof r.dataApiCalls === "number" &&
    r.sampling !== undefined &&
    typeof r.sampling.sampled === "boolean"
  );
}

function emitReportRows(
  report: Ga4RunReportResponse,
  prefix: string,
  capturedAt: string,
  records: NormalizedMetricRecord[],
): void {
  const dimNames = headerNames([...(report.dimensionHeaders ?? [])]);
  const metricNames = headerNames([...(report.metricHeaders ?? [])]);
  for (const row of report.rows ?? []) {
    const dims: Record<string, string> = {};
    const dvals = row.dimensionValues ?? [];
    for (let i = 0; i < dimNames.length; i += 1) {
      const key = dimNames[i];
      if (key) {
        dims[key] = dvals[i]?.value ?? "";
      }
    }
    const mvals = row.metricValues ?? [];
    for (let j = 0; j < metricNames.length; j += 1) {
      const mk = metricNames[j];
      if (!mk) {
        continue;
      }
      const rawVal = mvals[j]?.value ?? mvals[j]?.oneValue;
      records.push({
        metricKey: `${prefix}.${mk}`,
        value: num(rawVal),
        dimensions: Object.keys(dims).length > 0 ? dims : undefined,
        capturedAt,
      });
    }
  }
}

/**
 * Maps {@link Ga4RawMetricsPayload} into unified {@link NormalizedConnectorSnapshot} records.
 */
export function normalizeGa4RawMetrics(
  raw: unknown,
  dateRange: DateRangeIso,
): NormalizedConnectorSnapshot {
  if (!isGa4RawPayload(raw)) {
    return { connector: "ga4", dateRange, records: [] };
  }

  const capturedAt = raw.fetchedAt;
  const records: NormalizedMetricRecord[] = [];

  emitReportRows(raw.eventReport, "ga4.event", capturedAt, records);
  emitReportRows(raw.trafficReport, "ga4.traffic", capturedAt, records);

  if (raw.realtimeReport) {
    emitReportRows(raw.realtimeReport, "ga4.realtime", capturedAt, records);
  }

  records.push({
    metricKey: "ga4.meta.sampled",
    value: raw.sampling.sampled ? 1 : 0,
    dimensions: { sources: raw.sampling.sources.join(",") },
    capturedAt,
  });

  records.push({
    metricKey: "ga4.meta.dataApiCalls",
    value: raw.dataApiCalls,
    capturedAt,
  });

  if (raw.funnelError) {
    records.push({
      metricKey: "ga4.funnel.error",
      value: 1,
      dimensions: { message: raw.funnelError.slice(0, 500) },
      capturedAt,
    });
  } else if (raw.funnelReport !== null && raw.funnelReport !== undefined) {
    records.push({
      metricKey: "ga4.funnel.present",
      value: 1,
      capturedAt,
    });
  }

  return { connector: "ga4", dateRange, records };
}
