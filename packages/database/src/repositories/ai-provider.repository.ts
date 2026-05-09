import { createDatabaseClient } from "../client";
import {
  aiProviders,
  aiProviderModels,
  type AiProvider,
  type NewAiProvider,
  type AiProviderModel,
  type NewAiProviderModel,
  aiProviderFailover,
  type AiProviderFailover,
  type NewAiProviderFailover,
} from "../schema/ai-providers";
import { eq, and, desc, asc, sql } from "drizzle-orm";
import type { ConfigScope } from "@agenticverdict/types";

/**
 * AI Provider Repository
 *
 * Handles all database operations for AI provider configurations.
 * Enforces tenant isolation at the repository level.
 */

export class AiProviderRepository {
  private db: ReturnType<typeof createDatabaseClient>;

  constructor(databaseUrl?: string) {
    this.db = createDatabaseClient(databaseUrl || process.env.DATABASE_URL!, {
      applicationName: "agenticverdict-ai-providers",
    });
  }

  /**
   * Allow injecting database client for testing
   */
  static forTest(db: ReturnType<typeof createDatabaseClient>): AiProviderRepository {
    const repo = new AiProviderRepository();
    repo.db = db;
    return repo;
  }

  // ==========================================================================
  // Provider Configuration CRUD
  // ==========================================================================

  /**
   * Find all providers for a tenant
   */
  async findAllByTenant(tenantId: string): Promise<AiProvider[]> {
    return this.db
      .select()
      .from(aiProviders)
      .where(eq(aiProviders.tenantId, tenantId))
      .orderBy(desc(aiProviders.priority), asc(aiProviders.providerName));
  }

  /**
   * Find provider by ID with tenant isolation
   */
  async findById(tenantId: string, id: string): Promise<AiProvider | null> {
    const results = await this.db
      .select()
      .from(aiProviders)
      .where(and(eq(aiProviders.tenantId, tenantId), eq(aiProviders.id, id)))
      .limit(1);

    return results[0] || null;
  }

  /**
   * Find provider configuration by scope
   */
  async findByScope(
    tenantId: string,
    scope: ConfigScope,
    parentId?: string,
  ): Promise<AiProvider[]> {
    const conditions = [eq(aiProviders.tenantId, tenantId), eq(aiProviders.scope, scope)];

    if (parentId) {
      conditions.push(eq(aiProviders.parentId, parentId));
    } else {
      conditions.push(sql`${aiProviders.parentId} IS NULL`);
    }

    return this.db
      .select()
      .from(aiProviders)
      .where(and(...conditions))
      .orderBy(desc(aiProviders.priority));
  }

  /**
   * Create new provider configuration
   */
  async create(data: NewAiProvider): Promise<AiProvider> {
    const results = await this.db.insert(aiProviders).values(data).returning();
    return results[0];
  }

  /**
   * Update provider configuration
   */
  async update(
    tenantId: string,
    id: string,
    data: Partial<NewAiProvider>,
  ): Promise<AiProvider | null> {
    const results = await this.db
      .update(aiProviders)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(eq(aiProviders.tenantId, tenantId), eq(aiProviders.id, id)))
      .returning();

