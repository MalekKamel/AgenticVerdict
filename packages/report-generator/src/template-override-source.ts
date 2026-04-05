/**
 * Tenant-scoped HTML overrides saved from a template editor or admin UI.
 * When {@link CompositeTemplateEngine} resolves an override, it bypasses built-in layout composition.
 */
export interface TemplateHtmlOverrideSource {
  getLatestHtml(tenantId: string, templateId: string): Promise<string | null>;
}
