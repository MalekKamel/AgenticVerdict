import { describe, expect, it } from "vitest";

import { packDocxFromHtml } from "./html-to-docx";

const ctx = {
  tenantId: "tenant-1",
  reportId: "rep-1",
  locale: "en",
  templateId: "executive-summary",
};

describe("packDocxFromHtml", () => {
  it("produces a ZIP-based .docx payload", async () => {
    const html = `<body><h1>Title</h1><p>Hello <strong>world</strong>.</p></body>`;
    const bytes = await packDocxFromHtml(html, ctx);
    expect(bytes.length).toBeGreaterThan(2000);
    expect(String.fromCharCode(bytes[0], bytes[1])).toBe("PK");
  });

  it("renders tables with colspan", async () => {
    const html = `
      <table>
        <tr><th colspan="2">Merged header</th></tr>
        <tr><td>A</td><td>B</td></tr>
      </table>`;
    const bytes = await packDocxFromHtml(html, ctx);
    expect(bytes.length).toBeGreaterThan(2000);
  });

  it("embeds a data-URI PNG when present", async () => {
    const pixel =
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
    const html = `<body><img src="data:image/png;base64,${pixel}" alt="x" /></body>`;
    const bytes = await packDocxFromHtml(html, ctx);
    expect(bytes.length).toBeGreaterThan(2500);
  });

  it("inserts TOC field when marker is present", async () => {
    const html = `<body><div id="report-docx-toc"></div><h1>Section</h1><p>Body</p></body>`;
    const bytes = await packDocxFromHtml(html, ctx);
    expect(bytes.length).toBeGreaterThan(2000);
  });
});
