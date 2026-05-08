/**
 * Usage Tracker Tests
 *
 * Tests for atomic upserts, concurrent writes, and usage tracking.
 * Critical for ensuring race condition prevention and accurate cost calculation.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { UsageTracker } from "./usage-tracker";
import { AiUsageRepository } from "@agenticverdict/database";

// Mock repository
const mockUsageRepo = {
  atomicUpsert: vi.fn(),
  atomicUpsertBatch: vi.fn(),
  findByTenantAndDateRange: vi.fn(),
  findByProvider: vi.fn(),
  findByDomain: vi.fn(),
  getUsageByProvider: vi.fn(),
  getUsageByDomain: vi.fn(),
  deleteOlderThan: vi.fn(),
} as unknown as AiUsageRepository;

describe("UsageTracker", () => {
  let tracker: UsageTracker;
  const mockTenantId = "tenant-123";
  const mockProviderId = "anthropic";
  const mockModelId = "claude-3-5-sonnet";

  beforeEach(() => {
    vi.clearAllMocks();
    tracker = new UsageTracker(mockUsageRepo);
  });

  describe("trackUsage", () => {
    it("should track usage with atomic upsert", async () => {
      vi.spyOn(mockUsageRepo, "atomicUpsert").mockResolvedValue(
        {} as unknown as import("@agenticverdict/database").NewAiUsageReport,
      );

      await tracker.trackUsage({
        tenantId: mockTenantId,
        providerId: mockProviderId,
        modelId: mockModelId,
        inputTokens: 100,
        outputTokens: 50,
        latencyMs: 250,
        success: true,
        metadata: {},
      });

      expect(mockUsageRepo.atomicUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: mockTenantId,
          providerId: mockProviderId,
          modelId: mockModelId,
          promptTokens: 100,
          completionTokens: 50,
          totalTokens: 150,
          success: true,
        }),
      );
    });

    it("should calculate totalTokens if not provided", async () => {
      vi.spyOn(mockUsageRepo, "atomicUpsert").mockResolvedValue(
        {} as unknown as import("@agenticverdict/database").NewAiUsageReport,
      );

      await tracker.trackUsage({
        tenantId: mockTenantId,
        providerId: mockProviderId,
        modelId: mockModelId,
        inputTokens: 200,
        outputTokens: 100,
      });

      expect(mockUsageRepo.atomicUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          totalTokens: 300,
        }),
      );
    });

    it("should use custom totalTokens if provided", async () => {
      vi.spyOn(mockUsageRepo, "atomicUpsert").mockResolvedValue(
        {} as unknown as import("@agenticverdict/database").NewAiUsageReport,
      );

      await tracker.trackUsage({
        tenantId: mockTenantId,
        providerId: mockProviderId,
        modelId: mockModelId,
        inputTokens: 100,
        outputTokens: 50,
        totalTokens: 200,
      });

      expect(mockUsageRepo.atomicUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          totalTokens: 200,
        }),
      );
    });

    it("should track failed requests", async () => {
      vi.spyOn(mockUsageRepo, "atomicUpsert").mockResolvedValue(
        {} as unknown as import("@agenticverdict/database").NewAiUsageReport,
      );

      await tracker.trackUsage({
        tenantId: mockTenantId,
        providerId: mockProviderId,
        modelId: mockModelId,
        inputTokens: 0,
        outputTokens: 0,
        success: false,
        errorMessage: "Rate limit exceeded",
      });

      expect(mockUsageRepo.atomicUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          errorMessage: "Rate limit exceeded",
        }),
      );
    });

    it("should track domain and connector scoped usage", async () => {
      vi.spyOn(mockUsageRepo, "atomicUpsert").mockResolvedValue(
        {} as unknown as import("@agenticverdict/database").NewAiUsageReport,
      );

      await tracker.trackUsage({
        tenantId: mockTenantId,
        providerId: mockProviderId,
        modelId: mockModelId,
        inputTokens: 100,
        outputTokens: 50,
        domainId: "domain-456",
        connectorId: "connector-789",
      });

      expect(mockUsageRepo.atomicUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          domainId: "domain-456",
          connectorId: "connector-789",
        }),
      );
    });

    it("should include metadata in usage report", async () => {
      vi.spyOn(mockUsageRepo, "atomicUpsert").mockResolvedValue(
        {} as unknown as import("@agenticverdict/database").NewAiUsageReport,
      );

      const metadata = { requestId: "req-123", sessionId: "session-456" };

      await tracker.trackUsage({
        tenantId: mockTenantId,
        providerId: mockProviderId,
        modelId: mockModelId,
        inputTokens: 100,
        outputTokens: 50,
        metadata,
      });

      expect(mockUsageRepo.atomicUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata,
        }),
      );
    });
  });

  describe("trackBatchUsage", () => {
    it("should track multiple usage records in batch", async () => {
      vi.spyOn(mockUsageRepo, "atomicUpsertBatch").mockResolvedValue([]);

      const reports = [
        {
          tenantId: mockTenantId,
          providerId: mockProviderId,
          modelId: mockModelId,
          inputTokens: 100,
          outputTokens: 50,
          totalTokens: 150,
          latencyMs: 0,
          success: true,
          metadata: null,
        },
        {
          tenantId: mockTenantId,
          providerId: mockProviderId,
          modelId: mockModelId,
          inputTokens: 200,
          outputTokens: 100,
          totalTokens: 300,
          latencyMs: 0,
          success: true,
          metadata: null,
        },
      ];

      await tracker.trackBatchUsage(reports);

      expect(mockUsageRepo.atomicUpsertBatch).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            tenantId: mockTenantId,
            promptTokens: 100,
          }),
          expect.objectContaining({
            tenantId: mockTenantId,
            promptTokens: 200,
          }),
        ]),
      );
    });

    it("should handle empty batch", async () => {
      vi.spyOn(mockUsageRepo, "atomicUpsertBatch").mockResolvedValue([]);

      await tracker.trackBatchUsage([]);

      expect(mockUsageRepo.atomicUpsertBatch).toHaveBeenCalledWith([]);
    });
  });

  describe("getMetrics", () => {
    it("should return usage metrics for a time period", async () => {
      const mockReports = [
        {
          promptTokens: 100,
          completionTokens: 50,
          costCents: 1,
          latencyMs: 250,
          success: true,
        },
        {
          promptTokens: 200,
          completionTokens: 100,
          costCents: 2,
          latencyMs: 300,
          success: true,
        },
        {
          promptTokens: 150,
          completionTokens: 75,
          costCents: 1.5,
          latencyMs: 200,
          success: false,
        },
      ];

      vi.spyOn(mockUsageRepo, "findByTenantAndDateRange").mockResolvedValue(
        mockReports as unknown as import("@agenticverdict/database").AiUsageReport[],
      );

      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-01-31");

      const metrics = await tracker.getMetrics({
        tenantId: mockTenantId,
        startDate,
        endDate,
      });

      expect(metrics).toEqual({
        totalRequests: 3,
        totalInputTokens: 450,
        totalOutputTokens: 225,
        totalCost: 0.045,
        avgLatencyMs: 250,
        successRate: (2 / 3) * 100,
        periodStart: startDate,
        periodEnd: endDate,
      });
    });

    it("should handle empty results", async () => {
      vi.spyOn(mockUsageRepo, "findByTenantAndDateRange").mockResolvedValue(
        [] as unknown as import("@agenticverdict/database").AiUsageReport[],
      );

      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-01-31");

      const metrics = await tracker.getMetrics({
        tenantId: mockTenantId,
        startDate,
        endDate,
      });

      expect(metrics).toEqual({
        totalRequests: 0,
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalCost: 0,
        avgLatencyMs: 0,
        successRate: 0,
        periodStart: startDate,
        periodEnd: endDate,
      });
    });
  });

  describe("getUsageByProvider", () => {
    it("should return usage aggregated by provider", async () => {
      const mockAggregation = [
        {
          providerId: "anthropic",
          totalTokens: 50000,
          totalCostCents: 750,
          requestCount: 100,
        },
        {
          providerId: "openai",
          totalTokens: 25000,
          totalCostCents: 500,
          requestCount: 50,
        },
      ];

      vi.spyOn(mockUsageRepo, "getUsageByProvider").mockResolvedValue(mockAggregation);

      const result = await tracker.getUsageByProvider({
        tenantId: mockTenantId,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-01-31"),
      });

      expect(result.length).toBe(2);
      expect(result[0]).toEqual({
        providerId: "anthropic",
        providerName: "anthropic",
        totalRequests: 100,
        totalTokens: 50000,
        totalCost: 7.5,
      });
    });
  });

  describe("getUsageByDomain", () => {
    it("should return usage aggregated by domain", async () => {
      const mockAggregation = [
        {
          domainId: "marketing",
          totalTokens: 40000,
          totalCostCents: 600,
          requestCount: 80,
        },
        {
          domainId: "sales",
          totalTokens: 20000,
          totalCostCents: 300,
          requestCount: 40,
        },
      ];

      vi.spyOn(mockUsageRepo, "getUsageByDomain").mockResolvedValue(mockAggregation);

      const result = await tracker.getUsageByDomain({
        tenantId: mockTenantId,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-01-31"),
      });

      expect(result.length).toBe(2);
      expect(result[0]).toEqual({
        domainId: "marketing",
        domainName: "marketing",
        totalRequests: 80,
        totalTokens: 40000,
        totalCost: 6.0,
      });
    });
  });

  describe("Concurrent write prevention", () => {
    it("should use atomic upsert to prevent race conditions", async () => {
      vi.spyOn(mockUsageRepo, "atomicUpsert").mockResolvedValue(
        {} as unknown as import("@agenticverdict/database").NewAiUsageReport,
      );

      const concurrentWrites = Array.from({ length: 10 }, (_, i) =>
        tracker.trackUsage({
          tenantId: mockTenantId,
          providerId: mockProviderId,
          modelId: mockModelId,
          inputTokens: 100,
          outputTokens: 50,
          metadata: { concurrentId: i },
        }),
      );

      await Promise.all(concurrentWrites);

      expect(mockUsageRepo.atomicUpsert).toHaveBeenCalledTimes(10);
    });

    it("should handle batch upsert for high-volume scenarios", async () => {
      vi.spyOn(mockUsageRepo, "atomicUpsertBatch").mockResolvedValue([]);

      const batchSize = 100;
      const reports = Array.from({ length: batchSize }, (_, i) => ({
        tenantId: mockTenantId,
        providerId: mockProviderId,
        modelId: mockModelId,
        inputTokens: 100,
        outputTokens: 50,
        totalTokens: 150,
        latencyMs: 0,
        success: true,
        metadata: { batchId: i },
      }));

      await tracker.trackBatchUsage(reports);

      expect(mockUsageRepo.atomicUpsertBatch).toHaveBeenCalledTimes(1);
      expect(mockUsageRepo.atomicUpsertBatch).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            tenantId: mockTenantId,
            promptTokens: 100,
          }),
        ]),
      );
    });
  });

  describe("Tenant isolation", () => {
    it("should always include tenantId in usage tracking", async () => {
      vi.spyOn(mockUsageRepo, "atomicUpsert").mockResolvedValue(
        {} as unknown as import("@agenticverdict/database").NewAiUsageReport,
      );

      await tracker.trackUsage({
        tenantId: mockTenantId,
        providerId: mockProviderId,
        modelId: mockModelId,
        inputTokens: 100,
        outputTokens: 50,
      });

      expect(mockUsageRepo.atomicUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: mockTenantId,
        }),
      );
    });

    it("should filter metrics by tenant", async () => {
      vi.spyOn(mockUsageRepo, "findByTenantAndDateRange").mockResolvedValue([]);

      await tracker.getMetrics({
        tenantId: mockTenantId,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-01-31"),
      });

      expect(mockUsageRepo.findByTenantAndDateRange).toHaveBeenCalledWith(
        mockTenantId,
        expect.any(Date),
        expect.any(Date),
        1000,
      );
    });
  });
});
