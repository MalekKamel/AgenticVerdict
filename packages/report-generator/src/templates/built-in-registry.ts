import type { BaseReportTemplate } from "./base-report-template";
import { DetailedAnalysisTemplate } from "./built-in/detailed-analysis-template";
import { ExecutiveSummaryTemplate } from "./built-in/executive-summary-template";
import { TechnicalAppendixTemplate } from "./built-in/technical-appendix-template";
import type { TemplateDefinition } from "./template-definition";

function instantiateBuiltIns(): BaseReportTemplate[] {
  return [
    new ExecutiveSummaryTemplate(),
    new DetailedAnalysisTemplate(),
    new TechnicalAppendixTemplate(),
  ];
}

export function createBuiltInTemplateMap(): Map<string, BaseReportTemplate> {
  const m = new Map<string, BaseReportTemplate>();
  for (const t of instantiateBuiltIns()) {
    m.set(t.definition.id, t);
  }
  return m;
}

export function getBuiltInTemplateCatalog(): TemplateDefinition[] {
  return instantiateBuiltIns().map((t) => t.definition);
}
