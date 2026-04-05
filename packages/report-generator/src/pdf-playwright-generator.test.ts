import { describe, expect, it } from "vitest";

import {
  closeSharedChromiumBrowser,
  ensureHtmlDocument,
  PlaywrightPdfFormatGenerator,
} from "./pdf-playwright-generator";

describe("ensureHtmlDocument", () => {
  it("wraps fragments in a full HTML document", () => {
    const out = ensureHtmlDocument("<p>Hi</p>");
    expect(out).toContain("<!DOCTYPE html>");
    expect(out).toContain("<p>Hi</p>");
  });

  it("preserves full documents", () => {
    const doc = "<!DOCTYPE html><html><body>x</body></html>";
    expect(ensureHtmlDocument(doc)).toBe(doc);
  });
});

const skipPlaywrightPdf = process.env.SKIP_PLAYWRIGHT_PDF_TESTS === "1";

describe.skipIf(skipPlaywrightPdf)("PlaywrightPdfFormatGenerator", () => {
  it("emits a PDF with %PDF header and reasonable size", async () => {
    const gen = new PlaywrightPdfFormatGenerator({ tagged: true });
    const bytes = await gen.generate({
      context: {
        tenantId: "t",
        reportId: "r",
        locale: "en",
        templateId: "test-template",
      },
      model: {},
      renderedTemplate: `<main class="report-two-column"><h1>Report</h1><p>Paragraph one.</p><p>Paragraph two.</p></main>`,
    });
    expect(new TextDecoder("latin1").decode(bytes.subarray(0, 4))).toBe("%PDF");
    expect(bytes.length).toBeGreaterThan(500);
    await closeSharedChromiumBrowser();
  });
});
