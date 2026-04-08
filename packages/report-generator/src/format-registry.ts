import { HtmlDocxFormatGenerator } from "./docx-format-generator";
import { HtmlFormatGenerator } from "./html-format-generator";
import { JsonFormatGenerator } from "./json-format-generator";
import { PlaywrightPdfFormatGenerator } from "./pdf-playwright-generator";
import type { FormatGeneratorInput, IFormatGenerator, ReportFormat } from "./types";
import { ExcelXlsxFormatGenerator } from "./xlsx-format-generator";

/** Deterministic stub output for fast tests and environments without Chromium. */
export class StubFormatGenerator implements IFormatGenerator {
  constructor(readonly format: ReportFormat) {}

  async generate(input: FormatGeneratorInput): Promise<Uint8Array> {
    const payload = [
      `format=${this.format}`,
      `tenant=${input.context.tenantId}`,
      `report=${input.context.reportId}`,
      `template=${input.context.templateId}`,
      `renderedBytes=${input.renderedTemplate.length}`,
    ].join("\n");
    return new TextEncoder().encode(payload);
  }
}

export class FormatGeneratorRegistry {
  private readonly byFormat = new Map<ReportFormat, IFormatGenerator>();

  register(generator: IFormatGenerator): void {
    this.byFormat.set(generator.format, generator);
  }

  get(format: ReportFormat): IFormatGenerator {
    const g = this.byFormat.get(format);
    if (!g) {
      throw new Error(`No format generator registered for: ${format}`);
    }
    return g;
  }

  registeredFormats(): ReportFormat[] {
    return [...this.byFormat.keys()];
  }
}

/** Stubs for all binary formats (unit tests, CI without Playwright browsers). */
export function createStubFormatRegistry(): FormatGeneratorRegistry {
  const r = new FormatGeneratorRegistry();
  r.register(new StubFormatGenerator("pdf"));
  r.register(new StubFormatGenerator("docx"));
  r.register(new StubFormatGenerator("xlsx"));
  r.register(new StubFormatGenerator("html"));
  r.register(new StubFormatGenerator("json"));
  return r;
}

/**
 * Production registry: PDF (Playwright/Chromium), DOCX (html → docx), XLSX (ExcelJS).
 * Set `AGENTICVERDICT_USE_STUB_FORMAT_GENERATORS=1` to use {@link createStubFormatRegistry} instead.
 */
export function createDefaultFormatRegistry(): FormatGeneratorRegistry {
  if (process.env.AGENTICVERDICT_USE_STUB_FORMAT_GENERATORS === "1") {
    return createStubFormatRegistry();
  }
  const r = new FormatGeneratorRegistry();
  r.register(new PlaywrightPdfFormatGenerator());
  r.register(new HtmlDocxFormatGenerator());
  r.register(new ExcelXlsxFormatGenerator());
  r.register(new HtmlFormatGenerator());
  r.register(new JsonFormatGenerator());
  return r;
}
