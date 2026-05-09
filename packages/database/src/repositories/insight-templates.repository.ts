import { createDatabaseClient } from "../client";
import {
  insightTemplates,
  insightTemplateDomains,
  insightTemplateConnectors,
  businessDomains,
  dataConnectors,
  type InsightTemplateDb,
} from "../schema";
import { resolveLocale } from "../utils/localization";
import { and, eq, isNull, or } from "drizzle-orm";

/**
 * Insight template with resolved domain names
 */
export interface InsightTemplateWithDomains extends InsightTemplateDb {
  domains: { id: string; name: string }[];
}

/**
 * Insight template with resolved connector details
 */
export interface InsightTemplateWithConnectors extends InsightTemplateDb {
  connectors: {
    connectorId: string;
    connectorName: string;
    metrics: string[];
  }[];
}

/**
 * Full insight template with all relations resolved
 */
export interface InsightTemplateWithRelations extends InsightTemplateDb {
  domains: { id: string; name: string }[];
  connectors: {
    connectorId: string;
    connectorName: string;
    metrics: string[];
  }[];
}

/**
 * Template summary for list view
 */
export interface InsightTemplateSummary {
  id: string;
  name: string;
  description: string;
  nameTranslations: Record<string, string>;
  descriptionTranslations: Record<string, string>;
  icon: string;
  domains: { id: string; name: string }[];
  connectorCount: number;
  isActive: boolean;
}

/**
 * Validation result for template connector/metric mappings
 */
export interface ValidationResult {
  valid: boolean;
  errors: {
    connectorId: string;
    metric: string;
    message: string;
  }[];
}

/**
 * Insight Templates Repository
 *
 * Handles all data access for insight template management.
 * Enforces tenant isolation — platform-shared templates (tenant_id IS NULL)
 * are always included in read results alongside tenant-owned templates.
 */
export class InsightTemplatesRepository {
  private db: ReturnType<typeof createDatabaseClient>;

  constructor(databaseUrl?: string) {
    this.db = createDatabaseClient(databaseUrl || process.env.DATABASE_URL!, {
      applicationName: "agenticverdict-insight-templates",
    });
  }

  /**
   * Allow injecting database client for testing
   */
  static forTest(db: ReturnType<typeof createDatabaseClient>): InsightTemplatesRepository {
    const repo = new InsightTemplatesRepository();
    repo.db = db;
    return repo;
  }

  // ==========================================================================
  // Query Operations
  // ==========================================================================

  /**
   * Find all templates visible to a tenant (platform-shared + tenant-owned).
   * Optionally filter by domain name.
   */
  async findAll(
    tenantId: string,
    domain?: string,
    locale = "en",
  ): Promise<InsightTemplateSummary[]> {
    const tenantCondition = or(
      isNull(insightTemplates.tenantId),
      eq(insightTemplates.tenantId, tenantId),
    );

    const baseQuery = this.db
      .select({
        id: insightTemplates.id,
        nameTranslations: insightTemplates.nameTranslations,
        descriptionTranslations: insightTemplates.descriptionTranslations,
        icon: insightTemplates.icon,
        isActive: insightTemplates.isActive,
        domainId: businessDomains.id,
        domainName: businessDomains.name,
        connectorId: insightTemplateConnectors.connectorId,
      })
      .from(insightTemplates)
      .leftJoin(insightTemplateDomains, eq(insightTemplateDomains.templateId, insightTemplates.id))
      .leftJoin(businessDomains, eq(businessDomains.id, insightTemplateDomains.domainId))
      .leftJoin(
        insightTemplateConnectors,
        eq(insightTemplateConnectors.templateId, insightTemplates.id),
      );

    let query = baseQuery.where(and(eq(insightTemplates.isActive, true), tenantCondition));

    if (domain) {
      query = baseQuery.where(
        and(eq(insightTemplates.isActive, true), tenantCondition, eq(businessDomains.name, domain)),
      );
    }

    const rows = await query.orderBy(insightTemplates.id);

    // Aggregate results into summaries
    const templateMap = new Map<
      string,
      {
        id: string;
        nameTranslations: Record<string, string>;
        descriptionTranslations: Record<string, string>;
        icon: string;
        isActive: boolean;
        domains: Map<string, { id: string; name: string }>;
        connectorIds: Set<string>;
      }
    >();

    for (const row of rows) {
      if (!templateMap.has(row.id)) {
        templateMap.set(row.id, {
          id: row.id,
          nameTranslations: (row.nameTranslations as Record<string, string>) || {},
          descriptionTranslations: (row.descriptionTranslations as Record<string, string>) || {},
          icon: row.icon || "",
          isActive: row.isActive,
          domains: new Map(),
          connectorIds: new Set(),
        });
      }
      const template = templateMap.get(row.id)!;
      if (row.domainId && row.domainName) {
        template.domains.set(row.domainId, { id: row.domainId, name: row.domainName });
      }
      if (row.connectorId) {
        template.connectorIds.add(row.connectorId);
      }
    }

    return Array.from(templateMap.values()).map((t) => ({
      id: t.id,
      name: resolveLocale(t.nameTranslations, locale),
      description: resolveLocale(t.descriptionTranslations, locale),
      nameTranslations: t.nameTranslations,
      descriptionTranslations: t.descriptionTranslations,
      icon: t.icon,
      isActive: t.isActive,
      domains: Array.from(t.domains.values()),
      connectorCount: t.connectorIds.size,
    }));
  }

