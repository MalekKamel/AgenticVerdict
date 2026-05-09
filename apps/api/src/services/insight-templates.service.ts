import { InsightTemplatesRepository } from "@agenticverdict/database";
import type {
  InsightTemplateSummaryDb,
  InsightTemplateWithRelations,
  ValidationResult,
} from "@agenticverdict/database";
import { SCHEDULE_FREQUENCIES } from "@agenticverdict/types";

/**
 * Applied template configuration returned when a template is applied
 */
export interface AppliedTemplateConfig {
  templateId: string;
  templateName: string;
  name: string;
  description: string;
  domain: string;
  connectorIds: string[];
  aiTemplateId: string | null;
  schedule: { frequency: string; time: number };
  delivery: {
    format: string;
    emailRecipients: string[];
    enableWebhook: boolean;
    webhookUrl: string | null;
  };
}

/**
 * Insight Templates Service
 *
 * Business logic layer for insight template operations.
 * Delegates to InsightTemplatesRepository for all data access.
 * Performs runtime validation against live connector registry at apply time.
 */
export class InsightTemplatesService {
  private repository: InsightTemplatesRepository;

  constructor(repository?: InsightTemplatesRepository) {
    this.repository = repository || new InsightTemplatesRepository();
  }

  /**
   * Allow injecting repository for testing
   */
  static forTest(repository: InsightTemplatesRepository): InsightTemplatesService {
    return new InsightTemplatesService(repository);
  }

  // ==========================================================================
  // Template Operations
  // ==========================================================================

  /**
   * List template summaries visible to a tenant, optionally filtered by domain
   */
  async listTemplates(
    tenantId: string,
    domain?: string,
    locale = "en",
  ): Promise<InsightTemplateSummaryDb[]> {
    return this.repository.findAll(tenantId, domain, locale);
  }

  /**
   * Get full template detail with resolved relations
   */
  async getTemplateDetail(
    tenantId: string,
    id: string,
    locale = "en",
  ): Promise<InsightTemplateWithRelations & { name: string; description: string }> {
    const template = await this.repository.findByIdWithRelations(tenantId, id, locale);
    if (!template) {
      throw new Error("Template not found");
    }
    return template;
  }

  /**
   * Apply a template, returning pre-filled insight configuration.
   * Validates connector/metric mappings against live registry.
   */
  async applyTemplate(tenantId: string, id: string, locale = "en"): Promise<AppliedTemplateConfig> {
    const template = await this.repository.findByIdWithRelations(tenantId, id, locale);
    if (!template) {
      throw new Error("Template not found");
    }

    // Validate connectors at apply time
    const validation = await this.repository.validateConnectors(id);
    if (!validation.valid) {
      throw new Error(
        `Template has invalid connector mappings: ${validation.errors.map((e: { message: string }) => e.message).join("; ")}`,
      );
    }

    // Build applied config from resolved template data
    const primaryDomain = template.domains[0];
    const schedule = template.schedule as { frequency: string; time: number } | undefined;
    const delivery = template.delivery as
      | {
          format: string;
          emailRecipients: string[];
          enableWebhook: boolean;
          webhookUrl: string | null;
        }
      | undefined;

    const validFormats = ["pdf", "excel", "both"] as const;

    const frequency =
      schedule?.frequency &&
      SCHEDULE_FREQUENCIES.includes(schedule.frequency as (typeof SCHEDULE_FREQUENCIES)[number])
        ? (schedule.frequency as (typeof SCHEDULE_FREQUENCIES)[number])
        : "weekly";

    const time =
      typeof schedule?.time === "number" && schedule.time >= 0 && schedule.time <= 23
        ? schedule.time
        : 9;

    const format =
      delivery?.format && validFormats.includes(delivery.format as (typeof validFormats)[number])
        ? (delivery.format as (typeof validFormats)[number])
        : "pdf";

    return {
      templateId: template.id,
      templateName: template.name,
      name: template.name,
      description: template.description || "",
      domain: primaryDomain?.id ?? "",
      connectorIds: template.connectors.map((c: { connectorId: string }) => c.connectorId),
      aiTemplateId: template.aiTemplateId,
      schedule: {
        frequency,
        time,
      },
      delivery: {
        format,
        emailRecipients: Array.isArray(delivery?.emailRecipients) ? delivery.emailRecipients : [],
        enableWebhook: delivery?.enableWebhook === true,
        webhookUrl: delivery?.webhookUrl ?? null,
      },
    };
  }

  /**
   * Validate template connector/metric mappings without applying
   */
  async validateTemplate(tenantId: string, id: string, locale = "en"): Promise<ValidationResult> {
    const template = await this.repository.findById(tenantId, id, locale);
    if (!template) {
      throw new Error("Template not found");
    }

    return this.repository.validateConnectors(id);
  }
}
