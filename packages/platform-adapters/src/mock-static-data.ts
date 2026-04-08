import type { PlatformType } from "@agenticverdict/types";

import type { DateRangeIso } from "./date-range";
import type { NormalizedMetricRecord } from "./normalization";

/** Scenario presets aligned with the E2E static injection plan. */
export type MockAdapterScenario = "normal" | "high-volume" | "zero-conversions" | "error";

export interface MockStaticDataOptions {
  readonly platform: PlatformType;
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
  return base;
}

/**
 * Builds normalized metric rows for mock adapters without network or Faker (stable in `platform-adapters`).
 */
export function buildScenarioRecords(options: MockStaticDataOptions): NormalizedMetricRecord[] {
  const { platform, scenario, seed, dateRange } = options;
  if (scenario === "error") {
    return [];
  }

  const rng = mulberry32(seed ^ 0x9e37_79b9);
  const rowCount = scenario === "high-volume" ? 36 : 8;
  const records: NormalizedMetricRecord[] = [];

  for (let i = 0; i < rowCount; i++) {
    const capturedAt = isoDay(dateRange, i % 7);
    const dimSuffix = `row_${i}`;

    const impressions = scaleForScenario(
      scenario,
      nextInt(rng, 1_000, platform === "tiktok" ? 500_000 : 200_000),
    );
    const clicks = Math.min(
      impressions,
      nextInt(rng, 50, Math.max(50, Math.floor(impressions * 0.12))),
    );
    const spend = Number((nextInt(rng, 50, 8000) + rng()).toFixed(2));
    const conversions =
      scenario === "zero-conversions" ? 0 : nextInt(rng, 0, Math.max(1, Math.floor(clicks * 0.08)));

    records.push(
      {
        metricKey: `${platform}.mock.impressions`,
        value: impressions,
        dimensions: { series: dimSuffix },
        capturedAt,
      },
      {
        metricKey: `${platform}.mock.clicks`,
        value: clicks,
        dimensions: { series: dimSuffix },
        capturedAt,
      },
      {
        metricKey: `${platform}.mock.spend`,
        value: spend,
        dimensions: { series: dimSuffix, currency: "USD" },
        capturedAt,
      },
      {
        metricKey: `${platform}.mock.conversions`,
        value: conversions,
        dimensions: { series: dimSuffix },
        capturedAt,
      },
    );
  }

  return records;
}
