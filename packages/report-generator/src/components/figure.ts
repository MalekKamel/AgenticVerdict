import { escapeAttr, escapeHtml } from "../html-utils";

export interface FigureInput {
  src: string;
  alt: string;
  caption?: string;
  /** Max width in px for layout stability in PDF flow. */
  maxWidth?: number;
}

export function renderFigure(input: FigureInput): string {
  const mw = input.maxWidth ?? 560;
  const cap = input.caption
    ? `<figcaption style="margin-top:8px;font-size:13px;color:#6b7280;">${escapeHtml(input.caption)}</figcaption>`
    : "";
  return `<figure class="report-figure" style="margin:20px 0;text-align:center;">
  <img src="${escapeAttr(input.src)}" alt="${escapeAttr(input.alt)}" style="max-width:${mw}px;width:100%;height:auto;border-radius:6px;border:1px solid #e5e7eb;"/>
  ${cap}
</figure>`;
}

export function renderFigurePlaceholder(label: string): string {
  return `<figure class="report-figure-placeholder" style="margin:20px 0;padding:32px;border:1px dashed #d1d5db;border-radius:8px;text-align:center;color:#9ca3af;font-size:13px;">
  ${escapeHtml(label)}
</figure>`;
}
