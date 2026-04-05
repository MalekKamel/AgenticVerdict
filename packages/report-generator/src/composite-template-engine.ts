import { PlaceholderTemplateEngine } from "./template-engine";
import type { TemplateHtmlOverrideSource } from "./template-override-source";
import type { BaseReportTemplate } from "./templates/base-report-template";
import { createBuiltInTemplateMap } from "./templates/built-in-registry";
import type { ITemplateEngine, ReportGenerationContext } from "./types";

/**
 * Resolves tenant HTML overrides, then built-in {@link BaseReportTemplate} layouts, then {@link PlaceholderTemplateEngine}.
 */
export class CompositeTemplateEngine implements ITemplateEngine {
  private readonly fallback: PlaceholderTemplateEngine;

  constructor(
    private readonly byId: Map<string, BaseReportTemplate>,
    private readonly overrides?: TemplateHtmlOverrideSource,
    fallback?: PlaceholderTemplateEngine,
  ) {
    this.fallback = fallback ?? new PlaceholderTemplateEngine();
  }

  async render(context: ReportGenerationContext, model: unknown): Promise<string> {
    const fromOverride = await this.overrides?.getLatestHtml(context.tenantId, context.templateId);
    if (fromOverride) {
      return fromOverride;
    }
    const builtIn = this.byId.get(context.templateId);
    if (builtIn) {
      return builtIn.renderHtml(context, model);
    }
    return this.fallback.render(context, model);
  }
}

export function createDefaultCompositeTemplateEngine(
  overrides?: TemplateHtmlOverrideSource,
): CompositeTemplateEngine {
  return new CompositeTemplateEngine(createBuiltInTemplateMap(), overrides);
}
