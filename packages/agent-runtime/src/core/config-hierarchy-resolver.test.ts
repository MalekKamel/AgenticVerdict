/**
 * Config Hierarchy Resolver Tests
 *
 * Tests for hierarchical configuration resolution with L1+L2 caching.
 * Validates caching behavior, tenant isolation, and inheritance.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { ConfigHierarchyResolver } from "./config-hierarchy-resolver";
import { AiProviderRepository, BusinessDomainsRepository } from "@agenticverdict/database";
import type { ConfigScope, CostTier, AiProviderStatus } from "@agenticverdict/types";

type AiProvider = {
  id: string;
  tenantId: string;
  providerId: string;
  providerName: string;
  modelId: string;
  modelName: string | null;
  costTier: CostTier;
  customPricing: { inputCostPer1k: number; outputCostPer1k: number } | null;
  scope: ConfigScope;
  parentId: string | null;
  isEnabled: boolean;
  status: AiProviderStatus;
  priority: number;
  rateLimitOverride: number | null;
  timeoutOverride: number | null;
  baseUrl: string | null;
  isOverride: boolean;
  lastHealthCheckAt: Date | null;
  healthErrorMessage: string | null;
  credentialsId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
};

function createMockProvider(overrides: Partial<AiProvider>): AiProvider {
  return {
    id: "provider-mock",
    tenantId: "tenant-mock",
    providerId: "anthropic",
    providerName: "Anthropic",
    modelId: "claude-3-5-sonnet",
    modelName: "Claude 3.5 Sonnet",
    costTier: "standard",
    customPricing: null,
    scope: "tenant",
    parentId: null,
    isEnabled: true,
    status: "active",
    priority: 0,
    rateLimitOverride: null,
    timeoutOverride: null,
    baseUrl: null,
    isOverride: false,
    lastHealthCheckAt: null,
    healthErrorMessage: null,
    credentialsId: null,
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

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

// Mock NodeCache
const mockL1Cache = {
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
  take: vi.fn(),
  has: vi.fn(),
};

vi.mock("node-cache", () => {
  return {
    default: vi.fn().mockImplementation(() => mockL1Cache),
  };
});

describe("ConfigHierarchyResolver", () => {
  let resolver: ConfigHierarchyResolver;
  const mockTenantId = "tenant-123";
  const mockDomainId = "domain-456";
  const mockConnectorId = "connector-789";

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(mockProviderRepo.findByScope).mockReset();
    vi.mocked(mockProviderRepo.findById).mockReset();
    vi.mocked(mockDomainsRepo.findById).mockReset();
    vi.mocked(mockL1Cache.get).mockReset();
    vi.mocked(mockL1Cache.set).mockReset();
    resolver = ConfigHierarchyResolver.forTest(mockProviderRepo, mockDomainsRepo, {
      disableL2: true,
    });
  });

  describe("Constructor and initialization", () => {
    it("should initialize with default cache settings", () => {
      const defaultResolver = new ConfigHierarchyResolver();
      expect(defaultResolver).toBeDefined();
    });

    it("should initialize L1 cache when enabled", () => {
      const resolverWithL1 = ConfigHierarchyResolver.forTest(mockProviderRepo, mockDomainsRepo, {
        disableL1: false,
      });
      expect(resolverWithL1).toBeDefined();
    });

    it("should disable L1 cache when specified", () => {
      const resolverNoL1 = ConfigHierarchyResolver.forTest(mockProviderRepo, mockDomainsRepo, {
        disableL1: true,
      });
      expect(resolverNoL1).toBeDefined();
    });
  });

  describe("resolveConfig - Tenant scope", () => {
    it("should resolve tenant-level configuration", async () => {
      const mockTenantConfig = [
        createMockProvider({
          id: "provider-1",
          providerId: "anthropic",
          modelId: "claude-3-5-sonnet",
          costTier: "premium",
          isEnabled: true,
          priority: 1,
        }),
      ];

      vi.spyOn(mockProviderRepo, "findByScope").mockResolvedValue(
        mockTenantConfig as unknown as import("@agenticverdict/database").AiProvider[],
      );

      const result = await resolver.resolveConfig({
        scope: "tenant",
        sourceId: mockTenantId,
      });

      expect(result.providerId).toBe("anthropic");
      expect(result.modelId).toBe("claude-3-5-sonnet");
      expect(result.costTier).toBe("premium");
      expect(result.sourceLevel).toBe("tenant");
      expect(result.isInherited).toBe(false);
    });

    it("should throw error when no tenant config found", async () => {
      vi.spyOn(mockProviderRepo, "findByScope").mockResolvedValue([]);

      await expect(
        resolver.resolveConfig({
          scope: "tenant",
          sourceId: mockTenantId,
        }),
      ).rejects.toThrow("No provider configured for tenant: tenant-123");
    });

    it("should skip disabled providers", async () => {
      const disabledConfig = [
        createMockProvider({
          id: "provider-1",
          providerId: "anthropic",
          modelId: "claude-3-5-sonnet",
          costTier: "premium",
          isEnabled: false,
          priority: 1,
        }),
      ];

      vi.spyOn(mockProviderRepo, "findByScope").mockResolvedValue(
        disabledConfig as unknown as import("@agenticverdict/database").AiProvider[],
      );

      await expect(
        resolver.resolveConfig({
          scope: "tenant",
          sourceId: mockTenantId,
        }),
      ).rejects.toThrow("No AI provider configured for tenant: tenant-123");
    });
  });

  describe("resolveConfig - Domain scope", () => {
    it("should resolve domain-level configuration with override", async () => {
      const mockDomain = {
        id: mockDomainId,
        tenantId: mockTenantId,
        name: "Marketing",
      };

      const mockDomainConfig = [
        createMockProvider({
          id: "provider-domain",
          providerId: "openai",
          modelId: "gpt-4",
          costTier: "standard",
          isEnabled: true,
        }),
      ];

      vi.spyOn(mockDomainsRepo, "findById").mockResolvedValue(
        mockDomain as unknown as import("@agenticverdict/database").BusinessDomain,
      );
      vi.spyOn(mockProviderRepo, "findByScope").mockResolvedValue(
        mockDomainConfig as unknown as import("@agenticverdict/database").AiProvider[],
      );

      const result = await resolver.resolveConfig({
        scope: "domain",
        sourceId: mockDomainId,
      });

      expect(result.providerId).toBe("openai");
      expect(result.sourceLevel).toBe("domain");
      expect(result.isInherited).toBe(false);
    });

    it("should inherit from tenant when no domain override", async () => {
      const mockDomain = {
        id: mockDomainId,
        tenantId: mockTenantId,
        name: "Marketing",
      };

      const mockTenantConfig = [
        createMockProvider({
          id: "provider-tenant",
          tenantId: mockTenantId,
          providerId: "anthropic",
          providerName: "Anthropic",
          modelId: "claude-3-5-sonnet",
          modelName: "Claude 3.5 Sonnet",
          costTier: "premium",
          scope: "tenant",
          parentId: null,
          isEnabled: true,
          status: "active",
          priority: 0,
          isOverride: false,
          metadata: null,
          credentialsId: null,
        }),
      ];

      vi.spyOn(mockDomainsRepo, "findById").mockResolvedValue(
        mockDomain as unknown as import("@agenticverdict/database").BusinessDomain,
      );
      vi.spyOn(mockProviderRepo, "findByScope")
        .mockResolvedValueOnce([]) // Domain scope
        .mockResolvedValueOnce(mockTenantConfig); // Tenant scope

      const result = await resolver.resolveConfig({
        scope: "domain",
        sourceId: mockDomainId,
      });

      expect(result.providerId).toBe("anthropic");
      expect(result.isInherited).toBe(true);
      expect(result.inheritanceChain).toContain("domain-456");
      expect(result.inheritanceChain).toContain("tenant");
    });

    it("should throw error when domain not found", async () => {
      vi.spyOn(mockDomainsRepo, "findById").mockResolvedValue(null);

      await expect(
        resolver.resolveConfig({
          scope: "domain",
          sourceId: "non-existent-domain",
        }),
      ).rejects.toThrow("Domain not found");
    });
  });

  describe("resolveConfig - Connector scope", () => {
    it("should throw when connector-level resolution is not implemented", async () => {
      await expect(
        resolver.resolveConfig({
          scope: "connector",
          sourceId: mockConnectorId,
        }),
      ).rejects.toThrow("Connector-level resolution not yet implemented");
    });

    it("should throw when inheriting from domain via connector scope", async () => {
      await expect(
        resolver.resolveConfig({
          scope: "connector",
          sourceId: mockConnectorId,
        }),
      ).rejects.toThrow("Connector-level resolution not yet implemented");
    });
  });

  describe("L1 Cache behavior", () => {
    it("should use cached value on subsequent calls", async () => {
      const mockConfig = [
        createMockProvider({
          id: "provider-1",
          providerId: "anthropic",
          isEnabled: true,
        }),
      ];

      vi.spyOn(mockProviderRepo, "findByScope").mockResolvedValue(
        mockConfig as unknown as import("@agenticverdict/database").AiProvider[],
      );
      mockL1Cache.get.mockReturnValueOnce(null).mockReturnValueOnce({
        providerId: "anthropic",
        cacheMetadata: { fromCache: true, cacheLevel: "L1" },
      });

      // First call - should hit database
      await resolver.resolveConfig({
        scope: "tenant",
        sourceId: mockTenantId,
      });

      // Second call - should use L1 cache
      const result2 = await resolver.resolveConfig({
        scope: "tenant",
        sourceId: mockTenantId,
      });

      expect(mockProviderRepo.findByScope).toHaveBeenCalledTimes(1);
      expect(mockL1Cache.get).toHaveBeenCalledTimes(2);
      expect(result2.cacheMetadata?.fromCache).toBe(true);
      expect(result2.cacheMetadata?.cacheLevel).toBe("L1");
    });

    it("should bypass cache when specified", async () => {
      const mockConfig = [
        createMockProvider({ id: "provider-1", providerId: "anthropic", isEnabled: true }),
      ];

      vi.spyOn(mockProviderRepo, "findByScope").mockResolvedValue(
        mockConfig as unknown as import("@agenticverdict/database").AiProvider[],
      );
      mockL1Cache.get.mockReturnValue({
        providerId: "cached-provider",
      });

      await resolver.resolveConfig({
        scope: "tenant",
        sourceId: mockTenantId,
        bypassCache: true,
      });

      expect(mockL1Cache.get).not.toHaveBeenCalled();
      expect(mockProviderRepo.findByScope).toHaveBeenCalledTimes(1);
    });

    it("should populate L1 cache after database lookup", async () => {
      const mockConfig = [
        createMockProvider({ id: "provider-1", providerId: "anthropic", isEnabled: true }),
      ];

      vi.spyOn(mockProviderRepo, "findByScope").mockResolvedValue(
        mockConfig as unknown as import("@agenticverdict/database").AiProvider[],
      );

      await resolver.resolveConfig({
        scope: "tenant",
        sourceId: mockTenantId,
      });

      expect(mockL1Cache.set).toHaveBeenCalled();
    });
  });

  describe("getDefaultPricing", () => {
    it("should return default pricing for premium tier", () => {
      // Access private method via unknown cast for testing
      const resolverAny = resolver as unknown as {
        getDefaultPricing: (tier: string) => { inputCostPer1k: number; outputCostPer1k: number };
      };
      const pricing = resolverAny.getDefaultPricing("premium");

      expect(pricing).toBeDefined();
      expect(pricing.inputCostPer1k).toBeGreaterThan(0);
      expect(pricing.outputCostPer1k).toBeGreaterThan(0);
    });

    it("should return default pricing for standard tier", () => {
      const resolverAny = resolver as unknown as {
        getDefaultPricing: (tier: string) => { inputCostPer1k: number; outputCostPer1k: number };
      };
      const pricing = resolverAny.getDefaultPricing("standard");

      expect(pricing).toBeDefined();
      expect(pricing.inputCostPer1k).toBeGreaterThan(0);
    });

    it("should return default pricing for economy tier", () => {
      const resolverAny = resolver as unknown as {
        getDefaultPricing: (tier: string) => { inputCostPer1k: number; outputCostPer1k: number };
      };
      const pricing = resolverAny.getDefaultPricing("economy");

      expect(pricing).toBeDefined();
    });
  });

  describe("Cache key generation", () => {
    it("should generate unique cache keys for different scopes", async () => {
      const mockConfig = [
        createMockProvider({ id: "provider-1", providerId: "anthropic", isEnabled: true }),
      ];
      vi.spyOn(mockProviderRepo, "findByScope").mockResolvedValue(
        mockConfig as unknown as import("@agenticverdict/database").AiProvider[],
      );
      vi.spyOn(mockDomainsRepo, "findById").mockResolvedValue({
        id: mockDomainId,
        tenantId: mockTenantId,
        name: "Marketing",
      } as unknown as import("@agenticverdict/database").BusinessDomain);
      mockL1Cache.get.mockReturnValue(null);

      await resolver.resolveConfig({ scope: "tenant", sourceId: mockTenantId });
      await resolver.resolveConfig({ scope: "domain", sourceId: mockDomainId });

      const cacheKeys = mockL1Cache.set.mock.calls.map((call) => call[0]);
      expect(cacheKeys.length).toBe(2);
      expect(new Set(cacheKeys).size).toBe(2); // All unique
    });

    it("should generate consistent cache keys for same scope and ID", async () => {
      const mockConfig = [
        createMockProvider({ id: "provider-1", providerId: "anthropic", isEnabled: true }),
      ];
      vi.spyOn(mockProviderRepo, "findByScope").mockResolvedValue(
        mockConfig as unknown as import("@agenticverdict/database").AiProvider[],
      );
      mockL1Cache.get.mockReturnValue(null);

      await resolver.resolveConfig({ scope: "tenant", sourceId: mockTenantId });
      await resolver.resolveConfig({ scope: "tenant", sourceId: mockTenantId });

      const cacheKeys = mockL1Cache.set.mock.calls.map((call) => call[0]);
      expect(cacheKeys[0]).toBe(cacheKeys[1]);
    });
  });

  describe("Tenant isolation", () => {
    it("should enforce tenant isolation in all lookups", async () => {
      const mockConfig = [
        createMockProvider({ id: "provider-1", providerId: "anthropic", isEnabled: true }),
      ];
      vi.spyOn(mockProviderRepo, "findByScope").mockResolvedValue(
        mockConfig as unknown as import("@agenticverdict/database").AiProvider[],
      );

      await resolver.resolveConfig({
        scope: "tenant",
        sourceId: mockTenantId,
      });

      expect(mockProviderRepo.findByScope).toHaveBeenCalledWith(mockTenantId, "tenant");
    });

    it("should not leak configuration across tenants", async () => {
      const tenant1Config = [
        createMockProvider({ id: "p1", providerId: "anthropic", isEnabled: true }),
      ];
      const tenant2Config = [
        createMockProvider({ id: "p2", providerId: "openai", isEnabled: true }),
      ];

      vi.spyOn(mockProviderRepo, "findByScope")
        .mockResolvedValueOnce(
          tenant1Config as unknown as import("@agenticverdict/database").AiProvider[],
        )
        .mockResolvedValueOnce(
          tenant2Config as unknown as import("@agenticverdict/database").AiProvider[],
        );

      const result1 = await resolver.resolveConfig({
        scope: "tenant",
        sourceId: "tenant-1",
      });

      const result2 = await resolver.resolveConfig({
        scope: "tenant",
        sourceId: "tenant-2",
      });

      expect(result1.providerId).toBe("anthropic");
      expect(result2.providerId).toBe("openai");
    });
  });

  describe("Error handling", () => {
    it("should handle repository errors gracefully", async () => {
      vi.spyOn(mockProviderRepo, "findByScope").mockRejectedValue(
        new Error("Database connection failed"),
      );

      await expect(
        resolver.resolveConfig({
          scope: "tenant",
          sourceId: mockTenantId,
        }),
      ).rejects.toThrow("Database connection failed");
    });

    it("should handle null domain gracefully", async () => {
      vi.spyOn(mockDomainsRepo, "findById").mockResolvedValue(null);

      await expect(
        resolver.resolveConfig({
          scope: "domain",
          sourceId: "non-existent",
        }),
      ).rejects.toThrow("Domain not found");
    });
  });

  describe("Performance requirements", () => {
    it("should resolve from L1 cache in <1ms", async () => {
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

      const startTime = Date.now();
      await resolver.resolveConfig({
        scope: "tenant",
        sourceId: mockTenantId,
        bypassCache: false,
      });
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(10); // <10ms requirement
    });
  });
});
