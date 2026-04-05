import { escapeHtml } from "./html-utils";
import type { ITemplateEngine, ReportGenerationContext } from "./types";

/**
 * Minimal template engine: returns a stable placeholder until HTML/PDF pipeline lands.
 */
export class PlaceholderTemplateEngine implements ITemplateEngine {
  async render(context: ReportGenerationContext, model: unknown): Promise<string> {
    const summary =
      model !== null && typeof model === "object"
        ? JSON.stringify(model).slice(0, 200)
        : String(model);
    return `<!-- template:${context.templateId} --><pre>${escapeHtml(summary)}</pre>`;
  }
}
