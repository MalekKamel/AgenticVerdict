import { REPORT_FORMATS } from "@agenticverdict/types";
import type { ReportFormat, TextDirection } from "@agenticverdict/types";

export { REPORT_FORMATS, type ReportFormat };

export interface ReportGenerationContext {
  tenantId: string;
  reportId: string;
  locale: string;
  templateId: string;
  /** When set, overrides locale-derived direction for the HTML document root. */
  textDirection?: TextDirection | undefined;
}

export interface FormatGeneratorInput {
  context: ReportGenerationContext;
  model: unknown;
  /** HTML or other intermediate produced by the template engine (Phase 03+). */
  renderedTemplate: string;
}

export interface IFormatGenerator {
  readonly format: ReportFormat;
  generate(input: FormatGeneratorInput): Promise<Uint8Array>;
}

export interface IReportGenerator {
  generate(
    context: ReportGenerationContext,
    model: unknown,
    format: ReportFormat,
  ): Promise<Uint8Array>;
}

export interface ITemplateEngine {
  render(context: ReportGenerationContext, model: unknown): Promise<string>;
}
