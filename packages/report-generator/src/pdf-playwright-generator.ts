import { chromium, type Browser } from "playwright";

import { DEFAULT_REPORT_PRINT_CSS } from "./pdf-print-styles";
import type { FormatGeneratorInput, IFormatGenerator, ReportGenerationContext } from "./types";

let sharedBrowserPromise: Promise<Browser> | undefined;

/**
 * Closes the shared Chromium instance used by {@link PlaywrightPdfFormatGenerator}.
 * Call from worker shutdown to release file handles and memory.
 */
export async function closeSharedChromiumBrowser(): Promise<void> {
  if (!sharedBrowserPromise) {
    return;
  }
  const b = await sharedBrowserPromise.catch(() => undefined);
  sharedBrowserPromise = undefined;
  if (b) {
    await b.close();
  }
}

function getSharedChromiumBrowser(): Promise<Browser> {
  if (!sharedBrowserPromise) {
    sharedBrowserPromise = chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  }
  return sharedBrowserPromise;
}

function escapePdfTemplateText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function ensureHtmlDocument(fragment: string): string {
  const t = fragment.trim();
  if (/^<!DOCTYPE/i.test(t) || /^<html[\s>]/i.test(t)) {
    return fragment;
  }
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8" /></head><body>${fragment}</body></html>`;
}

function defaultHeaderTemplate(context: ReportGenerationContext): string {
  const title = escapePdfTemplateText(context.templateId);
  return `<div style="font-size:9px;width:100%;padding:0 12mm;color:#333;font-family:system-ui,sans-serif;">
  <span>${title}</span>
</div>`;
}

function defaultFooterTemplate(context: ReportGenerationContext): string {
  const meta = escapePdfTemplateText(`${context.templateId} · ${context.reportId}`);
  return `<div style="font-size:9px;width:100%;text-align:center;color:#555;font-family:system-ui,sans-serif;">
  <span>${meta}</span>
  &nbsp;·&nbsp;
  <span class="pageNumber"></span> / <span class="totalPages"></span>
</div>`;
}

export interface PlaywrightPdfFormatGeneratorOptions {
  /** Paper format passed to Chromium print. */
  readonly format?: "A4" | "Letter" | "Legal";
  readonly printBackground?: boolean;
  readonly displayHeaderFooter?: boolean;
  readonly margin?: {
    readonly top?: string;
    readonly right?: string;
    readonly bottom?: string;
    readonly left?: string;
  };
  /** When true, emit tagged PDF for accessibility (PDF/UA-oriented output from Chromium). */
  readonly tagged?: boolean;
  /** Prefer author @page / CSS size when set. */
  readonly preferCSSPageSize?: boolean;
  /** Slightly reduces output size; 1 = default. */
  readonly scale?: number;
}

/**
 * HTML → PDF via headless Chromium (Playwright). Shared browser across calls.
 */
export class PlaywrightPdfFormatGenerator implements IFormatGenerator {
  readonly format = "pdf" as const;

  constructor(private readonly options: PlaywrightPdfFormatGeneratorOptions = {}) {}

  async generate(input: FormatGeneratorInput): Promise<Uint8Array> {
    const browser = await getSharedChromiumBrowser();
    const page = await browser.newPage();
    try {
      const html = ensureHtmlDocument(input.renderedTemplate);
      await page.setContent(html, { waitUntil: "domcontentloaded" });
      await page.addStyleTag({ content: DEFAULT_REPORT_PRINT_CSS });
      const ctx = input.context;
      const margin = this.options.margin ?? {
        top: "12mm",
        right: "10mm",
        bottom: "14mm",
        left: "10mm",
      };
      const displayHeaderFooter = this.options.displayHeaderFooter ?? true;
      const buf = await page.pdf({
        format: this.options.format ?? "A4",
        printBackground: this.options.printBackground ?? true,
        displayHeaderFooter,
        headerTemplate: displayHeaderFooter ? defaultHeaderTemplate(ctx) : "",
        footerTemplate: displayHeaderFooter ? defaultFooterTemplate(ctx) : "",
        margin,
        tagged: this.options.tagged ?? true,
        preferCSSPageSize: this.options.preferCSSPageSize ?? true,
        scale: this.options.scale ?? 1,
      });
      return new Uint8Array(buf);
    } finally {
      await page.close();
    }
  }
}
