import type { NormalizedMetricRecord, NormalizedConnectorSnapshot } from "../normalization/types";

import type { ValidationIssue } from "@agenticverdict/types";

const NEGATIVE_COUNT_RE = /\.(impressions|clicks|reach|conversions)$/i;
const SPEND_RE = /\.(spend|cost)$/i;

function dimensionFingerprint(dimensions: Readonly<Record<string, string>> | undefined): string {
  if (dimensions === undefined) {
    return "";
  }
  return Object.keys(dimensions)
    .sort()
    .map((k) => `${k}=${dimensions[k]}`)
    .join("|");
}

function metricTail(metricKey: string): string {
  const parts = metricKey.split(".");
  return (parts[parts.length - 1] ?? metricKey).toLowerCase();
}

function ctrAsRatio(raw: number): number {
  if (!Number.isFinite(raw)) {
    return raw;
  }
  if (raw > 1 && raw <= 100) {
    return raw / 100;
  }
  return raw;
}

/**
 * Semantic checks on an already structurally valid snapshot.
 */
export function validateNormalizedSnapshot(
  snapshot: NormalizedConnectorSnapshot,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  snapshot.records.forEach((r, idx) => {
    if (!Number.isFinite(r.value)) {
      issues.push({
        severity: "error",
        code: "range.non_finite",
        message: `Value is not a finite number for ${r.metricKey}`,
        recordIndex: idx,
        path: `records[${idx}].value`,
      });
    }
    if (NEGATIVE_COUNT_RE.test(r.metricKey) && r.value < 0) {
      issues.push({
        severity: "error",
        code: "range.negative_count",
        message: `Negative count-like value for ${r.metricKey}`,
        recordIndex: idx,
        path: `records[${idx}].value`,
      });
    }
    if (SPEND_RE.test(r.metricKey) && r.value < 0) {
      issues.push({
        severity: "error",
        code: "range.negative_spend",
        message: `Negative spend for ${r.metricKey}`,
        recordIndex: idx,
        path: `records[${idx}].value`,
      });
    }
    if (Number.isNaN(Date.parse(r.capturedAt))) {
      issues.push({
        severity: "warning",
        code: "timestamp.unparseable",
        message: `capturedAt is not a valid ISO datetime: ${r.capturedAt}`,
        recordIndex: idx,
        path: `records[${idx}].capturedAt`,
      });
    }
  });

  return issues;
}

type GroupMetrics = {
  impressions?: number;
  clicks?: number;
  ctr?: number;
  recordIndexByField: Partial<Record<"impressions" | "clicks" | "ctr", number>>;
};

/**
 * When impressions, clicks, and ctr co-exist for the same row fingerprint, verify CTR is in-family
 * with clicks / impressions (tolerance for platform rounding).
 */
export function validateCrossFieldCtr(snapshot: NormalizedConnectorSnapshot): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const groups = new Map<string, GroupMetrics>();

  for (let i = 0; i < snapshot.records.length; i++) {
    const r = snapshot.records[i]!;
    const tail = metricTail(r.metricKey);
    if (tail !== "impressions" && tail !== "clicks" && tail !== "ctr") {
      continue;
    }
    const platform = r.metricKey.split(".")[0] ?? "";
    const gk = `${platform}|${dimensionFingerprint(r.dimensions)}`;
    const g = groups.get(gk) ?? { recordIndexByField: {} };
    if (tail === "impressions") {
      g.impressions = r.value;
      g.recordIndexByField.impressions = i;
    } else if (tail === "clicks") {
      g.clicks = r.value;
      g.recordIndexByField.clicks = i;
    } else {
      g.ctr = r.value;
      g.recordIndexByField.ctr = i;
    }
    groups.set(gk, g);
  }

  for (const g of groups.values()) {
    const imp = g.impressions;
    const clk = g.clicks;
    const ctr = g.ctr;
    if (imp === undefined || clk === undefined || ctr === undefined) {
      continue;
    }
    if (imp <= 0 || !Number.isFinite(imp) || !Number.isFinite(clk) || !Number.isFinite(ctr)) {
      continue;
    }
    const expected = clk / imp;
    const actual = ctrAsRatio(ctr);
    if (!Number.isFinite(actual)) {
      continue;
    }
    const tol = Math.max(0.005, 0.12 * expected);
    if (Math.abs(actual - expected) > tol) {
      issues.push({
        severity: "warning",
        code: "crossfield.ctr_mismatch",
        message: `CTR ${actual.toFixed(4)} inconsistent with clicks/impressions (${expected.toFixed(4)})`,
        recordIndex: g.recordIndexByField.ctr,
        path: `records[${g.recordIndexByField.ctr ?? ""}].value`,
      });
    }
  }

  return issues;
}

export function validateSpendVersusCpcClicks(
  records: readonly NormalizedMetricRecord[],
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const groups = new Map<
    string,
    {
      spend?: number;
      cpc?: number;
      clicks?: number;
      idx: Partial<Record<"spend" | "cpc" | "clicks", number>>;
    }
  >();

  records.forEach((r, i) => {
    const tail = metricTail(r.metricKey);
    if (tail !== "spend" && tail !== "cpc" && tail !== "clicks") {
      return;
    }
    const platform = r.metricKey.split(".")[0] ?? "";
    const gk = `${platform}|${dimensionFingerprint(r.dimensions)}`;
    const g = groups.get(gk) ?? { idx: {} };
    if (tail === "spend") {
      g.spend = r.value;
      g.idx.spend = i;
    } else if (tail === "cpc") {
      g.cpc = r.value;
      g.idx.cpc = i;
    } else {
      g.clicks = r.value;
      g.idx.clicks = i;
    }
    groups.set(gk, g);
  });

  for (const g of groups.values()) {
    if (g.spend === undefined || g.cpc === undefined || g.clicks === undefined) {
      continue;
    }
    if (g.clicks <= 0 || g.cpc < 0 || g.spend < 0) {
      continue;
    }
    const implied = g.cpc * g.clicks;
    const tol = Math.max(0.05 * implied, 0.5);
    if (Math.abs(g.spend - implied) > tol) {
      issues.push({
        severity: "warning",
        code: "crossfield.spend_cpc_clicks",
        message: `Spend ${g.spend.toFixed(2)} diverges from cpc*clicks ${implied.toFixed(2)}`,
        recordIndex: g.idx.spend,
      });
    }
  }

  return issues;
}
