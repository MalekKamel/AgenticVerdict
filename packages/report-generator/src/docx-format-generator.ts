import { packDocxFromHtml } from "./html-to-docx";
import type { FormatGeneratorInput, IFormatGenerator } from "./types";

/**
 * HTML → DOCX via structured conversion (docx package). Optional TOC when the
 * HTML contains `#report-docx-toc` or `[data-report-docx-toc]`.
 */
export class HtmlDocxFormatGenerator implements IFormatGenerator {
  readonly format = "docx" as const;

  async generate(input: FormatGeneratorInput): Promise<Uint8Array> {
    return packDocxFromHtml(input.renderedTemplate, input.context);
  }
}
