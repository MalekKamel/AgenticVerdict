import { renderChartFromSpec } from "../../components/charts";
import { renderCallout } from "../../components/callout";
import { renderDataTable } from "../../components/data-table";
import { renderFigurePlaceholder } from "../../components/figure";
import { escapeHtml } from "../../html-utils";
import { getReportStrings } from "../../i18n/report-strings";
import {
  renderDataQualityIndicatorsBlock,
  renderInsightContextBlock,
  renderPhase2IntegrationBanner,
  renderRecommendationEngineBlock,
  renderStatisticalSummariesBlock,
  renderVerdictScorecardBlock,
} from "../../integration/phase2-html-blocks";
import { BaseReportTemplate } from "../base-report-template";
import { renderCoverBlock } from "../cover-and-header";
import { resolveContextTextDirection } from "../../context-direction";
import { wrapReportDocument } from "../document-shell";
import { renderTableOfContents } from "../table-of-contents";
import type { TemplateDefinition } from "../template-definition";
import { coerceReportTemplateViewModel } from "../view-model";
import type { ReportGenerationContext } from "../../types";

const definition: TemplateDefinition = {
  id: "executive-summary",
  kind: "executive_summary",
  version: 1,
  title: "Executive summary",
  description:
    "Short leadership-ready narrative with KPI highlights (2–5 pages when rendered to PDF).",
  estimatedPageRange: "2–5",
};

export class ExecutiveSummaryTemplate extends BaseReportTemplate {
  readonly definition = definition;

  async renderHtml(context: ReportGenerationContext, model: unknown): Promise<string> {
    const vm = coerceReportTemplateViewModel(model);
    const dir = resolveContextTextDirection(context);
    const t = getReportStrings(context.locale);
    const tocEntries: { id: string; label: string }[] = [];
    if (vm.verdictScorecard) {
      tocEntries.push({ id: "sec-verdict-scorecard", label: t.verdict });
    }
    if (vm.dataQualityIndicators?.length) {
      tocEntries.push({ id: "sec-data-quality", label: t.dataQuality });
    }
    tocEntries.push({ id: "sec-summary", label: t.summary });
    tocEntries.push(
      ...vm.keyFindings.map((_, i) => ({ id: `sec-finding-${i}`, label: t.finding(i + 1) })),
    );
    if (vm.verdictRecommendations?.length) {
      tocEntries.push({ id: "sec-recommendations", label: t.recommendations });
    }
    if (vm.insightHighlights?.length) {
      tocEntries.push({ id: "sec-insight-context", label: t.insights });
    }
    if (vm.statisticalSummaries?.length) {
      tocEntries.push({ id: "sec-statistical-summaries", label: t.statistics });
    }
    if (vm.metrics.columns.length > 0) {
      tocEntries.push({ id: "sec-metrics", label: t.keyMetrics });
    }
    const findings =
      vm.keyFindings.length > 0
        ? `<section id="sec-findings" style="margin-top:20px;">
  <h2 style="font-size:18px;">${escapeHtml(t.keyFindings)}</h2>
  <ol style="padding-left:20px;line-height:1.6;">
    ${vm.keyFindings.map((f, i) => `<li id="sec-finding-${i}" style="margin:6px 0;">${escapeHtml(f)}</li>`).join("")}
  </ol>
</section>`
        : "";

    const summaryBlock =
      vm.executiveSummary.length > 0
        ? `<section id="sec-summary" style="margin-top:8px;">
  <h2 style="font-size:18px;">${escapeHtml(t.summary)}</h2>
  ${renderCallout("info", t.summary, vm.executiveSummary)}
</section>`
        : `<section id="sec-summary"><p style="color:#9ca3af;">${escapeHtml(t.noSummaryText)}</p></section>`;

    const firstChart = vm.charts[0];
    const chartBlock = firstChart
      ? `<section style="margin-top:20px;" aria-label="${escapeHtml(t.charts)}">${renderChartFromSpec(firstChart)}</section>`
      : renderFigurePlaceholder(t.noChartData);

    const metricsBlock =
      vm.metrics.columns.length > 0
        ? `<section id="sec-metrics" style="margin-top:24px;">
  <h2 style="font-size:18px;">${escapeHtml(t.keyMetrics)}</h2>
  ${renderDataTable({ ...vm.metrics, caption: t.keyMetrics, striped: true })}
</section>`
        : "";

    const phase2Banner = renderPhase2IntegrationBanner(vm, context.locale);
    const verdictBlock = renderVerdictScorecardBlock(vm, context.locale);
    const dqBlock = renderDataQualityIndicatorsBlock(vm, context.locale);
    const recBlock = renderRecommendationEngineBlock(vm, context.locale);
    const insightBlock = renderInsightContextBlock(vm, context.locale);
    const statsBlock = renderStatisticalSummariesBlock(vm, context.locale);

    const body = `${renderCoverBlock({
      title: vm.title,
      tenantName: vm.tenantName,
      periodLabel: vm.periodLabel,
      accentColor: vm.brandAccentColor,
      locale: context.locale,
    })}
${renderTableOfContents(tocEntries, context.locale)}
${phase2Banner}
${verdictBlock}
${dqBlock}
${summaryBlock}
${findings}
${recBlock}
${insightBlock}
${statsBlock}
${chartBlock}
${metricsBlock}`;

    return wrapReportDocument({
      locale: context.locale,
      dir,
      title: vm.title,
      accentColor: vm.brandAccentColor,
      body,
    });
  }
}
