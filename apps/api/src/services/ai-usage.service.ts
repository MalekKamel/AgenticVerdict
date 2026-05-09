import { AiUsageRepository } from "@agenticverdict/database";
import { usageReportSchema } from "@agenticverdict/types";
// calculateCost is available for future use
import type { z } from "zod";

/**
 * AI Usage Service
 *
 * Business logic for AI usage tracking and cost calculation.
 * Handles usage reporting, aggregation, and cost analytics.
 */

export class AiUsageService {
  private repository: AiUsageRepository;

  constructor(repository?: AiUsageRepository) {
    this.repository = repository || new AiUsageRepository();
  }

  /**
   * Allow injecting repository for testing
   */
  static forTest(repository: AiUsageRepository): AiUsageService {
    return new AiUsageService(repository);
  }

  // ==========================================================================
  // Usage Reporting
  // ==========================================================================

  /**
   * Record usage from agent runtime
   */
  async recordUsage(tenantId: string, data: z.infer<typeof usageReportSchema>) {
    // Validate
    const validatedData = usageReportSchema.parse(data);

    // Calculate cost if not provided
    const costCents =
      validatedData.costCents > 0
        ? validatedData.costCents
        : this.calculateUsageCost(validatedData.promptTokens, validatedData.completionTokens);

    // Atomic upsert
    return this.repository.atomicUpsert({
      tenantId,
      providerId: validatedData.providerId,
      modelId: validatedData.modelId,
      domainId: validatedData.domainId,
      connectorId: validatedData.connectorId,
      requestId: validatedData.requestId,
      promptTokens: validatedData.promptTokens,
      completionTokens: validatedData.completionTokens,
      totalTokens: validatedData.totalTokens,
      costCents,
      timestamp: new Date(),
      latencyMs: validatedData.latencyMs,
      success: validatedData.success,
      errorCode: validatedData.errorCode,
      errorMessage: validatedData.errorMessage,
      wasFailover: validatedData.wasFailover,
      metadata: validatedData.metadata,
    });
  }

  /**
   * Batch record usage
   */
  async batchRecordUsage(tenantId: string, dataArray: Array<z.infer<typeof usageReportSchema>>) {
    const processedData = dataArray.map((data) => {
      const validatedData = usageReportSchema.parse(data);
      const costCents =
        validatedData.costCents > 0
          ? validatedData.costCents
          : this.calculateUsageCost(validatedData.promptTokens, validatedData.completionTokens);

      return {
        tenantId,
        providerId: validatedData.providerId,
        modelId: validatedData.modelId,
        domainId: validatedData.domainId,
        connectorId: validatedData.connectorId,
        requestId: validatedData.requestId,
        promptTokens: validatedData.promptTokens,
        completionTokens: validatedData.completionTokens,
        totalTokens: validatedData.totalTokens,
        costCents,
        timestamp: new Date(),
        latencyMs: validatedData.latencyMs,
        success: validatedData.success,
        errorCode: validatedData.errorCode,
        errorMessage: validatedData.errorMessage,
        wasFailover: validatedData.wasFailover,
        metadata: validatedData.metadata,
      };
    });

    return this.repository.atomicUpsertBatch(processedData);
  }

  // ==========================================================================
  // Usage Queries
  // ==========================================================================

  /**
   * Get usage summary for date range
   */
  async getUsageSummary(tenantId: string, startDate: Date, endDate: Date) {
    const summary = await this.repository.getUsageSummary(tenantId, startDate, endDate);
    const byProvider = await this.repository.getUsageByProvider(tenantId, startDate, endDate);
    const byDomain = await this.repository.getUsageByDomain(tenantId, startDate, endDate);

    return {
      tenantId,
      periodStart: startDate.toISOString(),
      periodEnd: endDate.toISOString(),
      ...summary,
      byProvider,
      byDomain,
    };
  }

  /**
   * Get usage by provider
   */
  async getUsageByProvider(tenantId: string, providerId: string, startDate: Date, endDate: Date) {
    return this.repository.findByProvider(tenantId, providerId, startDate, endDate);
  }

  /**
   * Get usage by domain
   */
  async getUsageByDomain(tenantId: string, domainId: string, startDate: Date, endDate: Date) {
    return this.repository.findByDomain(tenantId, domainId, startDate, endDate);
  }

  /**
   * Get failed requests
   */
  async getFailedRequests(tenantId: string, startDate: Date, endDate: Date) {
    return this.repository.findFailedRequests(tenantId, startDate, endDate);
  }

  /**
   * Get failover requests
   */
  async getFailoverRequests(tenantId: string, startDate: Date, endDate: Date) {
    return this.repository.findFailoverRequests(tenantId, startDate, endDate);
  }

  /**
   * Get detailed usage reports
   */
  async getUsageReports(tenantId: string, startDate: Date, endDate: Date, limit = 1000) {
    return this.repository.findByTenantAndDateRange(tenantId, startDate, endDate, limit);
  }

