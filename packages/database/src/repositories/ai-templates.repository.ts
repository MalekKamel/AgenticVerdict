import { createDatabaseClient } from "../client";
import {
  aiTemplates,
  templateDeployments,
  templateUsageAnalytics,
  type AiTemplate,
  type NewAiTemplate,
  type TemplateDeployment,
  type NewTemplateDeployment,
  type TemplateUsageAnalytics,
  type NewTemplateUsageAnalytics,
  type AiTemplateStatus,
} from "../schema/ai-templates";
import { and, eq, desc, asc, sql, gte, lte } from "drizzle-orm";

/**
 * AI Templates Repository
 *
 * Handles all database operations for AI template management.
 * Implements versioning support for templates.
 * Enforces tenant isolation at the repository level.
 */

export class AiTemplatesRepository {
  private db: ReturnType<typeof createDatabaseClient>;

  constructor(databaseUrl?: string) {
    this.db = createDatabaseClient(databaseUrl || process.env.DATABASE_URL!, {
      applicationName: "agenticverdict-ai-templates",
    });
  }

  /**
   * Allow injecting database client for testing
   */
  static forTest(db: ReturnType<typeof createDatabaseClient>): AiTemplatesRepository {
    const repo = new AiTemplatesRepository();
    repo.db = db;
    return repo;
  }

  // ==========================================================================
  // Template CRUD
  // ==========================================================================

  /**
   * Find all templates for a tenant
   */
  async findAllByTenant(tenantId: string, status?: AiTemplateStatus): Promise<AiTemplate[]> {
    const conditions = [eq(aiTemplates.tenantId, tenantId)];

    if (status) {
      conditions.push(eq(aiTemplates.status, status));
    }

    return this.db
      .select()
      .from(aiTemplates)
      .where(and(...conditions))
      .orderBy(desc(aiTemplates.createdAt));
  }

  /**
   * Find template by ID with tenant isolation
   */
  async findById(tenantId: string, id: string): Promise<AiTemplate | null> {
    const results = await this.db
      .select()
      .from(aiTemplates)
      .where(and(eq(aiTemplates.tenantId, tenantId), eq(aiTemplates.id, id)))
      .limit(1);

    return results[0] || null;
  }

  /**
   * Find latest version of a template by name
   */
  async findLatestByName(
    tenantId: string,
    name: string,
    domainId?: string,
  ): Promise<AiTemplate | null> {
    const conditions = [
      eq(aiTemplates.tenantId, tenantId),
      eq(aiTemplates.name, name),
      eq(aiTemplates.isLatestVersion, true),
    ];

    if (domainId) {
      conditions.push(eq(aiTemplates.domainId, domainId));
    }

    const results = await this.db
      .select()
      .from(aiTemplates)
      .where(and(...conditions))
      .limit(1);

    return results[0] || null;
  }

  /**
   * Create new template (with versioning)
   */
  async create(data: NewAiTemplate): Promise<AiTemplate> {
    // If creating a new version, mark old version as not latest
    if (data.parentVersionId) {
      await this.db
        .update(aiTemplates)
        .set({ isLatestVersion: false })
        .where(
          and(
            eq(aiTemplates.tenantId, data.tenantId),
            eq(aiTemplates.name, data.name!),
            eq(aiTemplates.isLatestVersion, true),
          ),
        );
    }

    const results = await this.db.insert(aiTemplates).values(data).returning();
    return results[0];
  }

  /**
   * Update template
   */
  async update(
    tenantId: string,
    id: string,
    data: Partial<NewAiTemplate>,
  ): Promise<AiTemplate | null> {
    const results = await this.db
      .update(aiTemplates)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(eq(aiTemplates.tenantId, tenantId), eq(aiTemplates.id, id)))
      .returning();

