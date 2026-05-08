import { createDatabaseClient } from "../client";
import {
  aiUsageReports,
  aiUsageAggregationDaily,
  type AiUsageReport,
  type NewAiUsageReport,
  type AiUsageAggregationDaily,
  type NewAiUsageAggregationDaily,
} from "../schema/ai-usage_reports";
import { and, eq, sql, gte, lte, desc } from "drizzle-orm";

/**
 * AI Usage Repository
 *
 * Handles all database operations for AI usage tracking.
 * Implements atomic upserts to prevent race conditions.
 * Enforces tenant isolation at the repository level.
 */

export class AiUsageRepository {
  private db: ReturnType<typeof createDatabaseClient>;

  constructor(databaseUrl?: string) {
    this.db = createDatabaseClient(databaseUrl || process.env.DATABASE_URL!, {
      applicationName: "agenticverdict-ai-usage",
    });
  }

  /**
   * Allow injecting database client for testing
   */
  static forTest(db: ReturnType<typeof createDatabaseClient>): AiUsageRepository {
    const repo = new AiUsageRepository();
    repo.db = db;
    return repo;
  }

  // ==========================================================================
  // Usage Reports - Atomic Upsert (Critical for Race Condition Prevention)
  // ==========================================================================

  /**
   * Atomically upsert a usage report
   * Uses PostgreSQL's ON CONFLICT DO UPDATE to prevent race conditions
   */
  async atomicUpsert(data: NewAiUsageReport): Promise<AiUsageReport> {
    const results = await this.db
      .insert(aiUsageReports)
      .values({
        ...data,
        createdAt: new Date(),
      })
      .onConflictDoUpdate({
        target: aiUsageReports.requestId,
        set: {
          ...data,
        },
      })
      .returning();

    return results[0];
  }

  /**
   * Batch atomic upsert for multiple usage reports
   */
  async atomicUpsertBatch(dataArray: NewAiUsageReport[]): Promise<AiUsageReport[]> {
    if (dataArray.length === 0) {
      return [];
    }

    const results: AiUsageReport[] = [];

    // Process in batches of 100 to avoid overwhelming the database
    const batchSize = 100;
    for (let i = 0; i < dataArray.length; i += batchSize) {
      const batch = dataArray.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map((data) => this.atomicUpsert(data)));
      results.push(...batchResults);
    }

