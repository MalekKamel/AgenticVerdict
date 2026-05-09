import ExcelJS from "exceljs";
import { parse } from "node-html-parser";

import { getReportStrings } from "./i18n/report-strings";
import type { FormatGeneratorInput, IFormatGenerator } from "./types";

export interface XlsxSheetData {
  name: string;
  rows: Array<Record<string, unknown>>;
}

export interface XlsxStructuredInput {
  summary?: {
    insightName?: string;
    dateRange?: { start: string; end: string };
    keyMetrics?: Array<{ label: string; value: string | number }>;
    tenantInfo?: Record<string, string>;
  };
  metrics?: Array<{
    connector: string;
    rows: Array<Record<string, unknown>>;
  }>;
  aiInsights?: Array<{
    title: string;
    description: string;
    type?: string;
    confidence?: number;
    timestamp?: string;
  }>;
}

/**
 * Multi-sheet HTML-table-to-XLSX generator for report exports.
 * Supports both HTML parsing and structured data input paths.
 */
export class ExcelXlsxFormatGenerator implements IFormatGenerator {
  readonly format = "xlsx" as const;

  async generate(input: FormatGeneratorInput): Promise<Uint8Array> {
    const structuredData = this.extractStructuredData(input.model);

    if (structuredData) {
      return this.generateFromStructuredData(input, structuredData);
    }

    return this.generateFromHtml(input);
  }

