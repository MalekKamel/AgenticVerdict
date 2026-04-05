import { escapeHtml } from "../html-utils";

export interface CoverHeaderInput {
  title: string;
  companyName: string;
  periodLabel: string;
  accentColor: string;
}

export function renderCoverBlock(input: CoverHeaderInput): string {
  const sub = [input.companyName, input.periodLabel].filter(Boolean).join(" · ");
  return `<header class="report-cover" style="border-bottom:3px solid ${escapeHtml(input.accentColor)};padding-bottom:20px;margin-bottom:28px;">
  <p class="brand-accent" style="font-size:13px;letter-spacing:0.04em;text-transform:uppercase;margin:0 0 8px;">Marketing intelligence</p>
  <h1 style="font-size:28px;margin:0 0 8px;">${escapeHtml(input.title)}</h1>
  ${sub ? `<p style="margin:0;color:#4b5563;font-size:14px;">${escapeHtml(sub)}</p>` : ""}
</header>`;
}

export function renderRunningHeader(input: { title: string; accentColor: string }): string {
  return `<div class="running-header" style="display:flex;justify-content:space-between;align-items:center;font-size:12px;color:#6b7280;margin-bottom:16px;padding-bottom:8px;border-bottom:1px solid #e5e7eb;">
  <span class="brand-accent" style="font-weight:600;">${escapeHtml(input.title)}</span>
  <span style="width:8px;height:8px;border-radius:999px;background:${escapeHtml(input.accentColor)};"></span>
</div>`;
}
