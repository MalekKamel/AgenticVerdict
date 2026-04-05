import { escapeHtml } from "../html-utils";

export interface DataTableInput {
  columns: string[];
  rows: Record<string, string | number>[];
  caption?: string;
  /** When true, emit simple zebra striping for long tables (PDF-friendly). */
  striped?: boolean;
}

export function renderDataTable(input: DataTableInput): string {
  const { columns, rows, caption, striped } = input;
  if (columns.length === 0) {
    return `<p style="color:#9ca3af;font-size:13px;">No tabular data.</p>`;
  }
  const th = columns
    .map(
      (c) =>
        `<th scope="col" style="text-align:left;padding:8px 10px;border-bottom:2px solid #e5e7eb;">${escapeHtml(c)}</th>`,
    )
    .join("");
  const body = rows
    .map((row, ri) => {
      const bg = striped && ri % 2 === 1 ? "background:#f9fafb;" : "";
      const tds = columns
        .map((col) => {
          const raw = row[col];
          const cell = raw === undefined ? "" : String(raw);
          return `<td style="padding:8px 10px;border-bottom:1px solid #f3f4f6;${bg}">${escapeHtml(cell)}</td>`;
        })
        .join("");
      return `<tr>${tds}</tr>`;
    })
    .join("");
  const cap = caption
    ? `<caption style="text-align:left;font-weight:600;margin-bottom:8px;">${escapeHtml(caption)}</caption>`
    : "";
  return `<div class="data-table-wrap" style="overflow-x:auto;margin:16px 0;">
  <table style="width:100%;border-collapse:collapse;font-size:13px;">${cap}
    <thead><tr>${th}</tr></thead>
    <tbody>${body}</tbody>
  </table>
</div>`;
}
