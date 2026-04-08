import ExcelJS from "exceljs";
import { parse } from "node-html-parser";

import type { FormatGeneratorInput, IFormatGenerator } from "./types";

/**
 * Minimal HTML-table-to-XLSX generator for report exports.
 * It maps each <table> row/cell to worksheet rows while preserving plain text content.
 */
export class ExcelXlsxFormatGenerator implements IFormatGenerator {
  readonly format = "xlsx" as const;

  async generate(input: FormatGeneratorInput): Promise<Uint8Array> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "AgenticVerdict";
    workbook.created = new Date();
    const worksheet = workbook.addWorksheet("Report");

    const root = parse(input.renderedTemplate);
    const rows = root.querySelectorAll("tr");

    if (rows.length === 0) {
      worksheet.addRow(["Report"]);
      worksheet.addRow([`Tenant: ${input.context.tenantId}`]);
      worksheet.addRow([`Report ID: ${input.context.reportId}`]);
      worksheet.addRow([`Template: ${input.context.templateId}`]);
      worksheet.addRow([root.text.trim() || "No table rows found in rendered template."]);
    } else {
      for (const row of rows) {
        const cells = row.querySelectorAll("th,td");
        const values = cells.map((cell) => cell.text.trim());
        worksheet.addRow(values.length > 0 ? values : [""]);
      }
    }

    // Keep generated sheets readable in spreadsheet viewers.
    worksheet.columns.forEach((column) => {
      column.width = Math.max(16, Math.min(48, (column.width ?? 0) + 2));
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return new Uint8Array(buffer);
  }
}
