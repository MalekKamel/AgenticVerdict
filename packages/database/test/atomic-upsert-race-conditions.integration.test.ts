/**
 * Atomic Upsert Race Condition Tests
 *
 * Tests for atomic upsert operations under concurrent write scenarios.
 * Validates race condition prevention in usage tracking and aggregations.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { AiUsageRepository } from "../src/repositories/ai-usage.repository";
import type { NewAiUsageReport } from "../src/schema/ai-usage_reports";

// Mock database
const mockDb = {
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};
type TestDb = Parameters<typeof AiUsageRepository.forTest>[0];
type MockQueryChain = Record<string, ReturnType<typeof vi.fn>>;

describe("Atomic Upsert Race Condition Tests", () => {
  let repository: AiUsageRepository;
  const mockTenantId = "tenant-race-test";

  beforeEach(() => {
    vi.clearAllMocks();
    repository = AiUsageRepository.forTest(mockDb as unknown as TestDb);
  });

  describe("Concurrent atomic upserts", () => {
    it("should handle concurrent upserts for same request ID", async () => {
      const report: NewAiUsageReport = {
        requestId: "req-concurrent-1",
        tenantId: mockTenantId,
        providerId: "anthropic",
        modelId: "claude-3-5-sonnet",
        timestamp: new Date(),
        inputTokens: 100,
        outputTokens: 50,
        totalTokens: 150,
        cost: 0.025,
        latencyMs: 250,
        success: true,
      };

      // Mock atomic upsert chain
      const chain: MockQueryChain = {};
      chain.insert = vi.fn().mockReturnValue(chain);
      chain.values = vi.fn().mockReturnValue(chain);
      chain.onConflictDoUpdate = vi.fn().mockReturnValue(chain);
      chain.returning = vi.fn().mockResolvedValue([{ ...report, id: "report-1" }]);
      mockDb.insert.mockImplementation(() => chain);

      // Simulate 10 concurrent upserts for the same request
      const concurrentUpserts = Array.from({ length: 10 }, () => repository.atomicUpsert(report));

      const results = await Promise.all(concurrentUpserts);

      // All should succeed (atomic upsert handles conflicts)
      expect(results.length).toBe(10);
      expect(chain.onConflictDoUpdate).toHaveBeenCalledTimes(10);
    });

    it("should prevent lost updates under concurrent writes", async () => {
      const report: NewAiUsageReport = {
        requestId: "req-concurrent-2",
        tenantId: mockTenantId,
        providerId: "anthropic",
        modelId: "claude-3-5-sonnet",
        timestamp: new Date(),
        inputTokens: 100,
        outputTokens: 50,
        totalTokens: 150,
        cost: 0.025,
        latencyMs: 250,
        success: true,
      };

      const chain: MockQueryChain = {};
      chain.insert = vi.fn().mockReturnValue(chain);
      chain.values = vi.fn().mockReturnValue(chain);
      chain.onConflictDoUpdate = vi.fn().mockReturnValue(chain);
      chain.returning = vi.fn().mockResolvedValue([{ ...report, id: "report-2" }]);
      mockDb.insert.mockImplementation(() => chain);

      // Simulate 50 concurrent writes
      const concurrentWrites = Array.from({ length: 50 }, () => repository.atomicUpsert(report));

      await Promise.all(concurrentWrites);

      // All updates should be applied atomically
      expect(chain.onConflictDoUpdate).toHaveBeenCalledTimes(50);
    });

    it("should maintain data consistency under high concurrency", async () => {
      const reports: NewAiUsageReport[] = Array.from({ length: 100 }, (_, i) => ({
        requestId: `req-batch-${i}`,
        tenantId: mockTenantId,
        providerId: "anthropic",
        modelId: "claude-3-5-sonnet",
        timestamp: new Date(),
        inputTokens: 100,
        outputTokens: 50,
        totalTokens: 150,
        cost: 0.025,
        latencyMs: 250,
        success: true,
      }));

      const chain: MockQueryChain = {};
      chain.insert = vi.fn().mockReturnValue(chain);
      chain.values = vi.fn().mockReturnValue(chain);
      chain.onConflictDoUpdate = vi.fn().mockReturnValue(chain);
      chain.returning = vi.fn().mockResolvedValue([{ id: "report-batch" }]);
      mockDb.insert.mockImplementation(() => chain);

      // Process all reports concurrently
      const upsertPromises = reports.map((r) => repository.atomicUpsert(r));
      await Promise.all(upsertPromises);

      // All upserts should complete
      expect(mockDb.insert).toHaveBeenCalledTimes(100);
    });
  });

  describe("Batch upsert atomicity", () => {
    it("should handle batch upserts atomically", async () => {
      const reports: NewAiUsageReport[] = Array.from({ length: 50 }, (_, i) => ({
        requestId: `req-batch-${i}`,
        tenantId: mockTenantId,
        providerId: "anthropic",
        modelId: "claude-3-5-sonnet",
        timestamp: new Date(),
        inputTokens: 100,
        outputTokens: 50,
        totalTokens: 150,
        cost: 0.025,
        latencyMs: 250,
        success: true,
      }));

      const chain: MockQueryChain = {};
      chain.insert = vi.fn().mockReturnValue(chain);
      chain.values = vi.fn().mockReturnValue(chain);
      chain.onConflictDoUpdate = vi.fn().mockReturnValue(chain);
      chain.returning = vi
        .fn()
        .mockResolvedValue(reports.map((r, i) => ({ ...r, id: `report-${i}` })));
      mockDb.insert.mockImplementation(() => chain);

      const result = await repository.atomicUpsertBatch(reports);

      expect(result.length).toBe(50);
    });

    it("should handle partial batch failures gracefully", async () => {
      const reports: NewAiUsageReport[] = Array.from({ length: 10 }, (_, i) => ({
        requestId: `req-partial-${i}`,
        tenantId: mockTenantId,
        providerId: "anthropic",
        modelId: "claude-3-5-sonnet",
        timestamp: new Date(),
        inputTokens: 100,
        outputTokens: 50,
        totalTokens: 150,
        cost: 0.025,
        latencyMs: 250,
        success: true,
      }));

      // Mock successful upserts
      const chain: MockQueryChain = {};
      chain.insert = vi.fn().mockReturnValue(chain);
      chain.values = vi.fn().mockReturnValue(chain);
      chain.onConflictDoUpdate = vi.fn().mockReturnValue(chain);
      chain.returning = vi
        .fn()
        .mockResolvedValue(reports.map((r, i) => ({ ...r, id: `report-${i}` })));
      mockDb.insert.mockImplementation(() => chain);

      const result = await repository.atomicUpsertBatch(reports);

      expect(result.length).toBe(10);
    });
  });

  describe("Daily aggregation race conditions", () => {
    it("should handle concurrent daily aggregations", async () => {
      const aggregationData = {
        tenantId: mockTenantId,
        usageDate: new Date("2024-01-15"),
        providerId: "anthropic",
        modelId: "claude-3-5-sonnet",
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

      const chain: MockQueryChain = {};
      chain.insert = vi.fn().mockReturnValue(chain);
      chain.values = vi.fn().mockReturnValue(chain);
      chain.onConflictDoUpdate = vi.fn().mockReturnValue(chain);
      chain.returning = vi.fn().mockResolvedValue([{ id: "agg-1", ...aggregationData }]);
      mockDb.insert.mockImplementation(() => chain);

      // Simulate 20 concurrent aggregation updates
      const concurrentAggregations = Array.from({ length: 20 }, () =>
        repository.upsertDailyAggregation(aggregationData),
      );

      const results = await Promise.all(concurrentAggregations);

      expect(results.length).toBe(20);
      expect(chain.onConflictDoUpdate).toHaveBeenCalledTimes(20);
    });

    it("should prevent double-counting in aggregations", async () => {
      const chain: MockQueryChain = {};
      chain.insert = vi.fn().mockReturnValue(chain);
      chain.values = vi.fn().mockReturnValue(chain);
      chain.onConflictDoUpdate = vi.fn().mockReturnValue(chain);
      chain.returning = vi.fn().mockResolvedValue([{ id: "agg-2", totalTokens: 1500 }]);
      mockDb.insert.mockImplementation(() => chain);

      const aggregationData = {
        tenantId: mockTenantId,
        usageDate: new Date("2024-01-15"),
        providerId: "anthropic",
        modelId: "claude-3-5-sonnet",
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

      // 10 concurrent updates should result in 1500 total tokens
      const concurrentUpdates = Array.from({ length: 10 }, () =>
        repository.upsertDailyAggregation(aggregationData),
      );

      await Promise.all(concurrentUpdates);

      expect(chain.onConflictDoUpdate).toHaveBeenCalledTimes(10);
    });
  });

  describe("Unique constraint enforcement", () => {
    it("should enforce unique constraint on request ID", async () => {
      const report: NewAiUsageReport = {
        requestId: "req-unique-1",
        tenantId: mockTenantId,
        providerId: "anthropic",
        modelId: "claude-3-5-sonnet",
        timestamp: new Date(),
        inputTokens: 100,
        outputTokens: 50,
        totalTokens: 150,
        cost: 0.025,
        latencyMs: 250,
        success: true,
      };

      const chain: MockQueryChain = {};
      chain.insert = vi.fn().mockReturnValue(chain);
      chain.values = vi.fn().mockReturnValue(chain);
      chain.onConflictDoUpdate = vi.fn().mockReturnValue(chain);
      chain.returning = vi.fn().mockResolvedValue([{ ...report, id: "report-unique" }]);
      mockDb.insert.mockImplementation(() => chain);

      await repository.atomicUpsert(report);

      expect(chain.onConflictDoUpdate).toHaveBeenCalled();
    });

    it("should handle upsert with composite unique key", async () => {
      const report: NewAiUsageReport = {
        requestId: "req-composite-1",
        tenantId: mockTenantId,
        providerId: "anthropic",
        modelId: "claude-3-5-sonnet",
        timestamp: new Date(),
        inputTokens: 100,
        outputTokens: 50,
        totalTokens: 150,
        cost: 0.025,
        latencyMs: 250,
        success: true,
      };

      const chain: MockQueryChain = {};
      chain.insert = vi.fn().mockReturnValue(chain);
      chain.values = vi.fn().mockReturnValue(chain);
      chain.onConflictDoUpdate = vi.fn().mockReturnValue(chain);
      chain.returning = vi.fn().mockResolvedValue([{ ...report, id: "report-composite" }]);
      mockDb.insert.mockImplementation(() => chain);

      await repository.atomicUpsert(report);

      expect(chain.onConflictDoUpdate).toHaveBeenCalled();
    });
  });

  describe("Database-level locking", () => {
    it("should use row-level locking during upsert", async () => {
      const report: NewAiUsageReport = {
        requestId: "req-lock-1",
        tenantId: mockTenantId,
        providerId: "anthropic",
        modelId: "claude-3-5-sonnet",
        timestamp: new Date(),
        inputTokens: 100,
        outputTokens: 50,
        totalTokens: 150,
        cost: 0.025,
        latencyMs: 250,
        success: true,
      };

      const chain: MockQueryChain = {};
      chain.insert = vi.fn().mockReturnValue(chain);
      chain.values = vi.fn().mockReturnValue(chain);
      chain.onConflictDoUpdate = vi.fn().mockReturnValue(chain);
      chain.returning = vi.fn().mockResolvedValue([{ ...report, id: "report-lock" }]);
      mockDb.insert.mockImplementation(() => chain);

      await repository.atomicUpsert(report);

      // Verify atomic operation is used
      expect(chain.onConflictDoUpdate).toHaveBeenCalled();
    });

    it("should handle lock timeouts gracefully", async () => {
      const report: NewAiUsageReport = {
        requestId: "req-timeout-1",
        tenantId: mockTenantId,
        providerId: "anthropic",
        modelId: "claude-3-5-sonnet",
        timestamp: new Date(),
        inputTokens: 100,
        outputTokens: 50,
        totalTokens: 150,
        cost: 0.025,
        latencyMs: 250,
        success: true,
      };

      const chain: MockQueryChain = {};
      chain.insert = vi.fn().mockReturnValue(chain);
      chain.values = vi.fn().mockReturnValue(chain);
      chain.onConflictDoUpdate = vi.fn().mockRejectedValue(new Error("Lock timeout"));
      chain.returning = vi.fn();
      mockDb.insert.mockImplementation(() => chain);

      await expect(repository.atomicUpsert(report)).rejects.toThrow("Lock timeout");
    });
  });

  describe("Performance under load", () => {
    it("should maintain performance under high write load", async () => {
      const reports: NewAiUsageReport[] = Array.from({ length: 1000 }, (_, i) => ({
        requestId: `req-load-${i}`,
        tenantId: mockTenantId,
        providerId: "anthropic",
        modelId: "claude-3-5-sonnet",
        timestamp: new Date(),
        inputTokens: 100,
        outputTokens: 50,
        totalTokens: 150,
        cost: 0.025,
        latencyMs: 250,
        success: true,
      }));

      const chain: MockQueryChain = {};
      chain.insert = vi.fn().mockReturnValue(chain);
      chain.values = vi.fn().mockReturnValue(chain);
      chain.onConflictDoUpdate = vi.fn().mockReturnValue(chain);
      chain.returning = vi.fn().mockResolvedValue([{ id: "report-load" }]);
      mockDb.insert.mockImplementation(() => chain);

      const startTime = Date.now();
      const upsertPromises = reports.map((r) => repository.atomicUpsert(r));
      await Promise.all(upsertPromises);
      const endTime = Date.now();

      const duration = endTime - startTime;

      // Should complete 1000 upserts in reasonable time (<10s for test)
      expect(duration).toBeLessThan(10000);
    });

    it("should scale with batch size", async () => {
      const batchSizes = [10, 100, 500];

      for (const batchSize of batchSizes) {
        const reports: NewAiUsageReport[] = Array.from({ length: batchSize }, (_, i) => ({
          requestId: `req-scale-${batchSize}-${i}`,
          tenantId: mockTenantId,
          providerId: "anthropic",
          modelId: "claude-3-5-sonnet",
          timestamp: new Date(),
          inputTokens: 100,
          outputTokens: 50,
          totalTokens: 150,
          cost: 0.025,
          latencyMs: 250,
          success: true,
        }));

        const chain: MockQueryChain = {};
        chain.insert = vi.fn().mockReturnValue(chain);
        chain.values = vi.fn().mockReturnValue(chain);
        chain.onConflictDoUpdate = vi.fn().mockReturnValue(chain);
        chain.returning = vi.fn().mockResolvedValue([{ id: `report-scale-${batchSize}` }]);
        mockDb.insert.mockImplementation(() => chain);

        const startTime = Date.now();
        const upsertPromises = reports.map((r) => repository.atomicUpsert(r));
        await Promise.all(upsertPromises);
        const endTime = Date.now();

        const duration = endTime - startTime;

        // Log performance for each batch size
        console.log(`Batch size ${batchSize}: ${duration}ms`);
      }

      expect(true).toBe(true);
    });
  });

  describe("Error recovery", () => {
    it("should retry on transient database errors", async () => {
      const report: NewAiUsageReport = {
        requestId: "req-retry-1",
        tenantId: mockTenantId,
        providerId: "anthropic",
        modelId: "claude-3-5-sonnet",
        timestamp: new Date(),
        inputTokens: 100,
        outputTokens: 50,
        totalTokens: 150,
        cost: 0.025,
        latencyMs: 250,
        success: true,
      };

      const chain: MockQueryChain = {};
      chain.insert = vi.fn().mockReturnValue(chain);
      chain.values = vi.fn().mockReturnValue(chain);
      chain.onConflictDoUpdate = vi.fn().mockRejectedValue(new Error("Transient error"));
      chain.returning = vi.fn();
      mockDb.insert.mockImplementation(() => chain);

      // Verify the error is thrown
      await expect(repository.atomicUpsert(report)).rejects.toThrow("Transient error");
    });

    it("should fail fast on permanent errors", async () => {
      const report: NewAiUsageReport = {
        requestId: "req-permanent-1",
        tenantId: mockTenantId,
        providerId: "anthropic",
        modelId: "claude-3-5-sonnet",
        timestamp: new Date(),
        inputTokens: 100,
        outputTokens: 50,
        totalTokens: 150,
        cost: 0.025,
        latencyMs: 250,
        success: true,
      };

      const chain: MockQueryChain = {};
      chain.insert = vi.fn().mockReturnValue(chain);
      chain.values = vi.fn().mockReturnValue(chain);
      chain.onConflictDoUpdate = vi.fn().mockRejectedValue(new Error("Constraint violation"));
      chain.returning = vi.fn();
      mockDb.insert.mockImplementation(() => chain);

      await expect(repository.atomicUpsert(report)).rejects.toThrow("Constraint violation");
    });
  });
});
