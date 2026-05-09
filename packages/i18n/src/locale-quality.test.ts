import { describe, expect, it } from "vitest";

import { APP_LOCALES } from "./formatters";
import {
  analyzeLocaleQuality,
  computeLexicalOverlapDiagnostic,
  targetLocales,
} from "./locale-quality";

describe("computeLexicalOverlapDiagnostic", () => {
  it("returns 1 when target tokens are a subset of reference tokens", () => {
    const score = computeLexicalOverlapDiagnostic("hello world", "hello world extra");
    expect(score).toBe(1);
  });

  it("returns 0 when there is no token overlap", () => {
    const score = computeLexicalOverlapDiagnostic("مرحبا بالعالم", "hello world");
    expect(score).toBe(0);
  });

  it("returns 0 for empty target text", () => {
    const score = computeLexicalOverlapDiagnostic("", "hello world");
    expect(score).toBe(0);
  });
});

describe("targetLocales", () => {
  it("excludes the reference locale", () => {
    const targets = targetLocales("en");
    expect(targets).not.toContain("en");
    expect(targets.length).toBe(APP_LOCALES.length - 1);
  });

  it("returns all locales when reference is not en", () => {
    const targets = targetLocales("ar");
    expect(targets).not.toContain("ar");
    expect(targets.length).toBe(APP_LOCALES.length - 1);
  });
});

describe("analyzeLocaleQuality", () => {
  it.each(APP_LOCALES)("produces a bounded mean overlap score for locale '%s'", (locale) => {
    const report = analyzeLocaleQuality(locale);
    expect(report.meanLexicalOverlapVsEn).not.toBeNull();
    expect(report.meanLexicalOverlapVsEn!).toBeGreaterThanOrEqual(0);
    expect(report.meanLexicalOverlapVsEn!).toBeLessThanOrEqual(1);
  });

  it("reports no issues for English against itself", () => {
    const report = analyzeLocaleQuality("en", "en");
    expect(report.issues).toHaveLength(0);
  });

  it("reports no structural issues for checked-in locale bundles", () => {
    for (const locale of targetLocales()) {
      const report = analyzeLocaleQuality(locale);
      expect(report.issues, `Locale "${locale}" should have no issues`).toHaveLength(0);
    }
  });
});
