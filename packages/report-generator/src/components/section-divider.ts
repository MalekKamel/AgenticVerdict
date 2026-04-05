import { escapeHtml } from "../html-utils";

export function renderSectionDivider(label?: string): string {
  if (!label) {
    return `<hr class="section-divider" style="border:none;border-top:1px solid #e5e7eb;margin:28px 0;"/>`;
  }
  return `<div class="section-divider labeled" style="display:flex;align-items:center;gap:12px;margin:28px 0;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.06em;">
  <span style="flex:1;height:1px;background:#e5e7eb;"></span>
  <span>${escapeHtml(label)}</span>
  <span style="flex:1;height:1px;background:#e5e7eb;"></span>
</div>`;
}
