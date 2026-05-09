import type { OutlierFlag, ValidationIssue } from "@agenticverdict/types";

export interface DataQualityScoreInput {
  readonly issues: readonly ValidationIssue[];
  readonly outlierCount: number;
  readonly recordCount: number;
}

function countBySeverity(
  issues: readonly ValidationIssue[],
  sev: ValidationIssue["severity"],
): number {
  return issues.filter((i) => i.severity === sev).length;
}

/**
 * Maps validation noise to a 0–100 score. Empty snapshots are treated as clean (100).
 */
export function computeDataQualityScore(input: DataQualityScoreInput): number {
  if (input.recordCount === 0) {
    return 100;
  }

  const errors = countBySeverity(input.issues, "error");
  const warnings = countBySeverity(input.issues, "warning");
  const infos = countBySeverity(input.issues, "info");

  const penalty = errors * 12 + warnings * 4 + infos * 1 + input.outlierCount * 2;
  return Math.max(0, Math.min(100, 100 - Math.min(penalty, 100)));
}

export function qualityScoreFromFlags(
  issues: ValidationIssue[],
  outliers: OutlierFlag[],
  recordCount: number,
): number {
  return computeDataQualityScore({ issues, outlierCount: outliers.length, recordCount });
}
