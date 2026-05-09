import { describe, it, expect } from "vitest";
import { getReportStrings } from "./report-strings";

describe("getReportStrings", () => {
  const supportedLocales = ["en", "ar", "fr", "es", "zh"];

  it("returns non-empty strings for all locales", () => {
    for (const locale of supportedLocales) {
      const strings = getReportStrings(locale);
      expect(strings.marketingIntelligence.length).toBeGreaterThan(0);
      expect(strings.contents.length).toBeGreaterThan(0);
      expect(strings.verdict.length).toBeGreaterThan(0);
      expect(strings.dataQuality.length).toBeGreaterThan(0);
      expect(strings.summary.length).toBeGreaterThan(0);
      expect(strings.keyFindings.length).toBeGreaterThan(0);
      expect(strings.recommendations.length).toBeGreaterThan(0);
      expect(strings.insights.length).toBeGreaterThan(0);
      expect(strings.statistics.length).toBeGreaterThan(0);
      expect(strings.keyMetrics.length).toBeGreaterThan(0);
      expect(strings.metrics.length).toBeGreaterThan(0);
      expect(strings.charts.length).toBeGreaterThan(0);
      expect(strings.analysisBody.length).toBeGreaterThan(0);
      expect(strings.visuals.length).toBeGreaterThan(0);
      expect(strings.referenceTables.length).toBeGreaterThan(0);
      expect(strings.referenceMetrics.length).toBeGreaterThan(0);
      expect(strings.phase2Integration.length).toBeGreaterThan(0);
      expect(strings.verdictScore.length).toBeGreaterThan(0);
      expect(strings.verdictOverview.length).toBeGreaterThan(0);
      expect(strings.type.length).toBeGreaterThan(0);
      expect(strings.sentiment.length).toBeGreaterThan(0);
      expect(strings.modelConfidence.length).toBeGreaterThan(0);
      expect(strings.insightContext.length).toBeGreaterThan(0);
      expect(strings.statisticalSummaries.length).toBeGreaterThan(0);
      expect(strings.measure.length).toBeGreaterThan(0);
      expect(strings.value.length).toBeGreaterThan(0);
      expect(strings.note.length).toBeGreaterThan(0);
      expect(strings.dataQualityIndicators.length).toBeGreaterThan(0);
      expect(strings.noSummaryText.length).toBeGreaterThan(0);
      expect(strings.noChartData.length).toBeGreaterThan(0);
      expect(strings.noMetricsText.length).toBeGreaterThan(0);
      expect(strings.noSectionsText.length).toBeGreaterThan(0);
      expect(strings.noAppendixText.length).toBeGreaterThan(0);
      expect(strings.noInsightsText.length).toBeGreaterThan(0);
      expect(strings.xlsxReport.length).toBeGreaterThan(0);
      expect(strings.xlsxReportSummary.length).toBeGreaterThan(0);
      expect(strings.xlsxInsight.length).toBeGreaterThan(0);
      expect(strings.xlsxDateRange.length).toBeGreaterThan(0);
      expect(strings.xlsxTenantId.length).toBeGreaterThan(0);
      expect(strings.xlsxReportId.length).toBeGreaterThan(0);
      expect(strings.xlsxTemplate.length).toBeGreaterThan(0);
      expect(strings.xlsxKeyMetrics.length).toBeGreaterThan(0);
      expect(strings.xlsxTenantInfo.length).toBeGreaterThan(0);
      expect(strings.xlsxAiInsights.length).toBeGreaterThan(0);
      expect(strings.xlsxTitle.length).toBeGreaterThan(0);
      expect(strings.xlsxType.length).toBeGreaterThan(0);
      expect(strings.xlsxConfidence.length).toBeGreaterThan(0);
      expect(strings.xlsxDescription.length).toBeGreaterThan(0);
      expect(strings.xlsxTimestamp.length).toBeGreaterThan(0);
      expect(strings.xlsxNoData.length).toBeGreaterThan(0);
      expect(strings.xlsxNoTableRows.length).toBeGreaterThan(0);
    }
  });

  it("falls back to English for unknown locale", () => {
    const strings = getReportStrings("unknown");
    expect(strings.marketingIntelligence).toBe("Marketing intelligence");
    expect(strings.contents).toBe("Contents");
    expect(strings.verdict).toBe("Verdict");
  });

  it("handles locale with region code", () => {
    const strings = getReportStrings("ar-SA");
    expect(strings.marketingIntelligence.length).toBeGreaterThan(0);
    expect(strings.verdict).not.toBe("Verdict");
  });

  it("finding plural function works correctly", () => {
    const en = getReportStrings("en");
    expect(en.finding(1)).toBe("Finding 1");
    expect(en.finding(3)).toBe("Finding 3");
    expect(en.finding(10)).toBe("Finding 10");

    const ar = getReportStrings("ar");
    expect(ar.finding(1)).toBe("النتيجة 1");
    expect(ar.finding(2)).toBe("النتيجة 2");

    const fr = getReportStrings("fr");
    expect(fr.finding(1)).toBe("Conclusion 1");

    const es = getReportStrings("es");
    expect(es.finding(1)).toBe("Hallazgo 1");

    const zh = getReportStrings("zh");
    expect(zh.finding(1)).toBe("发现 1");
  });

  it("returns different strings for different locales", () => {
    const en = getReportStrings("en");
    const ar = getReportStrings("ar");
    const fr = getReportStrings("fr");

    expect(ar.verdict).not.toBe(en.verdict);
    expect(ar.contents).not.toBe(en.contents);
    expect(fr.contents).not.toBe(en.contents);
    expect(fr.keyFindings).not.toBe(en.keyFindings);
  });
});
