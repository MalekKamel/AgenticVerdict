import { renderChartFromSpec } from "../../components/charts";
import { renderCallout } from "../../components/callout";
import { renderDataTable } from "../../components/data-table";
import { renderSectionDivider } from "../../components/section-divider";
import { escapeHtml, sanitizeDomId } from "../../html-utils";
import { getReportStrings } from "../../i18n/report-strings";
import {
  renderDataQualityIndicatorsBlock,
  renderInsightContextBlock,
  renderPhase2IntegrationBanner,
  renderRecommendationEngineBlock,
  renderStatisticalSummariesBlock,
  renderVerdictScorecardBlock,
} from "../../integration/phase2-html-blocks";
import type { ReportGenerationContext } from "../../types";
import { BaseReportTemplate } from "../base-report-template";
import { renderCoverBlock, renderRunningHeader } from "../cover-and-header";
import { wrapReportDocument } from "../document-shell";
import { resolveContextTextDirection } from "../../context-direction";
import { renderTableOfContents } from "../table-of-contents";
import type { TemplateDefinition } from "../template-definition";
import { coerceReportTemplateViewModel, safeSectionBody } from "../view-model";

const definition: TemplateDefinition = {
  id: "detailed-analysis",
  kind: "detailed_analysis",
  version: 1,
  title: "Detailed analysis",
  description:
    "Full narrative sections, charts, and metric tables (10–50 pages when rendered to PDF).",
  estimatedPageRange: "10–50",
};

export class DetailedAnalysisTemplate extends BaseReportTemplate {
  readonly definition = definition;

  async renderHtml(context: ReportGenerationContext, model: unknown): Promise<string> {
    const vm = coerceReportTemplateViewModel(model);
    const dir = resolveContextTextDirection(context);
    const t = getReportStrings(context.locale);
    const tocEntries: { id: string; label: string }[] = [];
    if (vm.verdictScorecard) {
      tocEntries.push({ id: "sec-verdict-scorecard", label: t.verdict });
    }
    if (vm.insightHighlights?.length) {
      tocEntries.push({ id: "sec-insight-context", label: t.insights });
    }
    tocEntries.push(
      ...vm.narrativeSections.map((s) => ({
        id: sanitizeDomId(s.id),
        label: s.heading,
      })),
    );
    if (vm.metrics.columns.length > 0) {
      tocEntries.push({ id: "detailed-metrics", label: t.metrics });
    }
    if (vm.charts.length > 0) {
      tocEntries.push({ id: "detailed-charts", label: t.charts });
    }

    const narrative = vm.narrativeSections
      .map(
        (s) => `<section id="${sanitizeDomId(s.id)}" style="margin-top:24px;">
  <h2 style="font-size:18px;">${escapeHtml(s.heading)}</h2>
  <div class="section-body" style="font-size:14px;">${safeSectionBody(s)}</div>
</section>`,
      )
      .join("\n");

    const chartsBlock =
      vm.charts.length > 0
        ? `<section id="detailed-charts" style="margin-top:28px;">
  <h2 style="font-size:18px;">${escapeHtml(t.charts)}</h2>
  <div style="display:flex;flex-wrap:wrap;gap:16px;">
    ${vm.charts.map((c) => `<div style="flex:1 1 280px;">${renderChartFromSpec(c)}</div>`).join("")}
  </div>
</section>`
        : renderCallout("warning", t.charts, t.noInsightsText);

    const metricsBlock =
      vm.metrics.columns.length > 0
        ? `<section id="detailed-metrics" style="margin-top:28px;">
  <h2 style="font-size:18px;">${escapeHtml(t.metrics)}</h2>
  ${renderDataTable({ ...vm.metrics, caption: t.keyMetrics, striped: true })}
</section>`
        : "";

    const phase2Banner = renderPhase2IntegrationBanner(vm, context.locale);
    const verdictBlock = renderVerdictScorecardBlock(vm, context.locale);
    const insightBlock = renderInsightContextBlock(vm, context.locale);
    const recBlock = renderRecommendationEngineBlock(vm, context.locale);
    const statsBlock = renderStatisticalSummariesBlock(vm, context.locale);
    const dqBlock = renderDataQualityIndicatorsBlock(vm, context.locale);

    const body = `${renderCoverBlock({
      title: vm.title,
      tenantName: vm.tenantName,
      periodLabel: vm.periodLabel,
      accentColor: vm.brandAccentColor,
      locale: context.locale,
    })}
${renderRunningHeader({ title: vm.title, accentColor: vm.brandAccentColor })}
${renderTableOfContents(tocEntries, context.locale)}
${phase2Banner}
${verdictBlock}
${dqBlock}
${insightBlock}
${recBlock}
${statsBlock}
${renderSectionDivider(t.analysisBody)}
${narrative.length > 0 ? narrative : renderCallout("info", t.sections, t.noSectionsText)}
${renderSectionDivider(t.visuals)}
${chartsBlock}
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
