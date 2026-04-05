import type { ReportGenerationContext } from "../types";
import type { TemplateDefinition } from "./template-definition";

/**
 * Built-in report layout. Subclasses declare metadata and produce print-oriented HTML.
 */
export abstract class BaseReportTemplate {
  abstract readonly definition: TemplateDefinition;

  abstract renderHtml(context: ReportGenerationContext, model: unknown): Promise<string>;
}
