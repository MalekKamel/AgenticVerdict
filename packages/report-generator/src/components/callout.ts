import { escapeHtml } from "../html-utils";

export type CalloutVariant = "info" | "success" | "warning" | "danger";

const variantStyle: Record<CalloutVariant, { border: string; bg: string }> = {
  info: { border: "#3b82f6", bg: "#eff6ff" },
  success: { border: "#10b981", bg: "#ecfdf5" },
  warning: { border: "#f59e0b", bg: "#fffbeb" },
  danger: { border: "#ef4444", bg: "#fef2f2" },
};

export function renderCallout(variant: CalloutVariant, title: string, body: string): string {
  const s = variantStyle[variant];
  return `<aside class="callout callout--${variant}" style="margin:16px 0;padding:14px 16px;border-left:4px solid ${s.border};background:${s.bg};border-radius:4px;">
  <strong style="display:block;margin-bottom:6px;font-size:13px;">${escapeHtml(title)}</strong>
  <div style="font-size:14px;line-height:1.5;">${escapeHtml(body).replace(/\n/g, "<br/>")}</div>
</aside>`;
}

export function renderHighlightBanner(text: string, accentColor: string): string {
  return `<div class="highlight-banner" style="margin:20px 0;padding:12px 16px;background:linear-gradient(90deg, ${escapeHtml(accentColor)}22, transparent);border-radius:6px;font-weight:600;">
  ${escapeHtml(text)}
</div>`;
}
