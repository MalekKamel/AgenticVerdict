import { escapeAttr, escapeHtml } from "../html-utils";

const W = 200;
const H = 120;
const cx = W / 2;
const cy = H - 18;
const r = 72;

/**
 * Semicircular score gauge (0–100) with optional confidence caption for report HTML/SVG.
 */
export function renderScoreGaugeSvg(
  score: number,
  options?: { title?: string; confidence?: number },
): string {
  const clamped = Math.min(100, Math.max(0, score));
  const title = options?.title ?? "Verdict score";
  const conf = options?.confidence;
  const angle = Math.PI * (1 - clamped / 100);
  const nx = cx + r * Math.cos(angle);
  const ny = cy - r * Math.sin(angle);

  const confText =
    conf !== undefined && Number.isFinite(conf)
      ? `<text x="${cx}" y="${H - 4}" text-anchor="middle" font-size="10" fill="#6b7280">Confidence ${Math.round(conf * 100)}%</text>`
      : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${escapeAttr(title)}: ${clamped}">
  <text x="${cx}" y="14" text-anchor="middle" font-size="11" fill="#374151">${escapeHtml(title)}</text>
  <path d="M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}" fill="none" stroke="#e5e7eb" stroke-width="10" stroke-linecap="round"/>
  <path d="M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${nx} ${ny}" fill="none" stroke="#2563eb" stroke-width="10" stroke-linecap="round"/>
  <text x="${cx}" y="${cy - 8}" text-anchor="middle" font-size="22" font-weight="600" fill="#111827">${clamped}</text>
  ${confText}
</svg>`;
}
