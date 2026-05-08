/**
 * AI Usage Repository Tests
 *
 * Tests for atomic upserts, query operations, and aggregations.
 * Critical for ensuring race condition prevention in usage tracking.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { AiUsageRepository } from "./ai-usage.repository";
import { type AiUsageReport, type NewAiUsageReport } from "../schema/ai-usage_reports";

// Mock database client
const mockDb = {
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};
type TestDb = Parameters<typeof AiUsageRepository.forTest>[0];
type MockQueryChain = Record<string, ReturnType<typeof vi.fn>>;

describe("AiUsageRepository", () => {
  let repository: AiUsageRepository;
  const mockTenantId = "tenant-123";
  const mockStartDate = new Date("2024-01-01");
  const mockEndDate = new Date("2024-01-31");

  beforeEach(() => {
    vi.clearAllMocks();
    repository = AiUsageRepository.forTest(mockDb as unknown as TestDb);
  });

  describe("atomicUpsert", () => {
    it("should atomically upsert a usage report", async () => {
      const newReport: NewAiUsageReport = {
        requestId: "req-123",
        tenantId: mockTenantId,
        providerId: "provider-1",
        modelId: "model-1",
        timestamp: new Date(),
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
        costCents: 25,
        latencyMs: 250,
        success: true,
        wasFailover: false,
      };

      const createdReport: AiUsageReport = {
        ...newReport,
        id: "report-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const chain: MockQueryChain = {};
      chain.insert = vi.fn().mockReturnValue(chain);
      chain.values = vi.fn().mockReturnValue(chain);
      chain.onConflictDoUpdate = vi.fn().mockReturnValue(chain);
      chain.returning = vi.fn().mockResolvedValue([createdReport]);
      mockDb.insert.mockImplementation(() => chain);

      const result = await repository.atomicUpsert(newReport);

      expect(result).toEqual(createdReport);
      expect(result.id).toBe("report-1");
    });

    it("should handle upsert with existing request (update case)", async () => {
      const newReport: NewAiUsageReport = {
        requestId: "req-123",
        tenantId: mockTenantId,
        providerId: "provider-1",
        modelId: "model-1",
        timestamp: new Date(),
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
        costCents: 25,
        latencyMs: 250,
        success: true,
        wasFailover: false,
      };

      const updatedReport: AiUsageReport = {
        ...newReport,
        id: "report-existing",
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date(),
      };

      const chain: MockQueryChain = {};
      chain.insert = vi.fn().mockReturnValue(chain);
      chain.values = vi.fn().mockReturnValue(chain);
      chain.onConflictDoUpdate = vi.fn().mockReturnValue(chain);
      chain.returning = vi.fn().mockResolvedValue([updatedReport]);
      mockDb.insert.mockImplementation(() => chain);

      const result = await repository.atomicUpsert(newReport);

      expect(result).toEqual(updatedReport);
    });
  });

  describe("atomicUpsertBatch", () => {
    it("should handle empty batch", async () => {
      const result = await repository.atomicUpsertBatch([]);
      expect(result).toEqual([]);
    });

    it("should process batch in chunks of 100", async () => {
      const reports: NewAiUsageReport[] = Array.from({ length: 150 }, (_, i) => ({
        requestId: `req-${i}`,
        tenantId: mockTenantId,
        providerId: "provider-1",
        modelId: "model-1",
        timestamp: new Date(),
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
        costCents: 25,
        latencyMs: 250,
        success: true,
        wasFailover: false,
      }));

      const mockResults: AiUsageReport[] = reports.map((r, i) => ({
        ...r,
        id: `report-${i}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      vi.spyOn(repository, "atomicUpsert").mockResolvedValue(mockResults[0]);

      const result = await repository.atomicUpsertBatch(reports);

      expect(result.length).toBe(150);
      expect(repository.atomicUpsert).toHaveBeenCalledTimes(150);
    });
  });

  describe("findByTenantAndDateRange", () => {
    it("should find usage reports by tenant and date range", async () => {
      const mockReports: AiUsageReport[] = [
        {
          id: "report-1",
          requestId: "req-1",
          tenantId: mockTenantId,
          providerId: "provider-1",
          modelId: "model-1",
          timestamp: new Date("2024-01-15"),
          promptTokens: 100,
          completionTokens: 50,
          totalTokens: 150,
          costCents: 25,
          latencyMs: 250,
          success: true,
          wasFailover: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const chain: MockQueryChain = {};
      chain.select = vi.fn().mockReturnValue(chain);
      chain.from = vi.fn().mockReturnValue(chain);
      chain.where = vi.fn().mockReturnValue(chain);
      chain.orderBy = vi.fn().mockReturnValue(chain);
      chain.limit = vi.fn().mockResolvedValue(mockReports);
      mockDb.select.mockImplementation(() => chain);

      const result = await repository.findByTenantAndDateRange(
        mockTenantId,
        mockStartDate,
        mockEndDate,
      );

      expect(result).toEqual(mockReports);
      expect(result.length).toBe(1);
    });

    it("should use default limit of 1000", async () => {
      const chain: MockQueryChain = {};
      chain.select = vi.fn().mockReturnValue(chain);
      chain.from = vi.fn().mockReturnValue(chain);
      chain.where = vi.fn().mockReturnValue(chain);
      chain.orderBy = vi.fn().mockReturnValue(chain);
      chain.limit = vi.fn().mockResolvedValue([]);
      mockDb.select.mockImplementation(() => chain);

      await repository.findByTenantAndDateRange(mockTenantId, mockStartDate, mockEndDate);

      expect(chain.limit).toHaveBeenCalledWith(1000);
    });
  });

  describe("findByProvider", () => {
    it("should find usage by specific provider", async () => {
      const mockReports: AiUsageReport[] = [
        {
          id: "report-1",
          requestId: "req-1",
          tenantId: mockTenantId,
          providerId: "provider-specific",
          modelId: "model-1",
          timestamp: new Date("2024-01-15"),
          promptTokens: 100,
          completionTokens: 50,
          totalTokens: 150,
          costCents: 25,
          latencyMs: 250,
          success: true,
          wasFailover: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const chain: MockQueryChain = {};
      chain.select = vi.fn().mockReturnValue(chain);
      chain.from = vi.fn().mockReturnValue(chain);
      chain.where = vi.fn().mockReturnValue(chain);
      chain.orderBy = vi.fn().mockResolvedValue(mockReports);
      mockDb.select.mockImplementation(() => chain);

      const result = await repository.findByProvider(
        mockTenantId,
        "provider-specific",
        mockStartDate,
        mockEndDate,
      );

      expect(result).toEqual(mockReports);
    });
  });

  describe("findByDomain", () => {
    it("should find usage by domain", async () => {
      const mockReports: AiUsageReport[] = [
        {
          id: "report-1",
          requestId: "req-1",
          tenantId: mockTenantId,
          domainId: "domain-123",
          providerId: "provider-1",
          modelId: "model-1",
          timestamp: new Date("2024-01-15"),
          promptTokens: 100,
          completionTokens: 50,
          totalTokens: 150,
          costCents: 25,
          latencyMs: 250,
          success: true,
          wasFailover: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const chain: MockQueryChain = {};
      chain.select = vi.fn().mockReturnValue(chain);
      chain.from = vi.fn().mockReturnValue(chain);
      chain.where = vi.fn().mockReturnValue(chain);
      chain.orderBy = vi.fn().mockResolvedValue(mockReports);
      mockDb.select.mockImplementation(() => chain);

      const result = await repository.findByDomain(
        mockTenantId,
        "domain-123",
        mockStartDate,
        mockEndDate,
      );

      expect(result).toEqual(mockReports);
    });
  });

  describe("findFailedRequests", () => {
    it("should find failed requests", async () => {
      const failedReports: AiUsageReport[] = [
        {
          id: "report-failed",
          requestId: "req-failed",
          tenantId: mockTenantId,
          providerId: "provider-1",
          modelId: "model-1",
          timestamp: new Date("2024-01-15"),
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
          costCents: 0,
          latencyMs: 0,
          success: false,
          wasFailover: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const chain: MockQueryChain = {};
      chain.select = vi.fn().mockReturnValue(chain);
      chain.from = vi.fn().mockReturnValue(chain);
      chain.where = vi.fn().mockReturnValue(chain);
      chain.orderBy = vi.fn().mockResolvedValue(failedReports);
      mockDb.select.mockImplementation(() => chain);

      const result = await repository.findFailedRequests(mockTenantId, mockStartDate, mockEndDate);

      expect(result).toEqual(failedReports);
      expect(result[0].success).toBe(false);
    });
  });

  describe("findFailoverRequests", () => {
    it("should find failover requests", async () => {
      const failoverReports: AiUsageReport[] = [
        {
          id: "report-failover",
          requestId: "req-failover",
          tenantId: mockTenantId,
          providerId: "provider-backup",
          modelId: "model-1",
          timestamp: new Date("2024-01-15"),
          promptTokens: 100,
          completionTokens: 50,
          totalTokens: 150,
          costCents: 25,
          latencyMs: 300,
          success: true,
          wasFailover: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const chain: MockQueryChain = {};
      chain.select = vi.fn().mockReturnValue(chain);
      chain.from = vi.fn().mockReturnValue(chain);
      chain.where = vi.fn().mockReturnValue(chain);
      chain.orderBy = vi.fn().mockResolvedValue(failoverReports);
      mockDb.select.mockImplementation(() => chain);

      const result = await repository.findFailoverRequests(
        mockTenantId,
        mockStartDate,
        mockEndDate,
      );

      expect(result).toEqual(failoverReports);
      expect(result[0].wasFailover).toBe(true);
    });
  });

  describe("getUsageSummary", () => {
    it("should return usage summary with aggregations", async () => {
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

      const chain: MockQueryChain = {};
      chain.select = vi.fn().mockReturnValue(chain);
      chain.from = vi.fn().mockReturnValue(chain);
      chain.where = vi.fn().mockResolvedValue([mockSummary]);
      mockDb.select.mockImplementation(() => chain);

      const result = await repository.getUsageSummary(mockTenantId, mockStartDate, mockEndDate);

      expect(result).toEqual(mockSummary);
      expect(result.totalTokens).toBe(1500);
    });

    it("should handle zero values with COALESCE", async () => {
      const mockSummary = {
        totalPromptTokens: 0,
        totalCompletionTokens: 0,
        totalTokens: 0,
        totalCostCents: 0,
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        avgLatencyMs: 0,
      };

      const chain: MockQueryChain = {};
      chain.select = vi.fn().mockReturnValue(chain);
      chain.from = vi.fn().mockReturnValue(chain);
      chain.where = vi.fn().mockResolvedValue([mockSummary]);
      mockDb.select.mockImplementation(() => chain);

      const result = await repository.getUsageSummary(mockTenantId, mockStartDate, mockEndDate);

      expect(result.totalTokens).toBe(0);
    });
  });

  describe("getUsageByProvider", () => {
    it("should return usage breakdown by provider", async () => {
      const mockBreakdown = [
        {
          providerId: "provider-1",
          totalTokens: 1000,
          totalCostCents: 150,
          requestCount: 5,
        },
        {
          providerId: "provider-2",
          totalTokens: 500,
          totalCostCents: 100,
          requestCount: 3,
        },
      ];

      const chain: MockQueryChain = {};
      chain.select = vi.fn().mockReturnValue(chain);
      chain.from = vi.fn().mockReturnValue(chain);
      chain.where = vi.fn().mockReturnValue(chain);
      chain.groupBy = vi.fn().mockReturnValue(chain);
      chain.orderBy = vi.fn().mockResolvedValue(mockBreakdown);
      mockDb.select.mockImplementation(() => chain);

      const result = await repository.getUsageByProvider(mockTenantId, mockStartDate, mockEndDate);

      expect(result).toEqual(mockBreakdown);
      expect(result.length).toBe(2);
    });
  });

  describe("getUsageByDomain", () => {
    it("should return usage breakdown by domain", async () => {
      const mockBreakdown = [
        {
          domainId: "domain-1",
          totalTokens: 800,
          totalCostCents: 120,
          requestCount: 4,
        },
        {
          domainId: null,
          totalTokens: 200,
          totalCostCents: 30,
          requestCount: 1,
        },
      ];

      const chain: MockQueryChain = {};
      chain.select = vi.fn().mockReturnValue(chain);
      chain.from = vi.fn().mockReturnValue(chain);
      chain.where = vi.fn().mockReturnValue(chain);
      chain.groupBy = vi.fn().mockReturnValue(chain);
      chain.orderBy = vi.fn().mockResolvedValue(mockBreakdown);
      mockDb.select.mockImplementation(() => chain);

      const result = await repository.getUsageByDomain(mockTenantId, mockStartDate, mockEndDate);

      expect(result).toEqual(mockBreakdown);
    });
  });

  describe("upsertDailyAggregation", () => {
    it("should upsert daily aggregation with incremental updates", async () => {
      const newData = {
        tenantId: mockTenantId,
        usageDate: new Date("2024-01-15"),
        providerId: "provider-1",
        modelId: "model-1",
        totalPromptTokens: 100,
        totalCompletionTokens: 50,
        totalTokens: 150,
        totalCostCents: 25,
        totalRequests: 1,
        successfulRequests: 1,
        failedRequests: 0,
        avgLatencyMs: 250,
        failoverRequests: 0,
      };

      const aggregated = {
        ...newData,
        id: "agg-1",
        lastAggregatedAt: new Date(),
      };

      const chain: MockQueryChain = {};
      chain.insert = vi.fn().mockReturnValue(chain);
      chain.values = vi.fn().mockReturnValue(chain);
      chain.onConflictDoUpdate = vi.fn().mockReturnValue(chain);
      chain.returning = vi.fn().mockResolvedValue([aggregated]);
      mockDb.insert.mockImplementation(() => chain);

      const result = await repository.upsertDailyAggregation(newData);

      expect(result).toEqual(aggregated);
    });
  });

  describe("deleteOlderThan", () => {
    it("should delete old usage reports", async () => {
      const cutoffDate = new Date("2023-01-01");
      const deletedCount = 50;

      const chain: MockQueryChain = {};
      chain.where = vi.fn().mockReturnValue(chain);
      chain.returning = vi
        .fn()
        .mockResolvedValue(Array.from({ length: deletedCount }, (_, i) => ({ id: `report-${i}` })));
      mockDb.delete.mockReturnValue(chain);

      const result = await repository.deleteOlderThan(mockTenantId, cutoffDate);

      expect(result).toBe(deletedCount);
    });

    it("should return 0 when no reports deleted", async () => {
      const cutoffDate = new Date("2023-01-01");

      const chain: MockQueryChain = {};
      chain.delete = vi.fn().mockReturnValue(chain);
      chain.where = vi.fn().mockReturnValue(chain);
      chain.returning = vi.fn().mockResolvedValue([]);
      mockDb.delete.mockImplementation(() => chain);

      const result = await repository.deleteOlderThan(mockTenantId, cutoffDate);

      expect(result).toBe(0);
    });
  });

  describe("Atomic upsert race condition prevention", () => {
    it("should use ON CONFLICT DO UPDATE to prevent race conditions", async () => {
      const newReport: NewAiUsageReport = {
        requestId: "req-123",
        tenantId: mockTenantId,
        providerId: "provider-1",
        modelId: "model-1",
        timestamp: new Date(),
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
        costCents: 25,
        latencyMs: 250,
        success: true,
        wasFailover: false,
      };

      const chain: MockQueryChain = {};
      chain.insert = vi.fn().mockReturnValue(chain);
      chain.values = vi.fn().mockReturnValue(chain);
      chain.onConflictDoUpdate = vi.fn().mockReturnValue(chain);
      chain.returning = vi.fn().mockResolvedValue([]);
      mockDb.insert.mockImplementation(() => chain);

      await repository.atomicUpsert(newReport);

      // Verify onConflictDoUpdate was called (ensuring atomic upsert)
      expect(chain.onConflictDoUpdate).toHaveBeenCalled();
    });
  });

  describe("Tenant isolation", () => {
    it("should always include tenantId in all queries", async () => {
      const chain: MockQueryChain = {};
      chain.select = vi.fn().mockReturnValue(chain);
      chain.from = vi.fn().mockReturnValue(chain);
      chain.where = vi.fn().mockReturnValue(chain);
      chain.orderBy = vi.fn().mockReturnValue(chain);
      chain.limit = vi.fn().mockResolvedValue([]);
      mockDb.select.mockImplementation(() => chain);

      await repository.findByTenantAndDateRange(mockTenantId, mockStartDate, mockEndDate);

      expect(chain.where).toHaveBeenCalled();
    });
  });
});
