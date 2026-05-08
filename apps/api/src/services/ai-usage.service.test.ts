/**
 * AI Usage Service Tests
 *
 * Tests for usage tracking, cost calculation, and analytics.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { AiUsageService } from "./ai-usage.service";
import { AiUsageRepository } from "@agenticverdict/database";

// Mock repository
const mockRepository = {
  atomicUpsert: vi.fn(),
  atomicUpsertBatch: vi.fn(),
  findByTenantAndDateRange: vi.fn(),
  findByProvider: vi.fn(),
  findByDomain: vi.fn(),
  findFailedRequests: vi.fn(),
  findFailoverRequests: vi.fn(),
  getUsageSummary: vi.fn(),
  getUsageByProvider: vi.fn(),
  getUsageByDomain: vi.fn(),
  upsertDailyAggregation: vi.fn(),
  deleteOlderThan: vi.fn(),
} as unknown as AiUsageRepository;

describe("AiUsageService", () => {
  let service: AiUsageService;
  const mockTenantId = "tenant-123";
  const mockStartDate = new Date("2024-01-01");
  const mockEndDate = new Date("2024-01-31");

  beforeEach(() => {
    vi.clearAllMocks();
    service = AiUsageService.forTest(mockRepository);
  });

  describe("recordUsage", () => {
    it("should record usage with atomic upsert", async () => {
      const usageData = {
        providerId: "anthropic",
        modelId: "claude-3-5-sonnet",
        requestId: "123e4567-e89b-12d3-a456-426614174000",
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
        costCents: 25,
        latencyMs: 250,
        success: true,
        wasFailover: false,
      };

      const recordedUsage = {
        ...usageData,
        tenantId: mockTenantId,
        id: "usage-1",
        timestamp: new Date(),
        createdAt: new Date(),
        domainId: null,
        connectorId: null,
        metadata: null,
        errorCode: null,
        errorMessage: null,
        failoverAttempt: null,
      };

      vi.spyOn(mockRepository, "atomicUpsert").mockResolvedValue(recordedUsage as unknown);

      const result = await service.recordUsage(mockTenantId, usageData);

      expect(result).toEqual(recordedUsage);
      expect(mockRepository.atomicUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: mockTenantId,
          requestId: usageData.requestId,
          totalTokens: 150,
        }),
      );
    });

    it("should calculate cost if not provided", async () => {
      const usageData = {
        providerId: "anthropic",
        modelId: "claude-3-5-sonnet",
        requestId: "123e4567-e89b-12d3-a456-426614174001",
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
        costCents: 0, // Will be calculated
        latencyMs: 250,
        success: true,
        timestamp: new Date(),
      };

      vi.spyOn(mockRepository, "atomicUpsert").mockResolvedValue({} as unknown);

      await service.recordUsage(mockTenantId, usageData);

      expect(mockRepository.atomicUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          costCents: expect.any(Number),
        }),
      );
    });

    it("should validate usage data with Zod schema", async () => {
      const invalidData = {
        providerId: "",
        modelId: "claude-3-5-sonnet",
        requestId: "123e4567-e89b-12d3-a456-426614174002",
        promptTokens: -100, // Invalid: negative
        completionTokens: 50,
        totalTokens: 150,
        costCents: 25,
        latencyMs: 250,
        success: true,
      };

      await expect(service.recordUsage(mockTenantId, invalidData as unknown)).rejects.toThrow(); // Zod validation error
    });
  });

  describe("batchRecordUsage", () => {
    it("should batch record multiple usage entries", async () => {
      const usageDataArray = [
        {
          providerId: "anthropic",
          modelId: "claude-3-5-sonnet",
          requestId: "123e4567-e89b-12d3-a456-426614174003",
          promptTokens: 100,
          completionTokens: 50,
          totalTokens: 150,
          costCents: 25,
          latencyMs: 250,
          success: true,
          timestamp: new Date(),
        },
        {
          providerId: "openai",
          modelId: "gpt-4",
          requestId: "123e4567-e89b-12d3-a456-426614174004",
          promptTokens: 200,
          completionTokens: 100,
          totalTokens: 300,
          costCents: 50,
          latencyMs: 300,
          success: true,
          timestamp: new Date(),
        },
      ];

      const recordedUsage = usageDataArray.map((d, i) => ({
        ...d,
        tenantId: mockTenantId,
        id: `usage-${i}`,
      }));

      vi.spyOn(mockRepository, "atomicUpsertBatch").mockResolvedValue(recordedUsage as unknown);

      const result = await service.batchRecordUsage(mockTenantId, usageDataArray);

      expect(result).toEqual(recordedUsage);
      expect(result.length).toBe(2);
      expect(mockRepository.atomicUpsertBatch).toHaveBeenCalled();
    });

    it("should handle empty batch", async () => {
      vi.spyOn(mockRepository, "atomicUpsertBatch").mockResolvedValue([]);

      const result = await service.batchRecordUsage(mockTenantId, []);

      expect(result).toEqual([]);
    });
  });

  describe("getUsageSummary", () => {
    it("should return usage summary with breakdowns", async () => {
      const mockSummary = {
        totalPromptTokens: 1000,
        totalCompletionTokens: 500,
        totalTokens: 1500,
        totalCostCents: 250,
        totalRequests: 10,
        successfulRequests: 9,
        failedRequests: 1,
        avgLatencyMs: 245,
      };

      const mockByProvider = [
        { providerId: "anthropic", totalTokens: 1000, totalCostCents: 150, requestCount: 5 },
      ];

      const mockByDomain = [
        { domainId: "domain-1", totalTokens: 800, totalCostCents: 120, requestCount: 4 },
      ];

      vi.spyOn(mockRepository, "getUsageSummary").mockResolvedValue(mockSummary);
      vi.spyOn(mockRepository, "getUsageByProvider").mockResolvedValue(mockByProvider as unknown);
      vi.spyOn(mockRepository, "getUsageByDomain").mockResolvedValue(mockByDomain as unknown);

      const result = await service.getUsageSummary(mockTenantId, mockStartDate, mockEndDate);

      expect(result).toEqual({
        tenantId: mockTenantId,
        periodStart: mockStartDate.toISOString(),
        periodEnd: mockEndDate.toISOString(),
        ...mockSummary,
        byProvider: mockByProvider,
        byDomain: mockByDomain,
      });
    });
  });

  describe("getUsageByProvider", () => {
    it("should return usage for specific provider", async () => {
      const mockUsage = [
        {
          id: "usage-1",
          providerId: "anthropic",
          totalTokens: 1000,
          costCents: 150,
        },
      ];

      vi.spyOn(mockRepository, "findByProvider").mockResolvedValue(mockUsage as unknown);

      const result = await service.getUsageByProvider(
        mockTenantId,
        "anthropic",
        mockStartDate,
        mockEndDate,
      );

      expect(result).toEqual(mockUsage);
      expect(mockRepository.findByProvider).toHaveBeenCalledWith(
        mockTenantId,
        "anthropic",
        mockStartDate,
        mockEndDate,
      );
    });
  });

  describe("getUsageByDomain", () => {
    it("should return usage for specific domain", async () => {
      const mockUsage = [
        {
          id: "usage-1",
          domainId: "domain-1",
          totalTokens: 800,
          costCents: 120,
        },
      ];

      vi.spyOn(mockRepository, "findByDomain").mockResolvedValue(mockUsage as unknown);

      const result = await service.getUsageByDomain(
        mockTenantId,
        "domain-1",
        mockStartDate,
        mockEndDate,
      );

      expect(result).toEqual(mockUsage);
    });
  });

  describe("getFailedRequests", () => {
    it("should return failed requests", async () => {
      const mockFailedRequests = [
        {
          id: "usage-failed",
          providerId: "anthropic",
          success: false,
          errorCode: "RATE_LIMIT_EXCEEDED",
          errorMessage: "Rate limit exceeded",
        },
      ];

      vi.spyOn(mockRepository, "findFailedRequests").mockResolvedValue(
        mockFailedRequests as unknown,
      );

      const result = await service.getFailedRequests(mockTenantId, mockStartDate, mockEndDate);

      expect(result).toEqual(mockFailedRequests);
      expect(result[0].success).toBe(false);
    });
  });

  describe("getFailoverRequests", () => {
    it("should return failover requests", async () => {
      const mockFailoverRequests = [
        {
          id: "usage-failover",
          providerId: "backup-provider",
          wasFailover: true,
          originalProviderId: "anthropic",
        },
      ];

      vi.spyOn(mockRepository, "findFailoverRequests").mockResolvedValue(
        mockFailoverRequests as unknown,
      );

      const result = await service.getFailoverRequests(mockTenantId, mockStartDate, mockEndDate);

      expect(result).toEqual(mockFailoverRequests);
      expect(result[0].wasFailover).toBe(true);
    });
  });

  describe("getUsageReports", () => {
    it("should return detailed usage reports with default limit", async () => {
      const mockUsage = [
        { id: "usage-1", timestamp: new Date() },
        { id: "usage-2", timestamp: new Date() },
      ];

      vi.spyOn(mockRepository, "findByTenantAndDateRange").mockResolvedValue(mockUsage as unknown);

      const result = await service.getUsageReports(mockTenantId, mockStartDate, mockEndDate);

      expect(result).toEqual(mockUsage);
    });

    it("should respect custom limit", async () => {
      const mockUsage = Array.from({ length: 50 }, (_, i) => ({
        id: `usage-${i}`,
        timestamp: new Date(),
      }));

      vi.spyOn(mockRepository, "findByTenantAndDateRange").mockResolvedValue(mockUsage as unknown);

      await service.getUsageReports(mockTenantId, mockStartDate, mockEndDate, 50);

      expect(mockRepository.findByTenantAndDateRange).toHaveBeenCalledWith(
        mockTenantId,
        mockStartDate,
        mockEndDate,
        50,
      );
    });
  });

  describe("cleanupOldData", () => {
    it("should delete usage older than retention period", async () => {
      const retentionDays = 90;
      const deletedCount = 100;

      vi.spyOn(mockRepository, "deleteOlderThan").mockResolvedValue(deletedCount);

      const result = await service.cleanupOldData(mockTenantId, retentionDays);

      expect(result).toBe(deletedCount);
      expect(mockRepository.deleteOlderThan).toHaveBeenCalledWith(mockTenantId, expect.any(Date));
    });
  });

  describe("Cost calculation", () => {
    it("should use provided cost when greater than 0", async () => {
      const usageData = {
        providerId: "anthropic",
        modelId: "claude-3-5-sonnet",
        requestId: "123e4567-e89b-12d3-a456-426614174005",
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
        costCents: 999, // Provided cost
        latencyMs: 250,
        success: true,
        timestamp: new Date(),
      };

      vi.spyOn(mockRepository, "atomicUpsert").mockResolvedValue({} as unknown);

      await service.recordUsage(mockTenantId, usageData);

      expect(mockRepository.atomicUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          costCents: 999,
        }),
      );
    });
  });

  describe("Tenant isolation", () => {
    it("should always pass tenantId to repository methods", async () => {
      vi.spyOn(mockRepository, "getUsageSummary").mockResolvedValue({} as unknown);

      await service.getUsageSummary(mockTenantId, mockStartDate, mockEndDate);

      expect(mockRepository.getUsageSummary).toHaveBeenCalledWith(
        mockTenantId,
        mockStartDate,
        mockEndDate,
      );
    });
  });
});
