import type { AppLocale } from "@agenticverdict/i18n";
import { loadMessagesSync } from "@agenticverdict/i18n";

export interface ReportStrings {
  marketingIntelligence: string;
  contents: string;
  verdict: string;
  dataQuality: string;
  summary: string;
  keyFindings: string;
  finding: (n: number) => string;
  recommendations: string;
  insights: string;
  statistics: string;
  keyMetrics: string;
  metrics: string;
  charts: string;
  analysisBody: string;
  visuals: string;
  referenceTables: string;
  referenceMetrics: string;
  phase2Integration: string;
  verdictScore: string;
  verdictOverview: string;
  type: string;
  sentiment: string;
  modelConfidence: string;
  insightContext: string;
  statisticalSummaries: string;
  measure: string;
  value: string;
  note: string;
  dataQualityIndicators: string;
  noSummaryText: string;
  noChartData: string;
  noMetricsText: string;
  noSectionsText: string;
  noAppendixText: string;
  noInsightsText: string;
  sections: string;
  xlsxReport: string;
  xlsxReportSummary: string;
  xlsxInsight: string;
  xlsxDateRange: string;
  xlsxTenantId: string;
  xlsxReportId: string;
  xlsxTemplate: string;
  xlsxKeyMetrics: string;
  xlsxTenantInfo: string;
  xlsxAiInsights: string;
  xlsxTitle: string;
  xlsxType: string;
  xlsxConfidence: string;
  xlsxDescription: string;
  xlsxTimestamp: string;
  xlsxNoData: string;
  xlsxNoTableRows: string;
}

function normalizeLocale(locale: string): AppLocale {
  const normalized = locale.split("-")[0]?.toLowerCase() as AppLocale;
  const validLocales: AppLocale[] = ["en", "ar", "es", "fr", "zh"];
  return validLocales.includes(normalized) ? normalized : "en";
}

export function getReportStrings(locale: string): ReportStrings {
  const appLocale = normalizeLocale(locale);
  const messages = loadMessagesSync(appLocale);

  const t = (key: string, fallback: string) => messages[key] ?? fallback;

  return {
    marketingIntelligence: t("report.marketingIntelligence", "Marketing intelligence"),
    contents: t("report.contents", "Contents"),
    verdict: t("report.verdict", "Verdict"),
    dataQuality: t("report.dataQuality", "Data quality"),
    summary: t("report.summary", "Summary"),
    keyFindings: t("report.keyFindings", "Key findings"),
    finding: (n: number) => {
      const pattern = t("report.finding", "Finding {n}");
      return pattern.replace("{n}", String(n));
    },
    recommendations: t("report.recommendations", "Recommendations"),
    insights: t("report.insights", "Insights"),
    statistics: t("report.statistics", "Statistics"),
    keyMetrics: t("report.keyMetrics", "Key metrics"),
    metrics: t("report.metrics", "Metrics"),
    charts: t("report.charts", "Charts"),
    analysisBody: t("report.analysisBody", "Analysis body"),
    visuals: t("report.visuals", "Visuals"),
    referenceTables: t("report.referenceTables", "Reference tables"),
    referenceMetrics: t("report.referenceMetrics", "Reference metrics"),
    phase2Integration: t("report.phase2Integration", "Phase 2 integration"),
    verdictScore: t("report.verdictScore", "Verdict score"),
    verdictOverview: t("report.verdictOverview", "Verdict overview"),
    type: t("report.type", "Type"),
    sentiment: t("report.sentiment", "Sentiment"),
    modelConfidence: t("report.modelConfidence", "Model confidence"),
    insightContext: t("report.insightContext", "Insight context"),
    statisticalSummaries: t("report.statisticalSummaries", "Statistical summaries"),
    measure: t("report.measure", "Measure"),
    value: t("report.value", "Value"),
    note: t("report.note", "Note"),
    dataQualityIndicators: t("report.dataQualityIndicators", "Data quality indicators"),
    noSummaryText: t("report.noSummaryText", "No executive summary text provided."),
    noChartData: t("report.noChartData", "Chart placeholder — supply charts[0] in the view model."),
    noMetricsText: t("report.noMetricsText", "No metrics data available"),
    noSectionsText: t("report.noSectionsText", "Add narrative sections to populate this template."),
    noAppendixText: t("report.noAppendixText", "No appendix sections provided."),
    noInsightsText: t(
      "report.noInsightsText",
      "No chart specifications were included in this payload.",
    ),
    sections: t("report.sections", "Sections"),
    xlsxReport: t("report.xlsxReport", "Report"),
    xlsxReportSummary: t("report.xlsxReportSummary", "Report Summary"),
    xlsxInsight: t("report.xlsxInsight", "Insight"),
    xlsxDateRange: t("report.xlsxDateRange", "Date Range"),
    xlsxTenantId: t("report.xlsxTenantId", "Tenant ID"),
    xlsxReportId: t("report.xlsxReportId", "Report ID"),
    xlsxTemplate: t("report.xlsxTemplate", "Template"),
    xlsxKeyMetrics: t("report.xlsxKeyMetrics", "Key Metrics"),
    xlsxTenantInfo: t("report.xlsxTenantInfo", "Tenant Info"),
    xlsxAiInsights: t("report.xlsxAiInsights", "AI Insights"),
    xlsxTitle: t("report.xlsxTitle", "Title"),
    xlsxType: t("report.xlsxType", "Type"),
    xlsxConfidence: t("report.xlsxConfidence", "Confidence"),
    xlsxDescription: t("report.xlsxDescription", "Description"),
    xlsxTimestamp: t("report.xlsxTimestamp", "Timestamp"),
    xlsxNoData: t("report.xlsxNoData", "No metrics data available"),
    xlsxNoTableRows: t("report.xlsxNoTableRows", "No table rows found in rendered template"),
  };
}
