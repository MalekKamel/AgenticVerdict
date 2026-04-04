import { describe, expect, it } from "vitest";

import {
  countIssuesByCode,
  partitionIssuesBySeverity,
  summarizeValidationIssues,
} from "./reporting";

describe("reporting helpers", () => {
  const issues = [
    { severity: "error" as const, code: "a", message: "m1" },
    { severity: "warning" as const, code: "b", message: "m2" },
    { severity: "error" as const, code: "a", message: "m3" },
  ];

  it("partitions by severity", () => {
    const p = partitionIssuesBySeverity(issues);
    expect(p.error).toHaveLength(2);
    expect(p.warning).toHaveLength(1);
  });

  it("counts codes", () => {
    expect(countIssuesByCode(issues)).toEqual({ a: 2, b: 1 });
  });

  it("summarizes", () => {
    expect(summarizeValidationIssues(issues)).toMatch(/errors=2/);
  });
});