    return results;
  }

  // ==========================================================================
  // Usage Reports - Query Operations
  // ==========================================================================

  /**
   * Find usage reports by tenant and date range
   */
  async findByTenantAndDateRange(
    tenantId: string,
    startDate: Date,
    endDate: Date,
    limit = 1000,
  ): Promise<AiUsageReport[]> {
    return this.db
      .select()
      .from(aiUsageReports)
      .where(
        and(
          eq(aiUsageReports.tenantId, tenantId),
          gte(aiUsageReports.timestamp, startDate),
          lte(aiUsageReports.timestamp, endDate),
        ),
      )
      .orderBy(desc(aiUsageReports.timestamp))
      .limit(limit);
  }

  /**
   * Find usage by provider
   */
  async findByProvider(
    tenantId: string,
    providerId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<AiUsageReport[]> {
    return this.db
      .select()
      .from(aiUsageReports)
      .where(
        and(
          eq(aiUsageReports.tenantId, tenantId),
          eq(aiUsageReports.providerId, providerId),
          gte(aiUsageReports.timestamp, startDate),
          lte(aiUsageReports.timestamp, endDate),
        ),
      )
      .orderBy(desc(aiUsageReports.timestamp));
  }

  /**
   * Find usage by domain
   */
  async findByDomain(
    tenantId: string,
    domainId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<AiUsageReport[]> {
    return this.db
      .select()
      .from(aiUsageReports)
      .where(
        and(
          eq(aiUsageReports.tenantId, tenantId),
          eq(aiUsageReports.domainId, domainId),
          gte(aiUsageReports.timestamp, startDate),
          lte(aiUsageReports.timestamp, endDate),
        ),
      )
      .orderBy(desc(aiUsageReports.timestamp));
  }

  /**
   * Find failed requests
   */
  async findFailedRequests(
    tenantId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<AiUsageReport[]> {
    return this.db
      .select()
      .from(aiUsageReports)
      .where(
        and(
          eq(aiUsageReports.tenantId, tenantId),
          eq(aiUsageReports.success, false),
          gte(aiUsageReports.timestamp, startDate),
          lte(aiUsageReports.timestamp, endDate),
        ),
      )
      .orderBy(desc(aiUsageReports.timestamp));
  }

  /**
   * Find failover requests
   */
  async findFailoverRequests(
    tenantId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<AiUsageReport[]> {
    return this.db
      .select()
      .from(aiUsageReports)
      .where(
        and(
          eq(aiUsageReports.tenantId, tenantId),
          eq(aiUsageReports.wasFailover, true),
          gte(aiUsageReports.timestamp, startDate),
          lte(aiUsageReports.timestamp, endDate),
        ),
      )
      .orderBy(desc(aiUsageReports.timestamp));
  }

  // ==========================================================================
  // Aggregation Operations
  // ==========================================================================

  /**
   * Get usage summary for tenant and date range
   */
  async getUsageSummary(
    tenantId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{
    totalPromptTokens: number;
    totalCompletionTokens: number;
    totalTokens: number;
    totalCostCents: number;
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    avgLatencyMs: number;
  }> {
    const results = await this.db
      .select({
        totalPromptTokens: sql<number>`COALESCE(SUM(${aiUsageReports.promptTokens}), 0)`,
        totalCompletionTokens: sql<number>`COALESCE(SUM(${aiUsageReports.completionTokens}), 0)`,
        totalTokens: sql<number>`COALESCE(SUM(${aiUsageReports.totalTokens}), 0)`,
        totalCostCents: sql<number>`COALESCE(SUM(${aiUsageReports.costCents}), 0)`,
        totalRequests: sql<number>`COUNT(*)`,
        successfulRequests: sql<number>`COUNT(*) FILTER (WHERE ${aiUsageReports.success} = true)`,
        failedRequests: sql<number>`COUNT(*) FILTER (WHERE ${aiUsageReports.success} = false)`,
        avgLatencyMs: sql<number>`COALESCE(AVG(${aiUsageReports.latencyMs}), 0)`,
      })
      .from(aiUsageReports)
      .where(
        and(
          eq(aiUsageReports.tenantId, tenantId),
          gte(aiUsageReports.timestamp, startDate),
          lte(aiUsageReports.timestamp, endDate),
        ),
      );

    return results[0];
  }

  /**
   * Get usage breakdown by provider
   */
  async getUsageByProvider(
    tenantId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<
    Array<{
      providerId: string;
      totalTokens: number;
      totalCostCents: number;
      requestCount: number;
    }>
  > {
    return this.db
      .select({
        providerId: aiUsageReports.providerId,
        totalTokens: sql<number>`COALESCE(SUM(${aiUsageReports.totalTokens}), 0)`,
        totalCostCents: sql<number>`COALESCE(SUM(${aiUsageReports.costCents}), 0)`,
        requestCount: sql<number>`COUNT(*)`,
      })
      .from(aiUsageReports)
      .where(
        and(
          eq(aiUsageReports.tenantId, tenantId),
          gte(aiUsageReports.timestamp, startDate),
          lte(aiUsageReports.timestamp, endDate),
        ),
      )
      .groupBy(aiUsageReports.providerId)
      .orderBy(desc(sql`total_cost_cents`));
  }

  /**
   * Get usage breakdown by domain
   */
  async getUsageByDomain(
    tenantId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<
    Array<{
      domainId: string | null;
      totalTokens: number;
      totalCostCents: number;
      requestCount: number;
    }>
  > {
    return this.db
      .select({
        domainId: aiUsageReports.domainId,
        totalTokens: sql<number>`COALESCE(SUM(${aiUsageReports.totalTokens}), 0)`,
        totalCostCents: sql<number>`COALESCE(SUM(${aiUsageReports.costCents}), 0)`,
        requestCount: sql<number>`COUNT(*)`,
      })
      .from(aiUsageReports)
      .where(
        and(
          eq(aiUsageReports.tenantId, tenantId),
          gte(aiUsageReports.timestamp, startDate),
          lte(aiUsageReports.timestamp, endDate),
        ),
      )
      .groupBy(aiUsageReports.domainId)
      .orderBy(desc(sql`total_cost_cents`));
  }

  // ==========================================================================
  // Daily Aggregation
  // ==========================================================================

  /**
   * Upsert daily aggregation (atomic)
   */
  async upsertDailyAggregation(data: NewAiUsageAggregationDaily): Promise<AiUsageAggregationDaily> {
    const results = await this.db
      .insert(aiUsageAggregationDaily)
      .values(data)
      .onConflictDoUpdate({
        target: [
          aiUsageAggregationDaily.tenantId,
          aiUsageAggregationDaily.usageDate,
          aiUsageAggregationDaily.providerId,
          aiUsageAggregationDaily.modelId,
        ],
        set: {
          totalPromptTokens: sql`${aiUsageAggregationDaily.totalPromptTokens} + EXCLUDED.total_prompt_tokens`,
          totalCompletionTokens: sql`${aiUsageAggregationDaily.totalCompletionTokens} + EXCLUDED.total_completion_tokens`,
          totalTokens: sql`${aiUsageAggregationDaily.totalTokens} + EXCLUDED.total_tokens`,
          totalCostCents: sql`${aiUsageAggregationDaily.totalCostCents} + EXCLUDED.total_cost_cents`,
          totalRequests: sql`${aiUsageAggregationDaily.totalRequests} + EXCLUDED.total_requests`,
          successfulRequests: sql`${aiUsageAggregationDaily.successfulRequests} + EXCLUDED.successful_requests`,
          failedRequests: sql`${aiUsageAggregationDaily.failedRequests} + EXCLUDED.failed_requests`,
          avgLatencyMs: sql`(${aiUsageAggregationDaily.avgLatencyMs} * ${aiUsageAggregationDaily.totalRequests} + EXCLUDED.avg_latency_ms * EXCLUDED.total_requests) / NULLIF(${aiUsageAggregationDaily.totalRequests} + EXCLUDED.total_requests, 0)`,
          failoverRequests: sql`${aiUsageAggregationDaily.failoverRequests} + EXCLUDED.failover_requests`,
          lastAggregatedAt: new Date(),
        },
      })
      .returning();

    return results[0];
  }

  // ==========================================================================
  // Cleanup Operations
  // ==========================================================================

  /**
   * Delete usage reports older than retention period
   */
  async deleteOlderThan(tenantId: string, cutoffDate: Date): Promise<number> {
    const results = await this.db
      .delete(aiUsageReports)
      .where(and(eq(aiUsageReports.tenantId, tenantId), lte(aiUsageReports.timestamp, cutoffDate)))
      .returning({ id: aiUsageReports.id });

    return results.length;
  }
}
