/**
 * Report generation — Phase 03 infrastructure: orchestration, format plugins, Drizzle helpers.
 */
export { BaseReportGenerator, DefaultReportGenerator } from "./base-report-generator";
export { resolveContextTextDirection } from "./context-direction";
export {
  CompositeTemplateEngine,
  createDefaultCompositeTemplateEngine,
} from "./composite-template-engine";
export { renderChartFromSpec } from "./components/charts";
export { renderScoreGaugeSvg } from "./components/gauge";
export { renderCallout, renderHighlightBanner, type CalloutVariant } from "./components/callout";
export { renderDataTable, type DataTableInput } from "./components/data-table";
export { renderFigure, renderFigurePlaceholder, type FigureInput } from "./components/figure";
export { renderSectionDivider } from "./components/section-divider";
export { HtmlDocxFormatGenerator } from "./docx-format-generator";
export { HtmlFormatGenerator } from "./html-format-generator";
export { ExcelXlsxFormatGenerator } from "./xlsx-format-generator";
export { JsonFormatGenerator } from "./json-format-generator";
export {
  mapVerdictToReportModel,
  mergePhase2IntoReportModel,
  type MergePhase2ReportModelOptions,
  type Phase3Verdict,
} from "./integration/phase2-report-model";
export {
  createDefaultFormatRegistry,
  createStubFormatRegistry,
  FormatGeneratorRegistry,
  StubFormatGenerator,
} from "./format-registry";
export { packDocxFromHtml, buildReportDocumentFromHtml } from "./html-to-docx";
export {
  closeSharedChromiumBrowser,
  ensureHtmlDocument,
  PlaywrightPdfFormatGenerator,
  type PlaywrightPdfFormatGeneratorOptions,
} from "./pdf-playwright-generator";
export {
  getPlaywrightChromiumLaunchOptions,
  isPlaywrightChromiumAvailable,
  resolvePlaywrightChromiumExecutablePath,
} from "./playwright-chromium-path";
export { DEFAULT_REPORT_PRINT_CSS } from "./pdf-print-styles";
export { escapeAttr, escapeHtml, sanitizeDomId } from "./html-utils";
export {
  insertReportRow,
  selectReportForTenant,
  updateReportRowMetadata,
  updateReportRowStatus,
  type NewReportRow,
} from "./storage/drizzle-reports";
export type { TemplateHtmlOverrideSource } from "./template-override-source";
export { PlaceholderTemplateEngine } from "./template-engine";
export { BaseReportTemplate } from "./templates/base-report-template";
export { createBuiltInTemplateMap, getBuiltInTemplateCatalog } from "./templates/built-in-registry";
export { DetailedAnalysisTemplate } from "./templates/built-in/detailed-analysis-template";
export { ExecutiveSummaryTemplate } from "./templates/built-in/executive-summary-template";
export { TechnicalAppendixTemplate } from "./templates/built-in/technical-appendix-template";
export { wrapReportDocument, type ReportDocumentShellOptions } from "./templates/document-shell";
export { textDirection as localeToTextDirection } from "@agenticverdict/i18n";
export {
  templateDefinitionSchema,
  templateKindSchema,
  type TemplateDefinition,
  type TemplateKind,
} from "./templates/template-definition";
export {
  coerceReportTemplateViewModel,
  safeSectionBody,
  type AppendixSection,
  type ChartSpec,
  type DataQualityIndicatorView,
  type InsightHighlightView,
  type NarrativeSection,
  type ReportTemplateViewModel,
  type StatisticalSummaryView,
  type VerdictRecommendationView,
  type VerdictScorecardView,
} from "./templates/view-model";
export {
  REPORT_FORMATS,
  type FormatGeneratorInput,
  type IFormatGenerator,
  type IReportGenerator,
  type ITemplateEngine,
  type ReportFormat,
  type ReportGenerationContext,
} from "./types";
export { REPORT_GENERATOR_PACKAGE_VERSION } from "./version";
