import type { NormalizedMetricRecord } from "../normalization/types";

import type { OutlierFlag } from "@agenticverdict/types";

export interface OutlierDetectionOptions {
  readonly iqrMultiplier?: number;
  readonly minValuesPerMetricKey?: number;
}

function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) {
    return Number.NaN;
  }
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sorted[base + 1] === undefined) {
    return sorted[base]!;
  }
  return sorted[base]! + rest * (sorted[base + 1]! - sorted[base]!);
}

/**
 * Per metric key, flags values outside [Q1 - k*IQR, Q3 + k*IQR] when the key has enough samples.
 */
export function detectMetricValueOutliers(
  records: readonly NormalizedMetricRecord[],
  options: OutlierDetectionOptions = {},
): OutlierFlag[] {
  const k = options.iqrMultiplier ?? 1.5;
  const minN = options.minValuesPerMetricKey ?? 4;

  const byKey = new Map<string, { index: number; value: number }[]>();
  records.forEach((r, index) => {
    const list = byKey.get(r.metricKey) ?? [];
    list.push({ index, value: r.value });
    byKey.set(r.metricKey, list);
  });

  const flags: OutlierFlag[] = [];

  for (const [metricKey, entries] of byKey) {
    if (entries.length < minN) {
      continue;
    }
    const values = entries.map((e) => e.value).filter((v) => Number.isFinite(v));
    if (values.length < minN) {
      continue;
    }
    const sorted = [...values].sort((a, b) => a - b);
    const q1 = quantile(sorted, 0.25);
    const q3 = quantile(sorted, 0.75);
    const iqr = q3 - q1;
    if (!Number.isFinite(iqr) || iqr === 0) {
      continue;
    }
    const low = q1 - k * iqr;
    const high = q3 + k * iqr;
    for (const { index, value } of entries) {
      if (!Number.isFinite(value)) {
        continue;
      }
      if (value < low || value > high) {
        flags.push({
          recordIndex: index,
          metricKey,
          value,
          reason: `outside_iqr_range(${low.toFixed(4)},${high.toFixed(4)})`,
        });
      }
    }
  }

  return flags;
}