    return results[0] || null;
  }

  /**
   * Delete template
   */
  async delete(tenantId: string, id: string): Promise<boolean> {
    const results = await this.db
      .delete(aiTemplates)
      .where(and(eq(aiTemplates.tenantId, tenantId), eq(aiTemplates.id, id)))
      .returning({ id: aiTemplates.id });

    return results.length > 0;
  }

  /**
   * Publish template
   */
  async publish(tenantId: string, id: string): Promise<AiTemplate | null> {
    return this.update(tenantId, id, {
      status: "published",
      isLatestVersion: true,
    });
  }

  /**
   * Archive template
   */
  async archive(tenantId: string, id: string): Promise<AiTemplate | null> {
    return this.update(tenantId, id, {
      status: "archived",
      isLatestVersion: false,
    });
  }

  // ==========================================================================
  // Versioning Operations
  // ==========================================================================

  /**
   * Get all versions of a template
   */
  async getVersions(tenantId: string, name: string, domainId?: string): Promise<AiTemplate[]> {
    const conditions = [eq(aiTemplates.tenantId, tenantId), eq(aiTemplates.name, name)];

    if (domainId) {
      conditions.push(eq(aiTemplates.domainId, domainId));
    }

    return this.db
      .select()
      .from(aiTemplates)
      .where(and(...conditions))
      .orderBy(desc(aiTemplates.versionNumber));
  }

  /**
   * Get version history
   */
  async getVersionHistory(tenantId: string, templateId: string): Promise<AiTemplate[]> {
    // Get the template first to find its name
    const template = await this.findById(tenantId, templateId);
    if (!template) {
      return [];
    }

    return this.getVersions(tenantId, template.name, template.domainId || undefined);
  }

  /**
   * Create new version from existing template
   */
  async createNewVersion(
    tenantId: string,
    sourceTemplateId: string,
    content: string,
    variables?: Array<{
      name: string;
      type: string;
      required: boolean;
      defaultValue?: unknown;
      description?: string;
      pattern?: string;
    }>,
  ): Promise<AiTemplate> {
    const source = await this.findById(tenantId, sourceTemplateId);
    if (!source) {
      throw new Error("Template not found");
    }

    // Mark old version as not latest
    await this.db
      .update(aiTemplates)
      .set({ isLatestVersion: false })
      .where(eq(aiTemplates.id, sourceTemplateId));

    // Create new version
    const newVersion = await this.create({
      tenantId: source.tenantId,
      name: source.name,
      description: source.description,
      type: source.type,
      version: this.incrementVersion(source.version),
      content,
      variables: variables || source.variables,
      providerId: source.providerId,
      modelId: source.modelId,
      domainId: source.domainId,
      status: "draft",
      parentVersionId: sourceTemplateId,
      isLatestVersion: true,
      versionNumber: source.versionNumber + 1,
      createdById: source.createdById,
    });

    return newVersion;
  }

  /**
   * Increment semantic version
   */
  private incrementVersion(version: string): string {
    const parts = version.split(".").map(Number);
    parts[2] = (parts[2] || 0) + 1; // Increment patch
    return parts.join(".");
  }

  // ==========================================================================
  // Template Deployments
  // ==========================================================================

  /**
   * Deploy template
   */
  async deployTemplate(data: NewTemplateDeployment): Promise<TemplateDeployment> {
    // Increment deployment count on template
    await this.db
      .update(aiTemplates)
      .set({
        deploymentCount: sql`${aiTemplates.deploymentCount} + 1`,
        lastDeployedAt: new Date(),
      })
      .where(eq(aiTemplates.id, data.templateId));

    const results = await this.db.insert(templateDeployments).values(data).returning();
    return results[0];
  }

  /**
   * Get deployments for template
   */
  async getTemplateDeployments(
    tenantId: string,
    templateId: string,
  ): Promise<TemplateDeployment[]> {
    return this.db
      .select()
      .from(templateDeployments)
      .where(
        and(
          eq(templateDeployments.tenantId, tenantId),
          eq(templateDeployments.templateId, templateId),
        ),
      )
      .orderBy(desc(templateDeployments.createdAt));
  }

  /**
   * Get deployment by target
   */
  async getDeploymentByTarget(
    tenantId: string,
    scope: string,
    targetId: string,
  ): Promise<TemplateDeployment | null> {
    const results = await this.db
      .select()
      .from(templateDeployments)
      .where(
        and(
          eq(templateDeployments.tenantId, tenantId),
          eq(templateDeployments.scope, scope),
          eq(templateDeployments.targetId, targetId),
          eq(templateDeployments.deploymentStatus, "active"),
        ),
      )
      .limit(1);

    return results[0] || null;
  }

  /**
   * Undeploy template
   */
  async undeploy(tenantId: string, deploymentId: string): Promise<TemplateDeployment | null> {
    const results = await this.db
      .update(templateDeployments)
      .set({ deploymentStatus: "inactive", updatedAt: new Date() })
      .where(
        and(eq(templateDeployments.tenantId, tenantId), eq(templateDeployments.id, deploymentId)),
      )
      .returning();

    return results[0] || null;
  }

  // ==========================================================================
  // Usage Analytics
  // ==========================================================================

  /**
   * Record daily usage for template
   */
  async recordUsage(data: NewTemplateUsageAnalytics): Promise<TemplateUsageAnalytics> {
    const results = await this.db
      .insert(templateUsageAnalytics)
      .values(data)
      .onConflictDoUpdate({
        target: [templateUsageAnalytics.templateId, templateUsageAnalytics.usageDate],
        set: {
          executionCount: sql`${templateUsageAnalytics.executionCount} + EXCLUDED.execution_count`,
          successCount: sql`${templateUsageAnalytics.successCount} + EXCLUDED.success_count`,
          failureCount: sql`${templateUsageAnalytics.failureCount} + EXCLUDED.failure_count`,
          totalTokens: sql`${templateUsageAnalytics.totalTokens} + EXCLUDED.total_tokens`,
          totalCostCents: sql`${templateUsageAnalytics.totalCostCents} + EXCLUDED.total_cost_cents`,
          avgExecutionTimeMs: sql`
            ((${templateUsageAnalytics.avgExecutionTimeMs} * ${templateUsageAnalytics.executionCount}) + 
            (EXCLUDED.avg_execution_time_ms * EXCLUDED.execution_count)) / 
            NULLIF(${templateUsageAnalytics.executionCount} + EXCLUDED.execution_count, 0)
          `,
          updatedAt: new Date(),
        },
      })
      .returning();

    return results[0];
  }

  /**
   * Get template usage for date range
   */
  async getUsageForDateRange(
    tenantId: string,
    templateId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<TemplateUsageAnalytics[]> {
    return this.db
      .select()
      .from(templateUsageAnalytics)
      .where(
        and(
          eq(templateUsageAnalytics.tenantId, tenantId),
          eq(templateUsageAnalytics.templateId, templateId),
          gte(templateUsageAnalytics.usageDate, startDate),
          lte(templateUsageAnalytics.usageDate, endDate),
        ),
      )
      .orderBy(asc(templateUsageAnalytics.usageDate));
  }

  /**
   * Get total usage summary for template
   */
  async getTotalUsage(
    tenantId: string,
    templateId: string,
  ): Promise<{
    totalExecutions: number;
    totalSuccesses: number;
    totalFailures: number;
    totalTokens: number;
    totalCostCents: number;
  }> {
    const results = await this.db
      .select({
        totalExecutions: sql<number>`COALESCE(SUM(${templateUsageAnalytics.executionCount}), 0)`,
        totalSuccesses: sql<number>`COALESCE(SUM(${templateUsageAnalytics.successCount}), 0)`,
        totalFailures: sql<number>`COALESCE(SUM(${templateUsageAnalytics.failureCount}), 0)`,
        totalTokens: sql<number>`COALESCE(SUM(${templateUsageAnalytics.totalTokens}), 0)`,
        totalCostCents: sql<number>`COALESCE(SUM(${templateUsageAnalytics.totalCostCents}), 0)`,
      })
      .from(templateUsageAnalytics)
      .where(
        and(
          eq(templateUsageAnalytics.tenantId, tenantId),
          eq(templateUsageAnalytics.templateId, templateId),
        ),
      );

    return results[0];
  }

  // ==========================================================================
  // Query Helpers
  // ==========================================================================

  /**
   * Find published templates by type
   */
  async findPublishedByType(
    tenantId: string,
    type: "prompt" | "configuration" | "workflow",
    domainId?: string,
  ): Promise<AiTemplate[]> {
    const conditions = [
      eq(aiTemplates.tenantId, tenantId),
      eq(aiTemplates.type, type),
      eq(aiTemplates.status, "published"),
    ];

    if (domainId) {
      conditions.push(eq(aiTemplates.domainId, domainId));
    }

    return this.db
      .select()
      .from(aiTemplates)
      .where(and(...conditions))
      .orderBy(desc(aiTemplates.deploymentCount));
  }

  /**
   * Search templates by name
   */
  async searchByName(tenantId: string, query: string): Promise<AiTemplate[]> {
    return this.db
      .select()
      .from(aiTemplates)
      .where(
        and(eq(aiTemplates.tenantId, tenantId), sql`${aiTemplates.name} ILIKE ${`%${query}%`}`),
      )
      .orderBy(desc(aiTemplates.deploymentCount));
  }

  /**
   * Count templates by tenant
   */
  async countByTenant(tenantId: string): Promise<number> {
    const results = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(aiTemplates)
      .where(eq(aiTemplates.tenantId, tenantId));

    return Number(results[0]?.count || 0);
  }
}