  // ==========================================================================
  // Cost Calculation
  // ==========================================================================

  /**
   * Calculate cost for usage
   */
  private calculateUsageCost(promptTokens: number, completionTokens: number): number {
    // Default pricing (in production, this would come from configuration)
    const defaultPricing = {
      inputCostPer1k: 0.003, // $0.003 per 1K tokens
      outputCostPer1k: 0.015, // $0.015 per 1K tokens
    };

    const inputCost = (promptTokens / 1000) * defaultPricing.inputCostPer1k;
    const outputCost = (completionTokens / 1000) * defaultPricing.outputCostPer1k;
    const totalCost = inputCost + outputCost;

    // Convert to cents
    return Math.round(totalCost * 100);
  }

  /**
   * Calculate cost with custom pricing
   */
  calculateCostWithPricing(
    promptTokens: number,
    completionTokens: number,
    pricing: {
      inputCostPer1k: number;
      outputCostPer1k: number;
    },
  ): number {
    const inputCost = (promptTokens / 1000) * pricing.inputCostPer1k;
    const outputCost = (completionTokens / 1000) * pricing.outputCostPer1k;
    const totalCost = inputCost + outputCost;

    return Math.round(totalCost * 100);
  }

  /**
   * Project cost based on current usage
   */
  async projectCost(
    tenantId: string,
    startDate: Date,
    endDate: Date,
    periodDays: number,
  ): Promise<{
    currentCost: number;
    projectedCost: number;
    dailyAverage: number;
  }> {
    const summary = await this.repository.getUsageSummary(tenantId, startDate, endDate);

    const daysElapsed = Math.max(
      1,
      Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)),
    );

    const dailyAverage = summary.totalCostCents / daysElapsed;
    const projectedCost = Math.round(dailyAverage * periodDays);

    return {
      currentCost: summary.totalCostCents,
      projectedCost,
      dailyAverage: Math.round(dailyAverage),
    };
  }

  // ==========================================================================
  // Usage Analytics
  // ==========================================================================

  /**
   * Get usage trends (daily breakdown)
   */
  async getUsageTrends(tenantId: string, startDate: Date, endDate: Date) {
    const reports = await this.repository.findByTenantAndDateRange(
      tenantId,
      startDate,
      endDate,
      10000,
    );

    // Group by date
    const dailyUsage = new Map<
      string,
      {
        tokens: number;
        costCents: number;
        requests: number;
      }
    >();

    for (const report of reports) {
      const dateKey = new Date(report.timestamp).toISOString().split("T")[0];
      const existing = dailyUsage.get(dateKey) || { tokens: 0, costCents: 0, requests: 0 };

      dailyUsage.set(dateKey, {
        tokens: existing.tokens + report.totalTokens,
        costCents: existing.costCents + report.costCents,
        requests: existing.requests + 1,
      });
    }

    // Convert to array and sort
    return Array.from(dailyUsage.entries())
      .map(([date, data]) => ({
        date,
        ...data,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Get cost efficiency metrics
   */
  async getCostEfficiency(tenantId: string, startDate: Date, endDate: Date) {
    const summary = await this.repository.getUsageSummary(tenantId, startDate, endDate);
    const byProvider = await this.repository.getUsageByProvider(tenantId, startDate, endDate);

    // Calculate cost per token for each provider
    const providerEfficiency = byProvider.map((provider) => ({
      ...provider,
      costPerToken: provider.totalTokens > 0 ? provider.totalCostCents / provider.totalTokens : 0,
    }));

    // Find most and least efficient
    const sorted = providerEfficiency.sort((a, b) => a.costPerToken - b.costPerToken);

    return {
      overall: {
        totalCostCents: summary.totalCostCents,
        totalTokens: summary.totalTokens,
        avgCostPerToken: summary.totalTokens > 0 ? summary.totalCostCents / summary.totalTokens : 0,
      },
      byProvider: providerEfficiency,
      mostEfficient: sorted[0] || null,
      leastEfficient: sorted[sorted.length - 1] || null,
    };
  }

  // ==========================================================================
  // Cleanup & Retention
  // ==========================================================================

  /**
   * Clean up old usage data based on retention policy
   */
  async cleanupOldData(tenantId: string, retentionDays: number): Promise<number> {
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
    return this.repository.deleteOlderThan(tenantId, cutoffDate);
  }

  // ==========================================================================
  // Query Helpers
  // ==========================================================================

  /**
   * Get current month usage
   */
  async getCurrentMonthUsage(tenantId: string) {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return this.getUsageSummary(tenantId, startDate, endDate);
  }

  /**
   * Get usage for specific model
   */
  async getUsageByModel(tenantId: string, modelId: string, startDate: Date, endDate: Date) {
    const reports = await this.repository.findByTenantAndDateRange(
      tenantId,
      startDate,
      endDate,
      10000,
    );

    return reports.filter((r) => r.modelId === modelId);
  }
}
