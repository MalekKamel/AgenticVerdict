import { describe, expect, it } from "vitest";

import { computeDataQualityScore, qualityScoreFromFlags } from "./scoring";

describe("computeDataQualityScore", () => {
  it("returns 100 for empty record sets", () => {
    expect(
      computeDataQualityScore({
        issues: [{ severity: "error", code: "x", message: "m" }],
        outlierCount: 0,
        recordCount: 0,
      }),
    ).toBe(100);
  });

  it("decreases with errors and outliers", () => {
    const clean = computeDataQualityScore({ issues: [], outlierCount: 0, recordCount: 10 });
    const dirty = computeDataQualityScore({
      issues: [
        { severity: "error", code: "e", message: "e" },
        { severity: "warning", code: "w", message: "w" },
      ],
      outlierCount: 3,
      recordCount: 10,
    });
    expect(clean).toBe(100);
    expect(dirty).toBeLessThan(clean);
    expect(dirty).toBeGreaterThanOrEqual(0);
  });

  it("applies info-level penalties and supports qualityScoreFromFlags", () => {
    const withInfo = computeDataQualityScore({
      issues: [{ severity: "info", code: "i", message: "i" }],
      outlierCount: 0,
      recordCount: 5,
    });
    expect(withInfo).toBeLessThan(100);
    expect(
      qualityScoreFromFlags([{ severity: "error", code: "e", message: "m" }], [], 3),
    ).toBeLessThan(100);
  });
});
