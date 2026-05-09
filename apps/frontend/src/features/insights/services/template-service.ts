/**
 * Template Service
 *
 * Encapsulates all template logic, decoupling components from direct tRPC calls.
 * Handles data transformation, derived computations, and template state tracking.
 */

import type { InsightTemplate, InsightTemplateSummary } from "@agenticverdict/types";
import { trpcClient } from "@/lib/api/trpc-client";

/**
 * Template service class — use singleton `templateService` export.
 */
export class TemplateService {
  /**
   * Fetch template list imperatively (for non-React contexts)
   */
  async listTemplates(domain?: string): Promise<InsightTemplateSummary[]> {
    return trpcClient.insightTemplates.list.query({ domain });
  }

  /**
   * Fetch template detail imperatively
   */
  async getTemplateDetail(id: string): Promise<InsightTemplate> {
    return trpcClient.insightTemplates.detail.query({ id });
  }

  /**
   * Apply a template imperatively
   */
  async applyTemplate(id: string) {
    return trpcClient.insightTemplates.applyTemplate.mutate({ id });
  }

  /**
   * Validate a template imperatively
   */
  async validateTemplate(id: string) {
    return trpcClient.insightTemplates.validate.mutate({ id });
  }

  /**
   * Extract unique domains from a template list
   */
  getAvailableDomains(templates: InsightTemplateSummary[]): string[] {
    const domainSet = new Set<string>();
    for (const template of templates) {
      for (const domain of template.domains) {
        domainSet.add(domain.name);
      }
    }
    return Array.from(domainSet).sort();
  }

  /**
   * Filter templates by domain name
   */
  getTemplatesByDomain(
    templates: InsightTemplateSummary[],
    domain: string,
  ): InsightTemplateSummary[] {
    return templates.filter((t) => t.domains.some((d) => d.name === domain));
  }

  /**
   * Check if a template is already applied to existing insights
   */
  isTemplateApplied(templateId: string, templateIds: (string | null | undefined)[]): boolean {
    return templateIds.includes(templateId);
  }

  /**
   * Resolve a template's display name with locale fallback chain
   */
  resolveTemplateName(
    template: { nameTranslations: Record<string, string>; name: string },
    locale: string,
  ): string {
    if (template.nameTranslations?.[locale]) return template.nameTranslations[locale];
    if (template.nameTranslations?.["en"]) return template.nameTranslations["en"];
    const firstAvailable = Object.values(template.nameTranslations || {})[0];
    if (firstAvailable) return firstAvailable;
    return template.name;
  }

  /**
   * Resolve a template's display description with locale fallback chain
   */
  resolveTemplateDescription(
    template: { descriptionTranslations: Record<string, string>; description: string },
    locale: string,
  ): string {
    if (template.descriptionTranslations?.[locale]) return template.descriptionTranslations[locale];
    if (template.descriptionTranslations?.["en"]) return template.descriptionTranslations["en"];
    const firstAvailable = Object.values(template.descriptionTranslations || {})[0];
    if (firstAvailable) return firstAvailable;
    return template.description;
  }
}

/**
 * Singleton instance for use in React components
 */
export const templateService = new TemplateService();
