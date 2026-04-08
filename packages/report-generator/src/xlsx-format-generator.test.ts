import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";

import { ExcelXlsxFormatGenerator } from "./xlsx-format-generator";

describe("ExcelXlsxFormatGenerator", () => {
  it("creates a valid xlsx workbook from HTML table input", async () => {
    const gen = new ExcelXlsxFormatGenerator();
    const html =
      "<table><tr><th>Channel</th><th>Leads</th></tr><tr><td>Meta</td><td>42</td></tr></table>";
    const bytes = await gen.generate({
      context: {
        tenantId: "tenant-a",
        reportId: "report-1",
        locale: "en",
        templateId: "executive-summary",
      },
      model: {},
      renderedTemplate: html,
    });

    expect(new TextDecoder("latin1").decode(bytes.subarray(0, 2))).toBe("PK");

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(Buffer.from(bytes));
    const sheet = workbook.getWorksheet("Report");
    expect(sheet).toBeDefined();
    expect(sheet?.getCell("A1").text).toBe("Channel");
    expect(sheet?.getCell("B2").text).toBe("42");
  });
});