  /**
   * Find template by ID with tenant isolation
   */
  async findById(
    tenantId: string,
    id: string,
    locale = "en",
  ): Promise<(InsightTemplateDb & { name: string; description: string }) | null> {
    const results = await this.db
      .select()
      .from(insightTemplates)
      .where(
        and(
          eq(insightTemplates.id, id),
          or(isNull(insightTemplates.tenantId), eq(insightTemplates.tenantId, tenantId)),
        ),
      )
      .limit(1);

    const template = results[0] || null;
    if (!template) {
      return null;
    }

    return {
      ...template,
      name: resolveLocale(template.nameTranslations as Record<string, string>, locale),
      description: resolveLocale(
        template.descriptionTranslations as Record<string, string>,
        locale,
      ),
    };
  }

  /**
   * Find template by ID with all relations resolved (domains + connectors)
   */
  async findByIdWithRelations(
    tenantId: string,
    id: string,
    locale = "en",
  ): Promise<(InsightTemplateWithRelations & { name: string; description: string }) | null> {
    const template = await this.findById(tenantId, id, locale);
    if (!template) {
      return null;
    }

    // Fetch domains
    const domainRows = await this.db
      .select({
        id: businessDomains.id,
        name: businessDomains.name,
      })
      .from(insightTemplateDomains)
      .innerJoin(businessDomains, eq(businessDomains.id, insightTemplateDomains.domainId))
      .where(eq(insightTemplateDomains.templateId, id));

    // Fetch connectors with details
    const connectorRows = await this.db
      .select({
        connectorId: insightTemplateConnectors.connectorId,
        metrics: insightTemplateConnectors.metrics,
        connectorName: dataConnectors.name,
      })
      .from(insightTemplateConnectors)
      .innerJoin(dataConnectors, eq(dataConnectors.id, insightTemplateConnectors.connectorId))
      .where(eq(insightTemplateConnectors.templateId, id));

    return {
      ...template,
      domains: domainRows,
      connectors: connectorRows.map((r) => ({
        connectorId: r.connectorId,
        connectorName: r.connectorName,
        metrics: r.metrics || [],
      })),
    };
  }

  /**
   * Validate template's connector/metric mappings against live data_connectors
   */
  async validateConnectors(templateId: string): Promise<ValidationResult> {
    const connectorRows = await this.db
      .select({
        connectorId: insightTemplateConnectors.connectorId,
        metrics: insightTemplateConnectors.metrics,
      })
      .from(insightTemplateConnectors)
      .where(eq(insightTemplateConnectors.templateId, templateId));

    if (connectorRows.length === 0) {
      return { valid: true, errors: [] };
    }

    const errors: ValidationResult["errors"] = [];

    for (const row of connectorRows) {
      // Check connector exists in data_connectors registry
      const connector = await this.db
        .select({ id: dataConnectors.id })
        .from(dataConnectors)
        .where(eq(dataConnectors.id, row.connectorId))
        .limit(1);

      if (connector.length === 0) {
        errors.push({
          connectorId: row.connectorId,
          metric: "*",
          message: `Connector '${row.connectorId}' not found in registry`,
        });
      }
    }

    return { valid: errors.length === 0, errors };
  }
}