    return results[0] || null;
  }

  /**
   * Delete provider configuration
   */
  async delete(tenantId: string, id: string): Promise<boolean> {
    const results = await this.db
      .delete(aiProviders)
      .where(and(eq(aiProviders.tenantId, tenantId), eq(aiProviders.id, id)))
      .returning({ id: aiProviders.id });

    return results.length > 0;
  }

  /**
   * Enable/disable provider
   */
  async toggleEnabled(tenantId: string, id: string, enabled: boolean): Promise<AiProvider | null> {
    return this.update(tenantId, id, { isEnabled: enabled });
  }

  /**
   * Update provider health status
   */
  async updateHealth(
    tenantId: string,
    id: string,
    status: "active" | "inactive" | "error",
    errorMessage?: string,
  ): Promise<AiProvider | null> {
    return this.update(tenantId, id, {
      status,
      healthErrorMessage: errorMessage || null,
      lastHealthCheckAt: new Date(),
    });
  }

  // ==========================================================================
  // Provider Models
  // ==========================================================================

  /**
   * Find all models for a provider
   */
  async findModelsByProvider(providerId: string): Promise<AiProviderModel[]> {
    return this.db
      .select()
      .from(aiProviderModels)
      .where(eq(aiProviderModels.providerId, providerId))
      .orderBy(asc(aiProviderModels.modelName));
  }

  /**
   * Find model by ID
   */
  async findModelById(providerId: string, modelId: string): Promise<AiProviderModel | null> {
    const results = await this.db
      .select()
      .from(aiProviderModels)
      .where(
        and(eq(aiProviderModels.providerId, providerId), eq(aiProviderModels.modelId, modelId)),
      )
      .limit(1);

    return results[0] || null;
  }

  /**
   * Create or update model (upsert)
   */
  async upsertModel(data: NewAiProviderModel): Promise<AiProviderModel> {
    const results = await this.db
      .insert(aiProviderModels)
      .values(data)
      .onConflictDoUpdate({
        target: [aiProviderModels.providerId, aiProviderModels.modelId],
        set: {
          ...data,
          updatedAt: new Date(),
        },
      })
      .returning();

    return results[0];
  }

  /**
   * Delete model
   */
  async deleteModel(providerId: string, modelId: string): Promise<boolean> {
    const results = await this.db
      .delete(aiProviderModels)
      .where(
        and(eq(aiProviderModels.providerId, providerId), eq(aiProviderModels.modelId, modelId)),
      )
      .returning({ id: aiProviderModels.id });

    return results.length > 0;
  }

  // ==========================================================================
  // Failover Configuration
  // ==========================================================================

  /**
   * Find failover config for tenant and primary provider
   */
  async findFailoverConfig(
    tenantId: string,
    primaryProviderId: string,
  ): Promise<AiProviderFailover | null> {
    const results = await this.db
      .select()
      .from(aiProviderFailover)
      .where(
        and(
          eq(aiProviderFailover.tenantId, tenantId),
          eq(aiProviderFailover.primaryProviderId, primaryProviderId),
        ),
      )
      .limit(1);

    return results[0] || null;
  }

  /**
   * Create or update failover configuration
   */
  async upsertFailoverConfig(data: NewAiProviderFailover): Promise<AiProviderFailover> {
    const results = await this.db
      .insert(aiProviderFailover)
      .values(data)
      .onConflictDoUpdate({
        target: [aiProviderFailover.tenantId, aiProviderFailover.primaryProviderId],
        set: {
          ...data,
          updatedAt: new Date(),
        },
      })
      .returning();

    return results[0];
  }

  /**
   * Delete failover configuration
   */
  async deleteFailoverConfig(tenantId: string, primaryProviderId: string): Promise<boolean> {
    const results = await this.db
      .delete(aiProviderFailover)
      .where(
        and(
          eq(aiProviderFailover.tenantId, tenantId),
          eq(aiProviderFailover.primaryProviderId, primaryProviderId),
        ),
      )
      .returning({ id: aiProviderFailover.id });

    return results.length > 0;
  }

  // ==========================================================================
  // Query Helpers
  // ==========================================================================

  /**
   * Get active providers for tenant
   */
  async getActiveProviders(tenantId: string): Promise<AiProvider[]> {
    return this.db
      .select()
      .from(aiProviders)
      .where(
        and(
          eq(aiProviders.tenantId, tenantId),
          eq(aiProviders.isEnabled, true),
          eq(aiProviders.status, "active"),
        ),
      )
      .orderBy(desc(aiProviders.priority));
  }

  /**
   * Count providers by tenant
   */
  async countByTenant(tenantId: string): Promise<number> {
    const results = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(aiProviders)
      .where(eq(aiProviders.tenantId, tenantId));

    return Number(results[0]?.count || 0);
  }
}
