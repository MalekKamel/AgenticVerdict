import { renderChartFromSpec } from "../../components/charts";
import { renderCallout } from "../../components/callout";
import { renderDataTable } from "../../components/data-table";
import { renderFigurePlaceholder } from "../../components/figure";
import { escapeHtml } from "../../html-utils";
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
    const tocEntries: { id: string; label: string }[] = [];
    if (vm.verdictScorecard) {
      tocEntries.push({ id: "sec-verdict-scorecard", label: "Verdict" });
    }
    if (vm.dataQualityIndicators?.length) {
      tocEntries.push({ id: "sec-data-quality", label: "Data quality" });
    }
    tocEntries.push({ id: "sec-summary", label: "Summary" });
    tocEntries.push(
      ...vm.keyFindings.map((_, i) => ({ id: `sec-finding-${i}`, label: `Finding ${i + 1}` })),
    );
    if (vm.verdictRecommendations?.length) {
      tocEntries.push({ id: "sec-recommendations", label: "Recommendations" });
    }
    if (vm.insightHighlights?.length) {
      tocEntries.push({ id: "sec-insight-context", label: "Insights" });
    }
    if (vm.statisticalSummaries?.length) {
      tocEntries.push({ id: "sec-statistical-summaries", label: "Statistics" });
    }
    if (vm.metrics.columns.length > 0) {
      tocEntries.push({ id: "sec-metrics", label: "Key metrics" });
    }
    const findings =
      vm.keyFindings.length > 0
        ? `<section id="sec-findings" style="margin-top:20px;">
  <h2 style="font-size:18px;">Key findings</h2>
  <ol style="padding-left:20px;line-height:1.6;">
    ${vm.keyFindings.map((f, i) => `<li id="sec-finding-${i}" style="margin:6px 0;">${escapeHtml(f)}</li>`).join("")}
  </ol>
</section>`
        : "";

    const summaryBlock =
      vm.executiveSummary.length > 0
        ? `<section id="sec-summary" style="margin-top:8px;">
  <h2 style="font-size:18px;">Summary</h2>
  ${renderCallout("info", "Executive overview", vm.executiveSummary)}
</section>`
        : `<section id="sec-summary"><p style="color:#9ca3af;">No executive summary text provided.</p></section>`;

    const firstChart = vm.charts[0];
    const chartBlock = firstChart
      ? `<section style="margin-top:20px;" aria-label="Chart">${renderChartFromSpec(firstChart)}</section>`
      : renderFigurePlaceholder("Chart placeholder — supply charts[0] in the view model.");

    const metricsBlock =
      vm.metrics.columns.length > 0
        ? `<section id="sec-metrics" style="margin-top:24px;">
  <h2 style="font-size:18px;">Key metrics</h2>
  ${renderDataTable({ ...vm.metrics, caption: "Snapshot", striped: true })}
</section>`
        : "";

    const phase2Banner = renderPhase2IntegrationBanner(vm);
    const verdictBlock = renderVerdictScorecardBlock(vm);
    const dqBlock = renderDataQualityIndicatorsBlock(vm);
    const recBlock = renderRecommendationEngineBlock(vm);
    const insightBlock = renderInsightContextBlock(vm);
    const statsBlock = renderStatisticalSummariesBlock(vm);

    const body = `${renderCoverBlock({
      title: vm.title,
      companyName: vm.companyName,
      periodLabel: vm.periodLabel,
      accentColor: vm.brandAccentColor,
    })}
${renderTableOfContents(tocEntries)}
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
