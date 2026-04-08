import { describe, expect, it } from "vitest";

import {
  analyzeArabicLocaleQuality,
  computeLexicalOverlapDiagnostic,
} from "./arabic-locale-quality";

describe("computeLexicalOverlapDiagnostic", () => {
  it("returns 1 when Arabic tokens are a subset of English tokens", () => {
    const score = computeLexicalOverlapDiagnostic("hello world", "hello world extra");
    expect(score).toBe(1);
  });

  it("returns 0 when there is no token overlap", () => {
    const score = computeLexicalOverlapDiagnostic("مرحبا بالعالم", "hello world");
    expect(score).toBe(0);
  });
});

describe("analyzeArabicLocaleQuality", () => {
  it("produces a bounded mean overlap score for checked-in locales", () => {
    const report = analyzeArabicLocaleQuality("en");
    expect(report.meanLexicalOverlapVsEn).not.toBeNull();
    expect(report.meanLexicalOverlapVsEn!).toBeGreaterThanOrEqual(0);
    expect(report.meanLexicalOverlapVsEn!).toBeLessThanOrEqual(1);
  });
});
