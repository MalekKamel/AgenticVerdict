import { PromptTemplateError } from "./types";
import type { PromptTemplateRecord } from "./types";

const PLACEHOLDER = /\{\{\s*([a-zA-Z][a-zA-Z0-9_]*)\s*\}\}/g;

/**
 * Lists placeholders referenced in a Mustache-style `{{name}}` template body.
 */
export function listTemplatePlaceholders(template: string): string[] {
  const names = new Set<string>();
  for (const m of template.matchAll(PLACEHOLDER)) {
    const name = m[1];
    if (name !== undefined) {
      names.add(name);
    }
  }
  return [...names];
}

/**
 * Renders `{{variable}}` segments after validating that every placeholder in the body is declared
 * and every declared variable has a value in `values`.
 */
export function renderPromptTemplate(
  record: PromptTemplateRecord,
  values: Readonly<Record<string, string>>,
): string {
  const declared = new Set(record.variables);
  const used = listTemplatePlaceholders(record.template);
  for (const name of used) {
    if (!declared.has(name)) {
      throw new PromptTemplateError(
        `Template uses undeclared placeholder "${name}"`,
        "unknown_placeholder",
      );
    }
  }
  for (const name of declared) {
    if (!(name in values)) {
      throw new PromptTemplateError(
        `Missing value for template variable "${name}"`,
        "missing_variable",
      );
    }
  }
  return record.template.replaceAll(PLACEHOLDER, (_m, rawName: string) => values[rawName] ?? "");
}

/**
 * Approximate tokenizer for budgeting: ~4 characters per token for Latin marketing copy.
 * Documented as a heuristic; swap for a provider tokenizer when calibrating production budgets.
 */
export function estimateApproximateTokenCount(text: string): number {
  if (text.length === 0) {
    return 0;
  }
  return Math.max(1, Math.ceil(text.length / 4));
}
