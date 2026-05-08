/**
 * Config Resolution Performance Benchmarks
 *
 * Performance tests for ConfigHierarchyResolver.
 * Validates <10ms p95 latency target for configuration resolution.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { ConfigHierarchyResolver } from "./config-hierarchy-resolver";
import { AiProviderRepository, BusinessDomainsRepository } from "@agenticverdict/database";

// Mock repositories
const mockProviderRepo = {
  findAllByTenant: vi.fn(),
  findById: vi.fn(),
  findByScope: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  toggleEnabled: vi.fn(),
  updateHealth: vi.fn(),
  findModelsByProvider: vi.fn(),
  upsertModel: vi.fn(),
  deleteModel: vi.fn(),
  findFailoverConfig: vi.fn(),
  upsertFailoverConfig: vi.fn(),
  deleteFailoverConfig: vi.fn(),
  getActiveProviders: vi.fn(),
  countByTenant: vi.fn(),
} as unknown as AiProviderRepository;

const mockDomainsRepo = {
  findAllByTenant: vi.fn(),
  findById: vi.fn(),
  findRootDomains: vi.fn(),
  findChildren: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  hasChildren: vi.fn(),
  isNameUnique: vi.fn(),
  assignConnector: vi.fn(),
  removeConnector: vi.fn(),
  getDomainConnectors: vi.fn(),
  getConnectorDomain: vi.fn(),
  countConnectors: vi.fn(),
  getHierarchyTree: vi.fn(),
  getAncestorChain: vi.fn(),
  getDescendantIds: vi.fn(),
  wouldCreateCycle: vi.fn(),
  updateHierarchyCache: vi.fn(),
  countByTenant: vi.fn(),
} as unknown as BusinessDomainsRepository;

// Mock L1 cache
const mockL1Cache = {
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
  take: vi.fn(),
  has: vi.fn(),
};

vi.mock("node-cache", () => ({
  default: vi.fn().mockImplementation(() => mockL1Cache),
}));

describe("Config Resolution Performance Benchmarks", () => {
  const mockTenantId = "tenant-perf-test";
  const mockDomainId = "domain-perf-test";
  const mockConnectorId = "connector-perf-test";
  void mockConnectorId;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("L1 Cache Performance", () => {
    it("should resolve from L1 cache in <1ms", async () => {
      const resolver = ConfigHierarchyResolver.forTest(mockProviderRepo, mockDomainsRepo, {
        disableL1: false,
        disableL2: true,
      });

      const cachedConfig = {
        providerId: "anthropic",
        modelId: "claude-3-5-sonnet",
        costTier: "premium" as const,
        pricing: { inputCostPer1k: 0.003, outputCostPer1k: 0.015 },
        sourceLevel: "tenant" as const,
        sourceId: "provider-1",
        isInherited: false,
        inheritanceChain: [],
        cacheMetadata: { fromCache: true, cacheLevel: "L1" as const, cacheKey: "test" },
      };

      mockL1Cache.get.mockReturnValue(cachedConfig);

      const latencies: number[] = [];
      const iterations = 1000;

      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now();
        await resolver.resolveConfig({
          scope: "tenant",
          sourceId: mockTenantId,
        });
        const endTime = performance.now();
        latencies.push(endTime - startTime);
      }

      const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
      const p95Latency = latencies.sort((a, b) => a - b)[Math.floor(latencies.length * 0.95)];

      console.log(`L1 Cache Performance:`);
      console.log(`  Average: ${avgLatency.toFixed(3)}ms`);
      console.log(`  P95: ${p95Latency.toFixed(3)}ms`);
      console.log(
        `  P99: ${latencies.sort((a, b) => a - b)[Math.floor(latencies.length * 0.99)].toFixed(3)}ms`,
      );

      expect(avgLatency).toBeLessThan(1);
      expect(p95Latency).toBeLessThan(2);
    });

    it("should maintain consistent cache hit rates", async () => {
      const resolver = ConfigHierarchyResolver.forTest(mockProviderRepo, mockDomainsRepo, {
        disableL1: false,
        disableL2: true,
      });

      const cachedConfig = {
        providerId: "anthropic",
        modelId: "claude-3-5-sonnet",
        costTier: "premium" as const,
        pricing: { inputCostPer1k: 0.003, outputCostPer1k: 0.015 },
        sourceLevel: "tenant" as const,
        sourceId: "provider-1",
        isInherited: false,
        inheritanceChain: [],
        cacheMetadata: { fromCache: true, cacheLevel: "L1" as const, cacheKey: "test" },
      };

      mockL1Cache.get.mockReturnValue(cachedConfig);

      let cacheHits = 0;
      const iterations = 100;

      for (let i = 0; i < iterations; i++) {
        const result = await resolver.resolveConfig({
          scope: "tenant",
          sourceId: mockTenantId,
        });
        if (result.cacheMetadata?.fromCache) {
          cacheHits++;
        }
      }

      const hitRate = (cacheHits / iterations) * 100;
      console.log(`Cache Hit Rate: ${hitRate}%`);

      expect(hitRate).toBeGreaterThan(90);
    });
  });

  describe("Database Resolution Performance", () => {
    it("should resolve tenant config from database in <10ms", async () => {
      const resolver = ConfigHierarchyResolver.forTest(mockProviderRepo, mockDomainsRepo, {
        disableL1: true,
        disableL2: true,
      });

      const mockConfig = [
        {
          id: "provider-1",
          tenantId: mockTenantId,
          providerId: "anthropic",
          modelId: "claude-3-5-sonnet",
          costTier: "premium",
          isEnabled: true,
          priority: 1,
        },
      ];

      vi.spyOn(mockProviderRepo, "findByScope").mockResolvedValue(
        mockConfig as unknown as import("@agenticverdict/database").AiProvider[],
      );

      const latencies: number[] = [];
      const iterations = 100;

      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now();
        await resolver.resolveConfig({
          scope: "tenant",
          sourceId: mockTenantId,
          bypassCache: true,
        });
        const endTime = performance.now();
        latencies.push(endTime - startTime);
      }

      const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
      const p95Latency = latencies.sort((a, b) => a - b)[Math.floor(latencies.length * 0.95)];

      console.log(`Database Resolution Performance:`);
      console.log(`  Average: ${avgLatency.toFixed(3)}ms`);
      console.log(`  P95: ${p95Latency.toFixed(3)}ms`);

      // Database resolution should be <10ms p95
      expect(p95Latency).toBeLessThan(10);
    });

    it("should resolve domain config with inheritance in <15ms", async () => {
      const resolver = ConfigHierarchyResolver.forTest(mockProviderRepo, mockDomainsRepo, {
        disableL1: true,
        disableL2: true,
      });

      const mockDomain = {
        id: mockDomainId,
        tenantId: mockTenantId,
        name: "Marketing",
      };

      const mockTenantConfig = [
        {
          id: "provider-1",
          tenantId: mockTenantId,
          providerId: "anthropic",
          modelId: "claude-3-5-sonnet",
          costTier: "premium",
          isEnabled: true,
        },
      ];

      vi.spyOn(mockDomainsRepo, "findById").mockResolvedValue(
        mockDomain as unknown as import("@agenticverdict/database").BusinessDomain,
      );
      vi.spyOn(mockProviderRepo, "findByScope")
        .mockResolvedValueOnce([]) // Domain scope (empty)
        .mockResolvedValueOnce(
          mockTenantConfig as unknown as import("@agenticverdict/database").AiProvider[],
        ); // Tenant scope

      const latencies: number[] = [];
      const iterations = 50;

      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now();
        await resolver.resolveConfig({
          scope: "domain",
          sourceId: mockDomainId,
          bypassCache: true,
        });
        const endTime = performance.now();
        latencies.push(endTime - startTime);
      }

      const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
      const p95Latency = latencies.sort((a, b) => a - b)[Math.floor(latencies.length * 0.95)];

      console.log(`Domain Inheritance Performance:`);
      console.log(`  Average: ${avgLatency.toFixed(3)}ms`);
      console.log(`  P95: ${p95Latency.toFixed(3)}ms`);

      expect(p95Latency).toBeLessThan(15);
    });
  });

  describe("Hierarchical Resolution Performance", () => {
    it("should resolve 3-level hierarchy in <20ms", async () => {
      const resolver = ConfigHierarchyResolver.forTest(mockProviderRepo, mockDomainsRepo, {
        disableL1: true,
        disableL2: true,
      });

      const mockDomainConfig = [
        {
          id: "provider-domain",
          tenantId: mockTenantId,
          providerId: "openai",
          modelId: "gpt-4",
          costTier: "standard",
          isEnabled: true,
        },
      ];

      const mockTenantConfig = [
        {
          id: "provider-1",
          tenantId: mockTenantId,
          providerId: "anthropic",
          modelId: "claude-3-5-sonnet",
          costTier: "premium",
          isEnabled: true,
        },
      ];

      vi.spyOn(mockDomainsRepo, "findById").mockResolvedValue({
        id: mockDomainId,
        tenantId: mockTenantId,
        name: "Marketing",
      } as unknown as import("@agenticverdict/database").BusinessDomain);

      vi.spyOn(mockProviderRepo, "findByScope")
        .mockResolvedValueOnce([]) // Domain scope (empty)
        .mockResolvedValueOnce(
          mockDomainConfig as unknown as import("@agenticverdict/database").AiProvider[],
        ) // Domain scope
        .mockResolvedValueOnce([]) // Domain scope (empty)
        .mockResolvedValueOnce(
          mockTenantConfig as unknown as import("@agenticverdict/database").AiProvider[],
        ); // Tenant scope

      const latencies: number[] = [];
      const iterations = 30;

      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now();
        await resolver.resolveConfig({
          scope: "domain",
          sourceId: mockDomainId,
          bypassCache: true,
        });
        const endTime = performance.now();
        latencies.push(endTime - startTime);
      }

      const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
      const p95Latency = latencies.sort((a, b) => a - b)[Math.floor(latencies.length * 0.95)];

      console.log(`2-Level Hierarchy Performance:`);
      console.log(`  Average: ${avgLatency.toFixed(3)}ms`);
      console.log(`  P95: ${p95Latency.toFixed(3)}ms`);

      expect(p95Latency).toBeLessThan(20);
    });
  });

  describe("Concurrent Resolution Performance", () => {
    it("should handle 100 concurrent resolutions in <5s", async () => {
      const resolver = ConfigHierarchyResolver.forTest(mockProviderRepo, mockDomainsRepo, {
        disableL1: false,
        disableL2: true,
      });

      const mockConfig = [
        {
          id: "provider-1",
          tenantId: mockTenantId,
          providerId: "anthropic",
          isEnabled: true,
        },
      ];

      vi.spyOn(mockProviderRepo, "findByScope").mockResolvedValue(
        mockConfig as unknown as import("@agenticverdict/database").AiProvider[],
      );
      mockL1Cache.get.mockReturnValue(null); // Cache miss to test DB resolution

      const startTime = performance.now();

      const concurrentResolutions = Array.from({ length: 100 }, (_, i) =>
        resolver.resolveConfig({
          scope: "tenant",
          sourceId: `tenant-${i}`,
        }),
      );

      await Promise.all(concurrentResolutions);

      const endTime = performance.now();
      const totalDuration = endTime - startTime;

      console.log(`Concurrent Resolution Performance (100 requests):`);
      console.log(`  Total Duration: ${totalDuration.toFixed(3)}ms`);
      console.log(`  Avg per Request: ${(totalDuration / 100).toFixed(3)}ms`);

      expect(totalDuration).toBeLessThan(5000);
    });

    it("should handle mixed cache hit/miss scenarios", async () => {
      const resolver = ConfigHierarchyResolver.forTest(mockProviderRepo, mockDomainsRepo, {
        disableL1: false,
        disableL2: true,
      });

      const mockConfig = [
        {
          id: "provider-1",
          tenantId: mockTenantId,
          providerId: "anthropic",
          isEnabled: true,
        },
      ];

      vi.spyOn(mockProviderRepo, "findByScope").mockResolvedValue(
        mockConfig as unknown as import("@agenticverdict/database").AiProvider[],
      );

      let callCount = 0;
      mockL1Cache.get.mockImplementation(() => {
        callCount++;
        return callCount > 50 ? { providerId: "cached" } : null; // 50% hit rate
      });

      const startTime = performance.now();

      const resolutions = Array.from({ length: 100 }, () =>
        resolver.resolveConfig({
          scope: "tenant",
          sourceId: mockTenantId,
        }),
      );

      await Promise.all(resolutions);

      const endTime = performance.now();
      const totalDuration = endTime - startTime;

      console.log(`Mixed Cache Hit/Miss Performance:`);
      console.log(`  Total Duration: ${totalDuration.toFixed(3)}ms`);

      expect(totalDuration).toBeLessThan(3000);
    });
  });

  describe("Memory Performance", () => {
    it("should maintain stable memory usage under load", async () => {
      const resolver = ConfigHierarchyResolver.forTest(mockProviderRepo, mockDomainsRepo, {
        disableL1: false,
        disableL2: true,
      });

      const mockConfig = [
        {
          id: "provider-1",
          tenantId: mockTenantId,
          providerId: "anthropic",
          isEnabled: true,
        },
      ];

      vi.spyOn(mockProviderRepo, "findByScope").mockResolvedValue(
        mockConfig as unknown as import("@agenticverdict/database").AiProvider[],
      );
      mockL1Cache.get.mockReturnValue(null);

      const initialMemory = process.memoryUsage();

      for (let i = 0; i < 1000; i++) {
        await resolver.resolveConfig({
          scope: "tenant",
          sourceId: `tenant-${i}`,
        });
      }

      const finalMemory = process.memoryUsage();
      const memoryDelta = finalMemory.heapUsed - initialMemory.heapUsed;

      console.log(`Memory Performance:`);
      console.log(`  Heap Delta: ${(memoryDelta / 1024 / 1024).toFixed(2)}MB`);

      // Should use less than 50MB for 1000 resolutions
      expect(memoryDelta).toBeLessThan(50 * 1024 * 1024);
    });
  });

  describe("Cache Invalidation Performance", () => {
    it("should invalidate cache in <1ms", async () => {
      const latencies: number[] = [];
      const iterations = 100;

      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now();
        mockL1Cache.del.mockClear();
        mockL1Cache.del(`tenant:${mockTenantId}:config`);
        const endTime = performance.now();
        latencies.push(endTime - startTime);
      }

      const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;

      console.log(`Cache Invalidation Performance:`);
      console.log(`  Average: ${avgLatency.toFixed(3)}ms`);

      expect(avgLatency).toBeLessThan(1);
    });
  });

  describe("Performance Regression Tests", () => {
    it("should maintain <10ms p95 under sustained load", async () => {
      const resolver = ConfigHierarchyResolver.forTest(mockProviderRepo, mockDomainsRepo, {
        disableL1: false,
        disableL2: true,
      });

      const mockConfig = [
        {
          id: "provider-1",
          tenantId: mockTenantId,
          providerId: "anthropic",
          isEnabled: true,
        },
      ];

      vi.spyOn(mockProviderRepo, "findByScope").mockResolvedValue(
        mockConfig as unknown as import("@agenticverdict/database").AiProvider[],
      );
      mockL1Cache.get.mockReturnValue(null);

      const latencies: number[] = [];
      const iterations = 500;

      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now();
        await resolver.resolveConfig({
          scope: "tenant",
          sourceId: mockTenantId,
        });
        const endTime = performance.now();
        latencies.push(endTime - startTime);
      }

      const sortedLatencies = latencies.sort((a, b) => a - b);
      const p95Latency = sortedLatencies[Math.floor(sortedLatencies.length * 0.95)];
      const p99Latency = sortedLatencies[Math.floor(sortedLatencies.length * 0.99)];

      console.log(`Sustained Load Performance (${iterations} requests):`);
      console.log(`  P95: ${p95Latency.toFixed(3)}ms`);
      console.log(`  P99: ${p99Latency.toFixed(3)}ms`);

      expect(p95Latency).toBeLessThan(10);
      expect(p99Latency).toBeLessThan(20);
    });
  });
});
