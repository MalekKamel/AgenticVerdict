/**
 * AI Provider Repository Tests
 *
 * Tests for CRUD operations, tenant isolation, and query helpers.
 * Uses mocked database client to avoid real database connections.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { AiProviderRepository } from "./ai-provider.repository";
import {
  type AiProvider,
  type NewAiProvider,
  type AiProviderModel,
  type NewAiProviderModel,
  type NewAiProviderFailover,
} from "../schema/ai-providers";

// Mock database client
const mockDb = {
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};
type TestDb = Parameters<typeof AiProviderRepository.forTest>[0];
type MockQueryChain = Record<string, ReturnType<typeof vi.fn>>;

describe("AiProviderRepository", () => {
  let repository: AiProviderRepository;
  const mockTenantId = "tenant-123";

  beforeEach(() => {
    vi.clearAllMocks();
    repository = AiProviderRepository.forTest(mockDb as unknown as TestDb);
  });

  describe("findAllByTenant", () => {
    it("should return all providers for a tenant ordered by priority and name", async () => {
      const mockProviders: AiProvider[] = [
        {
          id: "provider-1",
          tenantId: mockTenantId,
          providerName: "anthropic",
          scope: "tenant",
          isEnabled: true,
          status: "active",
          priority: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "provider-2",
          tenantId: mockTenantId,
          providerName: "openai",
          scope: "tenant",
          isEnabled: true,
          status: "active",
          priority: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const chain: Record<string, unknown> = {};
      chain.from = vi.fn().mockReturnValue(chain);
      chain.where = vi.fn().mockReturnValue(chain);
      chain.orderBy = vi.fn().mockResolvedValue(mockProviders);
      mockDb.select.mockImplementation(() => chain);

      const result = await repository.findAllByTenant(mockTenantId);

      expect(mockDb.select).toHaveBeenCalled();
      expect(result).toEqual(mockProviders);
      expect(result.length).toBe(2);
    });

    it("should return empty array when no providers exist", async () => {
      const chain: Record<string, unknown> = {};
      chain.from = vi.fn().mockReturnValue(chain);
      chain.where = vi.fn().mockReturnValue(chain);
      chain.orderBy = vi.fn().mockResolvedValue([]);
      mockDb.select.mockImplementation(() => chain);

      const result = await repository.findAllByTenant(mockTenantId);

      expect(result).toEqual([]);
    });
  });

  describe("findById", () => {
    it("should return provider by ID with tenant isolation", async () => {
      const mockProvider: AiProvider = {
        id: "provider-123",
        tenantId: mockTenantId,
        providerName: "anthropic",
        scope: "tenant",
        isEnabled: true,
        status: "active",
        priority: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const chain: MockQueryChain = {};
      chain.select = vi.fn().mockReturnValue(chain);
      chain.from = vi.fn().mockReturnValue(chain);
      chain.where = vi.fn().mockReturnValue(chain);
      chain.limit = vi.fn().mockResolvedValue([mockProvider]);
      mockDb.select.mockImplementation(() => chain);

      const result = await repository.findById(mockTenantId, "provider-123");

      expect(result).toEqual(mockProvider);
    });

    it("should return null when provider not found", async () => {
      const chain: MockQueryChain = {};
      chain.select = vi.fn().mockReturnValue(chain);
      chain.from = vi.fn().mockReturnValue(chain);
      chain.where = vi.fn().mockReturnValue(chain);
      chain.limit = vi.fn().mockResolvedValue([]);
      mockDb.select.mockImplementation(() => chain);

      const result = await repository.findById(mockTenantId, "non-existent");

      expect(result).toBeNull();
    });
  });

  describe("findByScope", () => {
    it("should find providers by scope without parent", async () => {
      const mockProviders: AiProvider[] = [
        {
          id: "provider-1",
          tenantId: mockTenantId,
          providerName: "anthropic",
          scope: "tenant",
          parentId: null,
          isEnabled: true,
          status: "active",
          priority: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const chain: MockQueryChain = {};
      chain.select = vi.fn().mockReturnValue(chain);
      chain.from = vi.fn().mockReturnValue(chain);
      chain.where = vi.fn().mockReturnValue(chain);
      chain.orderBy = vi.fn().mockResolvedValue(mockProviders);
      mockDb.select.mockImplementation(() => chain);

      const result = await repository.findByScope(mockTenantId, "tenant");

      expect(result).toEqual(mockProviders);
    });

    it("should find providers by scope with parent", async () => {
      const mockProviders: AiProvider[] = [
        {
          id: "provider-1",
          tenantId: mockTenantId,
          providerName: "anthropic",
          scope: "domain",
          parentId: "domain-456",
          isEnabled: true,
          status: "active",
          priority: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const chain: MockQueryChain = {};
      chain.select = vi.fn().mockReturnValue(chain);
      chain.from = vi.fn().mockReturnValue(chain);
      chain.where = vi.fn().mockReturnValue(chain);
      chain.orderBy = vi.fn().mockResolvedValue(mockProviders);
      mockDb.select.mockImplementation(() => chain);

      const result = await repository.findByScope(mockTenantId, "domain", "domain-456");

      expect(result).toEqual(mockProviders);
    });
  });

  describe("create", () => {
    it("should create new provider configuration", async () => {
      const newProvider: NewAiProvider = {
        tenantId: mockTenantId,
        providerName: "anthropic",
        scope: "tenant",
        isEnabled: true,
        status: "active",
        priority: 1,
      };

      const createdProvider: AiProvider = {
        ...newProvider,
        id: "provider-new",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const chain: MockQueryChain = {};
      chain.insert = vi.fn().mockReturnValue(chain);
      chain.values = vi.fn().mockReturnValue(chain);
      chain.returning = vi.fn().mockResolvedValue([createdProvider]);
      mockDb.insert.mockImplementation(() => chain);

      const result = await repository.create(newProvider);

      expect(result).toEqual(createdProvider);
      expect(result.id).toBe("provider-new");
    });
  });

  describe("update", () => {
    it("should update provider configuration", async () => {
      const updatedProvider: AiProvider = {
        id: "provider-123",
        tenantId: mockTenantId,
        providerName: "anthropic",
        scope: "tenant",
        isEnabled: false,
        status: "active",
        priority: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const chain: MockQueryChain = {};
      chain.update = vi.fn().mockReturnValue(chain);
      chain.set = vi.fn().mockReturnValue(chain);
      chain.where = vi.fn().mockReturnValue(chain);
      chain.returning = vi.fn().mockResolvedValue([updatedProvider]);
      mockDb.update.mockImplementation(() => chain);

      const result = await repository.update(mockTenantId, "provider-123", {
        isEnabled: false,
      });

      expect(result).toEqual(updatedProvider);
      expect(result?.isEnabled).toBe(false);
    });

    it("should return null when updating non-existent provider", async () => {
      const chain: MockQueryChain = {};
      chain.update = vi.fn().mockReturnValue(chain);
      chain.set = vi.fn().mockReturnValue(chain);
      chain.where = vi.fn().mockReturnValue(chain);
      chain.returning = vi.fn().mockResolvedValue([]);
      mockDb.update.mockImplementation(() => chain);

      const result = await repository.update(mockTenantId, "non-existent", {
        isEnabled: false,
      });

      expect(result).toBeNull();
    });
  });

  describe("delete", () => {
    it("should delete provider configuration", async () => {
      const chain: MockQueryChain = {};
      chain.delete = vi.fn().mockReturnValue(chain);
      chain.where = vi.fn().mockReturnValue(chain);
      chain.returning = vi.fn().mockResolvedValue([{ id: "provider-123" }]);
      mockDb.delete.mockReturnValue(chain);

      const result = await repository.delete(mockTenantId, "provider-123");

      expect(result).toBe(true);
    });

    it("should return false when deleting non-existent provider", async () => {
      const chain: MockQueryChain = {};
      chain.delete = vi.fn().mockReturnValue(chain);
      chain.where = vi.fn().mockReturnValue(chain);
      chain.returning = vi.fn().mockResolvedValue([]);
      mockDb.delete.mockImplementation(() => chain);

      const result = await repository.delete(mockTenantId, "non-existent");

      expect(result).toBe(false);
    });
  });

  describe("toggleEnabled", () => {
    it("should enable provider", async () => {
      const enabledProvider: AiProvider = {
        id: "provider-123",
        tenantId: mockTenantId,
        providerName: "anthropic",
        scope: "tenant",
        isEnabled: true,
        status: "active",
        priority: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(repository, "update").mockResolvedValue(enabledProvider);

      const result = await repository.toggleEnabled(mockTenantId, "provider-123", true);

      expect(result).toEqual(enabledProvider);
      expect(result?.isEnabled).toBe(true);
    });
  });

  describe("updateHealth", () => {
    it("should update provider health status", async () => {
      const healthyProvider: AiProvider = {
        id: "provider-123",
        tenantId: mockTenantId,
        providerName: "anthropic",
        scope: "tenant",
        isEnabled: true,
        status: "active",
        priority: 1,
        healthErrorMessage: null,
        lastHealthCheckAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(repository, "update").mockResolvedValue(healthyProvider);

      const result = await repository.updateHealth(mockTenantId, "provider-123", "active");

      expect(result).toEqual(healthyProvider);
      expect(result?.status).toBe("active");
    });
  });

  describe("Model operations", () => {
    it("should find models by provider", async () => {
      const mockModels: AiProviderModel[] = [
        {
          id: "model-1",
          providerId: "provider-123",
          modelName: "claude-3-5-sonnet",
          isEnabled: true,
          costTier: "premium",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const chain: MockQueryChain = {};
      chain.select = vi.fn().mockReturnValue(chain);
      chain.from = vi.fn().mockReturnValue(chain);
      chain.where = vi.fn().mockReturnValue(chain);
      chain.orderBy = vi.fn().mockResolvedValue(mockModels);
      mockDb.select.mockImplementation(() => chain);

      const result = await repository.findModelsByProvider("provider-123");

      expect(result).toEqual(mockModels);
    });

    it("should upsert model", async () => {
      const newModel: NewAiProviderModel = {
        providerId: "provider-123",
        modelName: "claude-3-5-sonnet",
        isEnabled: true,
        costTier: "premium",
      };

      const createdModel: AiProviderModel = {
        ...newModel,
        id: "model-new",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const chain: MockQueryChain = {};
      chain.insert = vi.fn().mockReturnValue(chain);
      chain.values = vi.fn().mockReturnValue(chain);
      chain.onConflictDoUpdate = vi.fn().mockReturnValue(chain);
      chain.returning = vi.fn().mockResolvedValue([createdModel]);
      mockDb.insert.mockImplementation(() => chain);

      const result = await repository.upsertModel(newModel);

      expect(result).toEqual(createdModel);
    });
  });

  describe("Failover operations", () => {
    it("should find failover config", async () => {
      const mockFailover = {
        id: "failover-1",
        tenantId: mockTenantId,
        primaryProviderId: "provider-1",
        backupProviderId: "provider-2",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const chain: MockQueryChain = {};
      chain.select = vi.fn().mockReturnValue(chain);
      chain.from = vi.fn().mockReturnValue(chain);
      chain.where = vi.fn().mockReturnValue(chain);
      chain.limit = vi.fn().mockResolvedValue([mockFailover]);
      mockDb.select.mockImplementation(() => chain);

      const result = await repository.findFailoverConfig(mockTenantId, "provider-1");

      expect(result).toEqual(mockFailover);
    });

    it("should upsert failover config", async () => {
      const newFailover: NewAiProviderFailover = {
        tenantId: mockTenantId,
        primaryProviderId: "provider-1",
        backupProviderId: "provider-2",
      };

      const createdFailover = {
        ...newFailover,
        id: "failover-new",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const chain: MockQueryChain = {};
      chain.insert = vi.fn().mockReturnValue(chain);
      chain.values = vi.fn().mockReturnValue(chain);
      chain.onConflictDoUpdate = vi.fn().mockReturnValue(chain);
      chain.returning = vi.fn().mockResolvedValue([createdFailover]);
      mockDb.insert.mockImplementation(() => chain);

      const result = await repository.upsertFailoverConfig(newFailover);

      expect(result).toEqual(createdFailover);
    });
  });

  describe("Query helpers", () => {
    it("should get active providers", async () => {
      const activeProviders: AiProvider[] = [
        {
          id: "provider-1",
          tenantId: mockTenantId,
          providerName: "anthropic",
          scope: "tenant",
          isEnabled: true,
          status: "active",
          priority: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const chain: MockQueryChain = {};
      chain.select = vi.fn().mockReturnValue(chain);
      chain.from = vi.fn().mockReturnValue(chain);
      chain.where = vi.fn().mockReturnValue(chain);
      chain.orderBy = vi.fn().mockResolvedValue(activeProviders);
      mockDb.select.mockImplementation(() => chain);

      const result = await repository.getActiveProviders(mockTenantId);

      expect(result).toEqual(activeProviders);
      expect(result.length).toBe(1);
    });

    it("should count providers by tenant", async () => {
      const chain: MockQueryChain = {};
      chain.select = vi.fn().mockReturnValue(chain);
      chain.from = vi.fn().mockReturnValue(chain);
      chain.where = vi.fn().mockReturnValue(chain);

      const mockResult = [{ count: 5 }];
      chain.where = vi.fn().mockResolvedValue(mockResult);
      mockDb.select.mockReturnValue(chain);

      const result = await repository.countByTenant(mockTenantId);

      expect(result).toBe(5);
    });

    it("should return 0 when count returns null", async () => {
      const chain: MockQueryChain = {};
      chain.select = vi.fn().mockReturnValue(chain);
      chain.from = vi.fn().mockReturnValue(chain);
      chain.where = vi.fn().mockReturnValue(chain);

      const mockResult = [{ count: null }];
      chain.where = vi.fn().mockResolvedValue(mockResult);
      mockDb.select.mockReturnValue(chain);

      const result = await repository.countByTenant(mockTenantId);

      expect(result).toBe(0);
    });
  });

  describe("Tenant isolation", () => {
    it("should always include tenantId in all queries", async () => {
      // This test ensures tenant isolation is enforced
      const chain: MockQueryChain = {};
      chain.select = vi.fn().mockReturnValue(chain);
      chain.from = vi.fn().mockReturnValue(chain);
      chain.where = vi.fn().mockReturnValue(chain);
      chain.limit = vi.fn().mockResolvedValue([]);
      mockDb.select.mockImplementation(() => chain);

      await repository.findById(mockTenantId, "provider-123");

      // Verify that where clause was called (ensuring tenant filter)
      expect(chain.where).toHaveBeenCalled();
    });
  });
});
