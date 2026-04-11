import { dbScoped, marketingMetrics, type Database } from "@agenticverdict/database";
import type { ConnectorType } from "@agenticverdict/types";
import { and, asc, eq, gte, lte } from "drizzle-orm";

export interface MarketingMetricsRow {
  readonly platform: string;
  readonly metricDate: string;
  readonly payload: Record<string, unknown>;
}

export interface MarketingMetricsStore {
  queryHistorical(params: {
    startDate: string;
    endDate: string;
    platform?: ConnectorType;
    limit?: number;
  }): Promise<readonly MarketingMetricsRow[]>;
}

function extractNumericFromPayload(payload: Record<string, unknown>): number | null {
  const candidates = [payload.value, payload.amount, payload.total, payload.spend, payload.count];
  for (const c of candidates) {
    if (typeof c === "number" && Number.isFinite(c)) {
      return c;
    }
  }
  return null;
}

function aggregateDaily(
  rows: readonly MarketingMetricsRow[],
  mode: "row_volume" | "payload_sum",
): Map<string, number> {
  const map = new Map<string, number>();
  for (const row of rows) {
    const prev = map.get(row.metricDate) ?? 0;
    if (mode === "row_volume") {
      map.set(row.metricDate, prev + 1);
    } else {
      const n = extractNumericFromPayload(row.payload);
      map.set(row.metricDate, prev + (n ?? 0));
    }
  }
  return map;
}

function seriesFromDailyMap(daily: Map<string, number>): { date: string; value: number }[] {
  return [...daily.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([date, value]) => ({ date, value }));
}

function leastSquaresSlope(points: { x: number; y: number }[]): number {
  if (points.length < 2) {
    return 0;
  }
  const n = points.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;
  for (const p of points) {
    sumX += p.x;
    sumY += p.y;
    sumXY += p.x * p.y;
    sumXX += p.x * p.x;
  }
  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) {
    return 0;
  }
  return (n * sumXY - sumX * sumY) / denom;
}

function roundTo(value: number, decimals: number): number {
  const f = 10 ** decimals;
  return Math.round(value * f) / f;
}

export function createDrizzleMarketingMetricsStore(db: Database): MarketingMetricsStore {
  return {
    async queryHistorical({ startDate, endDate, platform, limit }) {
      return dbScoped(db, async (tx) => {
        const conditions = [
          gte(marketingMetrics.metricDate, startDate),
          lte(marketingMetrics.metricDate, endDate),
        ];
        if (platform !== undefined) {
          conditions.push(eq(marketingMetrics.platform, platform));
        }
        const base = tx
          .select({
            platform: marketingMetrics.platform,
            metricDate: marketingMetrics.metricDate,
            payload: marketingMetrics.payload,
          })
          .from(marketingMetrics)
          .where(and(...conditions))
          .orderBy(asc(marketingMetrics.metricDate), asc(marketingMetrics.id));
        const rows = limit !== undefined ? await base.limit(limit) : await base;
        return rows.map((r) => ({
          platform: r.platform,
          metricDate: r.metricDate,
          payload: r.payload,
        }));
      });
    },
  };
}

export interface TrendAnalysisResult {
  readonly mode: "row_volume" | "payload_sum";
  readonly series: readonly { date: string; value: number }[];
  readonly slopePerDay: number;
  readonly pctChangeFirstLast: number | null;
  readonly mean: number;
}

export async function analyzeTrendsFromStore(
  store: MarketingMetricsStore,
  params: {
    startDate: string;
    endDate: string;
    platform?: ConnectorType;
    mode: "row_volume" | "payload_sum";
  },
): Promise<TrendAnalysisResult> {
  const rows = await store.queryHistorical({
    startDate: params.startDate,
    endDate: params.endDate,
    platform: params.platform,
  });
  const daily = aggregateDaily(rows, params.mode);
  const series = seriesFromDailyMap(daily);
  const values = series.map((s) => s.value);
  const mean = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  const points = series.map((s, i) => ({ x: i, y: s.value }));
  const slopePerDay = leastSquaresSlope(points);
  const pctChangeFirstLast =
    series.length >= 2 && series[0].value !== 0
      ? ((series[series.length - 1].value - series[0].value) / series[0].value) * 100
      : null;
  return {
    mode: params.mode,
    series,
    slopePerDay: roundTo(slopePerDay, 6),
    pctChangeFirstLast: pctChangeFirstLast === null ? null : roundTo(pctChangeFirstLast, 4),
    mean: roundTo(mean, 6),
  };
}

export interface PeriodCompareResult {
  readonly mode: "row_volume" | "payload_sum";
  readonly periodA: { startDate: string; endDate: string; total: number; rowCount: number };
  readonly periodB: { startDate: string; endDate: string; total: number; rowCount: number };
  readonly deltaAbs: number;
  readonly deltaPct: number | null;
}

export async function comparePeriodsFromStore(
  store: MarketingMetricsStore,
  params: {
    periodA: { startDate: string; endDate: string };
    periodB: { startDate: string; endDate: string };
    platform?: ConnectorType;
    mode: "row_volume" | "payload_sum";
  },
): Promise<PeriodCompareResult> {
  const [rowsA, rowsB] = await Promise.all([
    store.queryHistorical({ ...params.periodA, platform: params.platform }),
    store.queryHistorical({ ...params.periodB, platform: params.platform }),
  ]);
  const totalA = [...aggregateDaily(rowsA, params.mode).values()].reduce((a, b) => a + b, 0);
  const totalB = [...aggregateDaily(rowsB, params.mode).values()].reduce((a, b) => a + b, 0);
  const deltaAbs = roundTo(totalB - totalA, 6);
  const deltaPct = totalA !== 0 ? roundTo((deltaAbs / totalA) * 100, 4) : null;
  return {
    mode: params.mode,
    periodA: { ...params.periodA, total: roundTo(totalA, 6), rowCount: rowsA.length },
    periodB: { ...params.periodB, total: roundTo(totalB, 6), rowCount: rowsB.length },
    deltaAbs,
    deltaPct,
  };
}
