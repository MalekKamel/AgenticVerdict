import { renderDataTable } from "../../components/data-table";
import { renderSectionDivider } from "../../components/section-divider";
import { escapeHtml } from "../../html-utils";
import { getReportStrings } from "../../i18n/report-strings";
import type { ReportGenerationContext } from "../../types";
import { BaseReportTemplate } from "../base-report-template";
import { renderCoverBlock } from "../cover-and-header";
import { wrapReportDocument } from "../document-shell";
import { resolveContextTextDirection } from "../../context-direction";
import { renderTableOfContents } from "../table-of-contents";
import type { TemplateDefinition } from "../template-definition";
import { coerceReportTemplateViewModel } from "../view-model";

const definition: TemplateDefinition = {
  id: "technical-appendix",
  kind: "technical_appendix",
  version: 1,
  title: "Technical appendix",
  description: "Method notes, definitions, and raw tables suitable for an appendix.",
  estimatedPageRange: "5+",
};

export class TechnicalAppendixTemplate extends BaseReportTemplate {
  readonly definition = definition;

  async renderHtml(context: ReportGenerationContext, model: unknown): Promise<string> {
    const vm = coerceReportTemplateViewModel(model);
    const dir = resolveContextTextDirection(context);
    const t = getReportStrings(context.locale);
    const sections = vm.appendixSections;
    const tocEntries = sections.map((s, i) => ({
      id: `appendix-${i}`,
      label: s.heading,
    }));

    const blocks = sections
      .map(
        (s, i) => `${renderSectionDivider()}
<section id="appendix-${i}" style="margin-bottom:20px;">
  <h2 style="font-size:17px;">${escapeHtml(s.heading)}</h2>
  <pre style="white-space:pre-wrap;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;line-height:1.5;background:#f9fafb;padding:14px;border-radius:6px;border:1px solid #e5e7eb;">${escapeHtml(s.content)}</pre>
</section>`,
      )
      .join("\n");

    const metricsBlock =
      vm.metrics.columns.length > 0
        ? `${renderSectionDivider(t.referenceTables)}
<section id="appendix-metrics">
  <h2 style="font-size:17px;">${escapeHtml(t.referenceMetrics)}</h2>
  ${renderDataTable({ ...vm.metrics, striped: true })}
</section>`
        : "";

    const body = `${renderCoverBlock({
      title: vm.title,
      tenantName: vm.tenantName,
      periodLabel: vm.periodLabel,
      accentColor: vm.brandAccentColor,
      locale: context.locale,
    })}
${renderTableOfContents(tocEntries, context.locale)}
${sections.length > 0 ? blocks : `<p style="color:#9ca3af;">${escapeHtml(t.noAppendixText)}</p>`}
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
