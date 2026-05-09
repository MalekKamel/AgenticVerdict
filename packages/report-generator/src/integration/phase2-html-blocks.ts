import { renderCallout } from "../components/callout";
import { renderScoreGaugeSvg } from "../components/gauge";
import { escapeHtml } from "../html-utils";
import { getReportStrings } from "../i18n/report-strings";
import type { ReportTemplateViewModel } from "../templates/view-model";

export function renderPhase2IntegrationBanner(
  vm: ReportTemplateViewModel,
  locale?: string,
): string {
  const t = getReportStrings(locale ?? "en");
  const errs = vm.phase2IntegrationErrors;
  if (!errs?.length) {
    return "";
  }
  return renderCallout(
    "warning",
    t.phase2Integration,
    `Some payloads did not match the expected schema: ${errs.join(", ")}.`,
  );
}

export function renderVerdictScorecardBlock(vm: ReportTemplateViewModel, locale?: string): string {
  const t = getReportStrings(locale ?? "en");
  const sc = vm.verdictScorecard;
  if (!sc) {
    return "";
  }
  const gauge = renderScoreGaugeSvg(sc.score, {
    title: t.verdictScore,
    confidence: sc.confidence,
  });
  const typeLabel = sc.verdictType.replace(/_/g, " ");
  return `<section id="sec-verdict-scorecard" style="margin-top:20px;display:flex;flex-wrap:wrap;gap:20px;align-items:flex-start;">
  <div style="flex:0 0 auto;border:1px solid #e5e7eb;border-radius:8px;padding:12px;background:#fff;">
    ${gauge}
  </div>
  <div style="flex:1 1 240px;">
    <h2 style="font-size:18px;margin:0 0 8px;">${escapeHtml(t.verdictOverview)}</h2>
    <p style="margin:0 0 6px;color:#374151;font-size:14px;"><strong>${escapeHtml(t.type)}:</strong> ${escapeHtml(typeLabel)}</p>
    <p style="margin:0 0 6px;color:#374151;font-size:14px;"><strong>${escapeHtml(t.sentiment)}:</strong> ${escapeHtml(sc.sentiment)}</p>
    <p style="margin:0 0 6px;color:#374151;font-size:14px;"><strong>${escapeHtml(t.modelConfidence)}:</strong> ${Math.round(sc.confidence * 100)}%</p>
    ${sc.summaryLine ? `<p style="margin:10px 0 0;line-height:1.55;font-size:14px;">${escapeHtml(sc.summaryLine)}</p>` : ""}
  </div>
</section>`;
}

export function renderRecommendationEngineBlock(
  vm: ReportTemplateViewModel,
  locale?: string,
): string {
  const t = getReportStrings(locale ?? "en");
  const recs = vm.verdictRecommendations;
  if (!recs?.length) {
    return "";
  }
  const items = recs
    .slice(0, 8)
    .map(
      (r) => `<li style="margin:10px 0;line-height:1.5;">
  <strong>${escapeHtml(r.title)}</strong> <span style="color:#6b7280;">(P${r.priority}, ${escapeHtml(r.effort)} effort)</span><br/>
  <span style="font-size:14px;">${escapeHtml(r.rationale)}</span>
</li>`,
    )
    .join("");
  return `<section id="sec-recommendations" style="margin-top:22px;">
  <h2 style="font-size:18px;">${escapeHtml(t.recommendations)}</h2>
  <ol style="padding-left:20px;margin:8px 0 0;">${items}</ol>
</section>`;
}

export function renderInsightContextBlock(vm: ReportTemplateViewModel, locale?: string): string {
  const t = getReportStrings(locale ?? "en");
  const rows = vm.insightHighlights;
  if (!rows?.length) {
    return "";
  }
  const cards = rows
    .slice(0, 10)
    .map(
      (
        i,
      ) => `<article style="border:1px solid #e5e7eb;border-radius:8px;padding:12px 14px;margin:10px 0;background:#fafafa;">
  <div style="font-size:12px;text-transform:uppercase;color:#6b7280;letter-spacing:0.04em;">${escapeHtml(i.type)} · ${Math.round(i.confidence * 100)}% confidence</div>
  <h3 style="font-size:15px;margin:6px 0 4px;">${escapeHtml(i.title)}</h3>
  <p style="margin:0;font-size:14px;line-height:1.5;color:#374151;">${escapeHtml(i.description)}</p>
</article>`,
    )
    .join("");
  return `<section id="sec-insight-context" style="margin-top:22px;">
  <h2 style="font-size:18px;">${escapeHtml(t.insightContext)}</h2>
  ${cards}
</section>`;
}

export function renderStatisticalSummariesBlock(
  vm: ReportTemplateViewModel,
  locale?: string,
): string {
  const t = getReportStrings(locale ?? "en");
  const stats = vm.statisticalSummaries;
  if (!stats?.length) {
    return "";
  }
  const lines = stats
    .map(
      (s) => `<tr>
  <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-weight:500;">${escapeHtml(s.label)}</td>
  <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${escapeHtml(s.value)}</td>
  <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:13px;">${s.note ? escapeHtml(s.note) : "—"}</td>
</tr>`,
    )
    .join("");
  return `<section id="sec-statistical-summaries" style="margin-top:22px;">
  <h2 style="font-size:18px;">${escapeHtml(t.statisticalSummaries)}</h2>
  <table style="width:100%;border-collapse:collapse;margin-top:8px;font-size:14px;">
    <thead><tr>
      <th align="left" style="padding:8px 12px;border-bottom:2px solid #d1d5db;">${escapeHtml(t.measure)}</th>
      <th align="left" style="padding:8px 12px;border-bottom:2px solid #d1d5db;">${escapeHtml(t.value)}</th>
      <th align="left" style="padding:8px 12px;border-bottom:2px solid #d1d5db;">${escapeHtml(t.note)}</th>
    </tr></thead>
    <tbody>${lines}</tbody>
  </table>
</section>`;
}

export function renderDataQualityIndicatorsBlock(
  vm: ReportTemplateViewModel,
  locale?: string,
): string {
  const t = getReportStrings(locale ?? "en");
  const ind = vm.dataQualityIndicators;
  if (!ind?.length) {
    return "";
  }
  const chips = ind
    .map(
      (
        d,
      ) => `<span style="display:inline-flex;align-items:center;gap:8px;margin:6px 8px 6px 0;padding:8px 12px;border-radius:999px;background:#eff6ff;border:1px solid #bfdbfe;font-size:13px;">
  <strong>${escapeHtml(d.label)}</strong>
  <span style="color:#1d4ed8;font-weight:600;">${d.score}</span>
  ${d.detail ? `<span style="color:#6b7280;">${escapeHtml(d.detail)}</span>` : ""}
</span>`,
    )
    .join("");
  return `<section id="sec-data-quality" style="margin-top:20px;">
  <h2 style="font-size:18px;">${escapeHtml(t.dataQualityIndicators)}</h2>
  <div style="margin-top:8px;">${chips}</div>
</section>`;
}
