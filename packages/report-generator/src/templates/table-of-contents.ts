import { escapeHtml } from "../html-utils";
import { getReportStrings } from "../i18n/report-strings";

export interface TocEntry {
  id: string;
  label: string;
}

export function renderTableOfContents(entries: TocEntry[], locale?: string): string {
  const t = getReportStrings(locale ?? "en");
  if (entries.length === 0) {
    return "";
  }
  const items = entries
    .map(
      (e) =>
        `<li style="margin:6px 0;"><a href="#${escapeHtml(e.id)}">${escapeHtml(e.label)}</a></li>`,
    )
    .join("\n");
  return `<nav class="report-toc" aria-label="${escapeHtml(t.contents)}" style="margin:24px 0;padding:16px 20px;background:#f9fafb;border-radius:8px;">
  <h2 style="margin:0 0 12px;font-size:16px;">${escapeHtml(t.contents)}</h2>
  <ol style="margin:0;padding-left:20px;">${items}</ol>
</nav>`;
}
