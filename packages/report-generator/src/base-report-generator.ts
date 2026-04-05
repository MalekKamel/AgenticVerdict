import type { FormatGeneratorRegistry } from "./format-registry";
import type {
  FormatGeneratorInput,
  IReportGenerator,
  ITemplateEngine,
  ReportFormat,
  ReportGenerationContext,
} from "./types";

/**
 * Orchestrates template render → format plugin. Subclasses may override hooks for
 * provenance, caching, or multi-step layouts.
 */
export abstract class BaseReportGenerator implements IReportGenerator {
  constructor(
    protected readonly registry: FormatGeneratorRegistry,
    protected readonly templateEngine: ITemplateEngine,
  ) {}

  async generate(
    context: ReportGenerationContext,
    model: unknown,
    format: ReportFormat,
  ): Promise<Uint8Array> {
    const renderedTemplate = await this.resolveRenderedTemplate(context, model);
    const input: FormatGeneratorInput = { context, model, renderedTemplate };
    await this.beforeFormatGenerate(input, format);
    const bytes = await this.registry.get(format).generate(input);
    return this.afterFormatGenerate(bytes, input, format);
  }

  protected async resolveRenderedTemplate(
    context: ReportGenerationContext,
    model: unknown,
  ): Promise<string> {
    return this.templateEngine.render(context, model);
  }

  protected async beforeFormatGenerate(
    input: FormatGeneratorInput,
    format: ReportFormat,
  ): Promise<void> {
    void input;
    void format;
  }

  protected async afterFormatGenerate(
    bytes: Uint8Array,
    input: FormatGeneratorInput,
    format: ReportFormat,
  ): Promise<Uint8Array> {
    void input;
    void format;
    return bytes;
  }
}

export class DefaultReportGenerator extends BaseReportGenerator {}
