import { escapeHtml } from "../html-utils";
import type { ChartScatterPoint, ChartSeriesPoint } from "../templates/view-model";

const W = 320;
const H = 180;
const pad = 24;

function svgOpen(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-hidden="true">`;
}

function svgClose(): string {
  return `</svg>`;
}

export function renderBarChartSvg(title: string, series: ChartSeriesPoint[]): string {
  if (series.length === 0) {
    return `${svgOpen()}<text x="${pad}" y="${H / 2}" fill="#9ca3af">${escapeHtml(title)} — no data</text>${svgClose()}`;
  }
  const max = Math.max(...series.map((s) => s.value), 1);
  const barW = (W - pad * 2) / series.length - 4;
  const bars = series
    .map((s, i) => {
      const x = pad + i * (barW + 4);
      const h = ((H - pad * 2) * s.value) / max;
      const y = H - pad - h;
      return `<rect x="${x}" y="${y}" width="${barW}" height="${h}" fill="#3b82f6" rx="2"><title>${escapeHtml(s.label)}: ${s.value}</title></rect>`;
    })
    .join("");
  return `${svgOpen()}
  <text x="${pad}" y="16" font-size="11" fill="#374151">${escapeHtml(title)}</text>
  ${bars}
${svgClose()}`;
}

export function renderLineChartSvg(title: string, series: ChartSeriesPoint[]): string {
  if (series.length < 2) {
    return `${svgOpen()}<text x="${pad}" y="${H / 2}" fill="#9ca3af">${escapeHtml(title)} — need 2+ points</text>${svgClose()}`;
  }
  const max = Math.max(...series.map((s) => s.value), 1);
  const min = Math.min(...series.map((s) => s.value), 0);
  const span = max - min || 1;
  const innerW = W - pad * 2;
  const innerH = H - pad * 2;
  const pts = series
    .map((s, i) => {
      const x = pad + (innerW * i) / (series.length - 1);
      const y = pad + innerH - ((s.value - min) * innerH) / span;
      return `${x},${y}`;
    })
    .join(" ");
  return `${svgOpen()}
  <text x="${pad}" y="16" font-size="11" fill="#374151">${escapeHtml(title)}</text>
  <polyline fill="none" stroke="#8b5cf6" stroke-width="2" points="${pts}"/>
${svgClose()}`;
}

export function renderPieChartSvg(title: string, series: ChartSeriesPoint[]): string {
  if (series.length === 0) {
    return `${svgOpen()}<text x="${pad}" y="${H / 2}" fill="#9ca3af">${escapeHtml(title)} — no data</text>${svgClose()}`;
  }
  const cx = W / 2;
  const cy = H / 2 + 6;
  const r = Math.min(W, H) / 2 - pad;
  const total = series.reduce((a, s) => a + s.value, 0) || 1;
  const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#6366f1", "#ec4899"];
  let angle = -Math.PI / 2;
  const slices: string[] = [];
  for (let i = 0; i < series.length; i += 1) {
    const s = series[i]!;
    const frac = s.value / total;
    const a2 = angle + frac * 2 * Math.PI;
    const x1 = cx + r * Math.cos(angle);
    const y1 = cy + r * Math.sin(angle);
    const x2 = cx + r * Math.cos(a2);
    const y2 = cy + r * Math.sin(a2);
    const large = a2 - angle > Math.PI ? 1 : 0;
    slices.push(
      `<path d="M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z" fill="${colors[i % colors.length]!}"><title>${escapeHtml(s.label)}: ${s.value}</title></path>`,
    );
    angle = a2;
  }
  return `${svgOpen()}
  <text x="${pad}" y="16" font-size="11" fill="#374151">${escapeHtml(title)}</text>
  ${slices.join("")}
${svgClose()}`;
}

export function renderScatterChartSvg(title: string, points: ChartScatterPoint[]): string {
  if (points.length === 0) {
    return `${svgOpen()}<text x="${pad}" y="${H / 2}" fill="#9ca3af">${escapeHtml(title)} — no data</text>${svgClose()}`;
  }
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const spanX = maxX - minX || 1;
  const spanY = maxY - minY || 1;
  const innerW = W - pad * 2;
  const innerH = H - pad * 2;
  const dots = points
    .map((p) => {
      const x = pad + ((p.x - minX) * innerW) / spanX;
      const y = pad + innerH - ((p.y - minY) * innerH) / spanY;
      return `<circle cx="${x}" cy="${y}" r="4" fill="#0ea5e9"><title>${escapeHtml(p.label ?? `${p.x},${p.y}`)}</title></circle>`;
    })
    .join("");
  return `${svgOpen()}
  <text x="${pad}" y="16" font-size="11" fill="#374151">${escapeHtml(title)}</text>
  ${dots}
${svgClose()}`;
}

export function renderChartFromSpec(spec: {
  kind: "bar" | "line" | "pie" | "scatter";
  title: string;
  series?: ChartSeriesPoint[];
  points?: ChartScatterPoint[];
}): string {
  const series = spec.series ?? [];
  const points = spec.points ?? [];
  switch (spec.kind) {
    case "bar":
      return renderBarChartSvg(spec.title, series);
    case "line":
      return renderLineChartSvg(spec.title, series);
    case "pie":
      return renderPieChartSvg(spec.title, series);
    case "scatter":
      return renderScatterChartSvg(spec.title, points);
    default:
      return renderBarChartSvg(spec.title, []);
  }
}
