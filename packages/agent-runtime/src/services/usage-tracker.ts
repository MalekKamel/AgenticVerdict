import { AiUsageRepository } from "@agenticverdict/database";
import type { UsageTrackOptions, UsageMetrics } from "@agenticverdict/types";

export class UsageTracker {
  private usageRepo: AiUsageRepository;

  constructor(usageRepo?: AiUsageRepository) {
    this.usageRepo = usageRepo || new AiUsageRepository();
  }

  async trackUsage(options: UsageTrackOptions): Promise<void> {
    const {
      tenantId,
      providerId,
      modelId,
      inputTokens,
      outputTokens,
      totalTokens = inputTokens + outputTokens,
      latencyMs,
      success = true,
      errorMessage,
      domainId,
      connectorId,
      metadata,
    } = options;

    const costCents = await this.calculateCost({
      providerId,
      modelId,
      inputTokens,
      outputTokens,
    });

    const report = {
      id: crypto.randomUUID(),
      tenantId,
      providerId,
      modelId,
      domainId: domainId || null,
      connectorId: connectorId || null,
      requestId: crypto.randomUUID(),
      promptTokens: inputTokens,
      completionTokens: outputTokens,
      totalTokens,
      costCents,
      latencyMs: latencyMs || 0,
      success,
      errorCode: errorMessage ? "USAGE_ERROR" : null,
      errorMessage: errorMessage || null,
      timestamp: new Date(),
      wasFailover: false,
      failoverAttempt: null,
      metadata: metadata || {},
    };

    await this.usageRepo.atomicUpsert(report);
  }

  async trackBatchUsage(reports: UsageTrackOptions[]): Promise<void> {
    const usageReports = await Promise.all(
      reports.map(async (options) => {
        const {
          tenantId,
          providerId,
          modelId,
          inputTokens,
          outputTokens,
          totalTokens = inputTokens + outputTokens,
          latencyMs,
          success = true,
          errorMessage,
          domainId,
          connectorId,
          metadata,
        } = options;

        const costCents = await this.calculateCost({
          providerId,
          modelId,
          inputTokens,
          outputTokens,
        });

        return {
          id: crypto.randomUUID(),
          tenantId,
          providerId,
          modelId,
          domainId: domainId || null,
          connectorId: connectorId || null,
          requestId: crypto.randomUUID(),
          promptTokens: inputTokens,
          completionTokens: outputTokens,
          totalTokens,
          costCents,
          latencyMs: latencyMs || 0,
          success,
          errorCode: errorMessage ? "USAGE_ERROR" : null,
          errorMessage: errorMessage || null,
          timestamp: new Date(),
          wasFailover: false,
          failoverAttempt: null,
          metadata: metadata || {},
        };
      }),
    );

    await this.usageRepo.atomicUpsertBatch(usageReports);
  }

  private async calculateCost(params: {
    providerId: string;
    modelId: string;
    inputTokens: number;
    outputTokens: number;
  }): Promise<number> {
    return (params.inputTokens + params.outputTokens) * 0.000002 * 100;
  }

  async getMetrics(options: {
    tenantId: string;
    startDate: Date;
    endDate: Date;
    providerId?: string;
    domainId?: string;
  }): Promise<UsageMetrics> {
    const { tenantId, startDate, endDate } = options;

    const reports = await this.usageRepo.findByTenantAndDateRange(
      tenantId,
      startDate,
      endDate,
      1000,
    );

    const totalRequests = reports.length;
    const totalInputTokens = reports.reduce((sum: number, r) => sum + r.promptTokens, 0);
    const totalOutputTokens = reports.reduce((sum: number, r) => sum + r.completionTokens, 0);
    const totalCostCents = reports.reduce((sum: number, r) => sum + r.costCents, 0);
    const totalLatency = reports.reduce((sum: number, r) => sum + (r.latencyMs || 0), 0);
    const successfulRequests = reports.reduce((sum: number, r) => sum + (r.success ? 1 : 0), 0);

    const totalCost = totalCostCents / 100;

    return {
      totalRequests,
      totalInputTokens,
      totalOutputTokens,
      totalCost,
      avgLatencyMs: totalRequests > 0 ? totalLatency / totalRequests : 0,
      successRate: totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0,
      periodStart: startDate,
      periodEnd: endDate,
    };
  }

  async getUsageByProvider(options: { tenantId: string; startDate: Date; endDate: Date }): Promise<
    Array<{
      providerId: string;
      providerName: string;
      totalRequests: number;
      totalTokens: number;
      totalCost: number;
    }>
  > {
    const results = await this.usageRepo.getUsageByProvider(
      options.tenantId,
      options.startDate,
      options.endDate,
    );
    return results.map(
      (r: {
        providerId: string;
        requestCount: number;
        totalTokens: number;
        totalCostCents: number;
      }) => ({
        providerId: r.providerId,
        providerName: r.providerId,
        totalRequests: r.requestCount,
        totalTokens: r.totalTokens,
        totalCost: r.totalCostCents / 100,
      }),
    );
  }

  async getUsageByDomain(options: { tenantId: string; startDate: Date; endDate: Date }): Promise<
    Array<{
      domainId: string;
      domainName: string;
      totalRequests: number;
      totalTokens: number;
      totalCost: number;
    }>
  > {
    const results = await this.usageRepo.getUsageByDomain(
      options.tenantId,
      options.startDate,
      options.endDate,
    );
    return results.map((r) => ({
      domainId: r.domainId || "unknown",
      domainName: r.domainId || "Unknown",
      totalRequests: r.requestCount,
      totalTokens: r.totalTokens,
      totalCost: r.totalCostCents / 100,
    }));
  }
}
