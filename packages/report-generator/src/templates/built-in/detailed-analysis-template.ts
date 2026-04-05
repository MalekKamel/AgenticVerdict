import { renderChartFromSpec } from "../../components/charts";
import { renderCallout } from "../../components/callout";
import { renderDataTable } from "../../components/data-table";
import { renderSectionDivider } from "../../components/section-divider";
import { escapeHtml, sanitizeDomId } from "../../html-utils";
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
    const tocEntries: { id: string; label: string }[] = [];
    if (vm.verdictScorecard) {
      tocEntries.push({ id: "sec-verdict-scorecard", label: "Verdict" });
    }
    if (vm.insightHighlights?.length) {
      tocEntries.push({ id: "sec-insight-context", label: "Insights" });
    }
    tocEntries.push(
      ...vm.narrativeSections.map((s) => ({
        id: sanitizeDomId(s.id),
        label: s.heading,
      })),
    );
    if (vm.metrics.columns.length > 0) {
      tocEntries.push({ id: "detailed-metrics", label: "Metrics" });
    }
    if (vm.charts.length > 0) {
      tocEntries.push({ id: "detailed-charts", label: "Charts" });
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
  <h2 style="font-size:18px;">Charts</h2>
  <div style="display:flex;flex-wrap:wrap;gap:16px;">
    ${vm.charts.map((c) => `<div style="flex:1 1 280px;">${renderChartFromSpec(c)}</div>`).join("")}
  </div>
</section>`
        : renderCallout(
            "warning",
            "Charts",
            "No chart specifications were included in this payload.",
          );

    const metricsBlock =
      vm.metrics.columns.length > 0
        ? `<section id="detailed-metrics" style="margin-top:28px;">
  <h2 style="font-size:18px;">Metrics</h2>
  ${renderDataTable({ ...vm.metrics, caption: "Full metric extract", striped: true })}
</section>`
        : "";

    const phase2Banner = renderPhase2IntegrationBanner(vm);
    const verdictBlock = renderVerdictScorecardBlock(vm);
    const insightBlock = renderInsightContextBlock(vm);
    const recBlock = renderRecommendationEngineBlock(vm);
    const statsBlock = renderStatisticalSummariesBlock(vm);
    const dqBlock = renderDataQualityIndicatorsBlock(vm);

    const body = `${renderCoverBlock({
      title: vm.title,
      companyName: vm.companyName,
      periodLabel: vm.periodLabel,
      accentColor: vm.brandAccentColor,
    })}
${renderRunningHeader({ title: vm.title, accentColor: vm.brandAccentColor })}
${renderTableOfContents(tocEntries)}
${phase2Banner}
${verdictBlock}
${dqBlock}
${insightBlock}
${recBlock}
${statsBlock}
${renderSectionDivider("Analysis body")}
${narrative.length > 0 ? narrative : renderCallout("info", "Sections", "Add narrativeSections to populate this template.")}
${renderSectionDivider("Visuals")}
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