  private async generateFromHtml(input: FormatGeneratorInput): Promise<Uint8Array> {
    const workbook = new ExcelJS.Workbook();
    const t = getReportStrings(input.context.locale ?? "en");
    workbook.creator = "AgenticVerdict";
    workbook.created = new Date();
    const worksheet = workbook.addWorksheet(t.xlsxReport);

    const root = parse(input.renderedTemplate);
    const rows = root.querySelectorAll("tr");

    if (rows.length === 0) {
      worksheet.addRow([t.xlsxReport]);
      worksheet.addRow([`${t.xlsxTenantId}: ${input.context.tenantId}`]);
      worksheet.addRow([`${t.xlsxReportId}: ${input.context.reportId}`]);
      worksheet.addRow([`${t.xlsxTemplate}: ${input.context.templateId}`]);
      worksheet.addRow([t.xlsxNoTableRows]);
    } else {
      for (const row of rows) {
        const cells = row.querySelectorAll("th,td");
        const values = cells.map((cell) => cell.text.trim());
        worksheet.addRow(values.length > 0 ? values : [""]);
      }
    }

    worksheet.columns.forEach((column) => {
      column.width = Math.max(16, Math.min(48, (column.width ?? 0) + 2));
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return new Uint8Array(buffer);
  }

  private async generateFromStructuredData(
    input: FormatGeneratorInput,
    structured: XlsxStructuredInput,
  ): Promise<Uint8Array> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "AgenticVerdict";
    workbook.created = new Date();

    this.applyBranding(workbook, input.context);

    if (structured.summary) {
      this.createSummarySheet(workbook, structured.summary, input.context);
    }

    if (structured.metrics && structured.metrics.length > 0) {
      this.createMetricsSheets(workbook, structured.metrics);
    }

    if (structured.aiInsights && structured.aiInsights.length > 0) {
      this.createAiInsightsSheet(workbook, structured.aiInsights);
    }

    if (!workbook.worksheets.length) {
      const t = getReportStrings(input.context.locale ?? "en");
      const ws = workbook.addWorksheet(t.xlsxReport);
      ws.addRow([`${t.xlsxTenantId}: ${input.context.tenantId}`]);
      ws.addRow([`${t.xlsxReportId}: ${input.context.reportId}`]);
    }

    workbook.eachSheet((worksheet) => {
      worksheet.columns.forEach((column) => {
        column.width = Math.max(16, Math.min(48, (column.width ?? 0) + 2));
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return new Uint8Array(buffer);
  }

  private createSummarySheet(
    workbook: ExcelJS.Workbook,
    summary: NonNullable<XlsxStructuredInput["summary"]>,
    context: FormatGeneratorInput["context"],
  ): void {
    const t = getReportStrings(context.locale ?? "en");
    const ws = workbook.addWorksheet(t.xlsxReportSummary);

    const headerStyle: Partial<ExcelJS.Style> = {
      font: { bold: true, size: 14 },
      alignment: { vertical: "middle" },
    };

    const labelStyle: Partial<ExcelJS.Style> = {
      font: { bold: true },
    };

    void headerStyle;
    void labelStyle;

    ws.addRow([t.xlsxReportSummary]);
    ws.mergeCells("A1:B1");
    ws.getRow(1).font = { bold: true, size: 14 };

    ws.addRow([]);

    if (summary.insightName) {
      ws.addRow([t.xlsxInsight, summary.insightName]);
      ws.getRow(ws.rowCount).getCell("A").font = { bold: true };
    }

    if (summary.dateRange) {
      ws.addRow([t.xlsxDateRange, `${summary.dateRange.start} — ${summary.dateRange.end}`]);
      ws.getRow(ws.rowCount).getCell("A").font = { bold: true };
    }

    ws.addRow([t.xlsxTenantId, context.tenantId]);
    ws.getRow(ws.rowCount).getCell("A").font = { bold: true };

    ws.addRow([t.xlsxReportId, context.reportId]);
    ws.getRow(ws.rowCount).getCell("A").font = { bold: true };

    ws.addRow([t.xlsxTemplate, context.templateId]);
    ws.getRow(ws.rowCount).getCell("A").font = { bold: true };

    ws.addRow([]);

    if (summary.keyMetrics && summary.keyMetrics.length > 0) {
      ws.addRow([t.xlsxKeyMetrics]);
      const rowNum = ws.rowCount;
      ws.mergeCells(`A${rowNum}:B${rowNum}`);
      ws.getRow(rowNum).font = { bold: true, size: 12 };

      for (const metric of summary.keyMetrics) {
        ws.addRow([metric.label, metric.value]);
        ws.getRow(ws.rowCount).getCell("A").font = { bold: true };
      }
    }

    if (summary.tenantInfo) {
      ws.addRow([]);
      ws.addRow([t.xlsxTenantInfo]);
      ws.getRow(ws.rowCount).font = { bold: true, size: 12 };

      for (const [key, value] of Object.entries(summary.tenantInfo)) {
        ws.addRow([key, value]);
        ws.getRow(ws.rowCount).getCell("A").font = { bold: true };
      }
    }

    ws.columns = [
      { key: "label", width: 30 },
      { key: "value", width: 50 },
    ];
  }

  private createMetricsSheets(
    workbook: ExcelJS.Workbook,
    metrics: NonNullable<XlsxStructuredInput["metrics"]>,
  ): void {
    const t = getReportStrings("en");
    for (const connectorMetrics of metrics) {
      const ws = workbook.addWorksheet(this.sanitizeSheetName(connectorMetrics.connector));

      if (connectorMetrics.rows.length === 0) {
        ws.addRow([t.xlsxNoData]);
        continue;
      }

      const headers = Object.keys(connectorMetrics.rows[0]);
      ws.addRow(headers);
      ws.getRow(1).font = { bold: true };

      for (const row of connectorMetrics.rows) {
        ws.addRow(headers.map((h) => row[h] ?? ""));
      }

      ws.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: 1, column: headers.length },
      };
    }
  }

  private createAiInsightsSheet(
    workbook: ExcelJS.Workbook,
    insights: NonNullable<XlsxStructuredInput["aiInsights"]>,
  ): void {
    const t = getReportStrings("en");
    const ws = workbook.addWorksheet(t.xlsxAiInsights);

    const headers = [t.xlsxTitle, t.xlsxType, t.xlsxConfidence, t.xlsxDescription, t.xlsxTimestamp];
    ws.addRow(headers);
    ws.getRow(1).font = { bold: true };

    for (const insight of insights) {
      ws.addRow([
        insight.title,
        insight.type ?? "",
        insight.confidence != null ? `${Math.round(insight.confidence * 100)}%` : "",
        insight.description,
        insight.timestamp ?? "",
      ]);
    }

    ws.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: headers.length },
    };
  }

  private applyBranding(
    workbook: ExcelJS.Workbook,
    context: FormatGeneratorInput["context"],
  ): void {
    const branding = (context as unknown as Record<string, unknown>).branding as
      | { primaryColor?: string; secondaryColor?: string }
      | undefined;

    if (branding?.primaryColor) {
      workbook.views = [
        {
          x: 0,
          y: 0,
          width: 10000,
          height: 20000,
          firstSheet: 0,
          activeTab: 0,
          visibility: "visible",
        },
      ];
    }
  }

  private extractStructuredData(model: unknown): XlsxStructuredInput | null {
    if (!model || typeof model !== "object") {
      return null;
    }

    const obj = model as Record<string, unknown>;
    const hasStructuredData =
      obj.summary !== undefined || obj.metrics !== undefined || obj.aiInsights !== undefined;

    if (!hasStructuredData) {
      return null;
    }

    return {
      summary: obj.summary as XlsxStructuredInput["summary"],
      metrics: obj.metrics as XlsxStructuredInput["metrics"],
      aiInsights: obj.aiInsights as XlsxStructuredInput["aiInsights"],
    };
  }

  private sanitizeSheetName(name: string): string {
    const sanitized = name.replace(/[[\]*/\\?:]/g, "");
    return sanitized.slice(0, 31);
  }
}
