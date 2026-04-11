import type { ValidationIssue } from "./types";

export function partitionIssuesBySeverity(
  issues: readonly ValidationIssue[],
): Record<ValidationIssue["severity"], ValidationIssue[]> {
  return {
    error: issues.filter((i) => i.severity === "error"),
    warning: issues.filter((i) => i.severity === "warning"),
    info: issues.filter((i) => i.severity === "info"),
  };
}

export function countIssuesByCode(issues: readonly ValidationIssue[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const i of issues) {
    out[i.code] = (out[i.code] ?? 0) + 1;
  }
  return out;
}

/**
 * Compact single-line summary for logs / metrics labels.
 */
export function summarizeValidationIssues(issues: readonly ValidationIssue[]): string {
  const parts = partitionIssuesBySeverity(issues);
  return `errors=${parts.error.length} warnings=${parts.warning.length} info=${parts.info.length}`;
}
