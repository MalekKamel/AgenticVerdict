/**
 * AI Provider Service Tests
 *
 * Tests for business logic, validation, and error handling.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { AiProviderService } from "./ai-provider.service";
import { AiProviderRepository } from "@agenticverdict/database";
// Mock repository
const mockRepository = {
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

describe("AiProviderService", () => {
  let service: AiProviderService;
  const mockTenantId = "tenant-123";

  beforeEach(() => {
    vi.clearAllMocks();
    service = AiProviderService.forTest(mockRepository);
  });

  describe("getProvidersForTenant", () => {
    it("should return all providers for tenant", async () => {
      const mockProviders = [
        {
          id: "provider-1",
          tenantId: mockTenantId,
          providerId: "anthropic",
          providerName: "anthropic",
          modelId: "claude-3",
          status: "active" as const,
          createdAt: new Date(),
          updatedAt: new Date(),
          priority: 1,
          isEnabled: true,
          scope: "tenant",
          modelName: "claude-3",
          costTier: "standard",
          isOverride: false,
          metadata: null,
          customPricing: null,
          baseUrl: null,
          rateLimitOverride: null,
          timeoutOverride: null,
          credentialsId: null,
          lastUsedAt: null,
          lastError: null,
        },
      ];

      vi.spyOn(mockRepository, "findAllByTenant").mockResolvedValue(mockProviders as unknown);

      const result = await service.getProvidersForTenant(mockTenantId);

      expect(result).toEqual(mockProviders);
      expect(mockRepository.findAllByTenant).toHaveBeenCalledWith(mockTenantId);
    });
  });

  describe("getProviderById", () => {
    it("should return provider by ID", async () => {
      const mockProvider = {
        id: "provider-123",
        tenantId: mockTenantId,
        providerId: "anthropic",
        providerName: "anthropic",
        modelId: "claude-3",
        status: "active" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        priority: 1,
        isEnabled: true,
        scope: "tenant",
        modelName: "claude-3",
        costTier: "standard",
        isOverride: false,
        metadata: null,
        customPricing: null,
        baseUrl: null,
        rateLimitOverride: null,
        timeoutOverride: null,
        credentialsId: null,
        lastUsedAt: null,
        lastError: null,
      };

      vi.spyOn(mockRepository, "findById").mockResolvedValue(mockProvider as unknown);

      const result = await service.getProviderById(mockTenantId, "provider-123");

      expect(result).toEqual(mockProvider);
      expect(mockRepository.findById).toHaveBeenCalledWith(mockTenantId, "provider-123");
    });

    it("should return null when provider not found", async () => {
      vi.spyOn(mockRepository, "findById").mockResolvedValue(null);

      const result = await service.getProviderById(mockTenantId, "non-existent");

      expect(result).toBeNull();
    });
  });

  describe("createProvider", () => {
    it("should create new provider configuration", async () => {
      const inputData = {
        providerId: "anthropic",
        modelId: "claude-3-5-sonnet",
        costTier: "premium" as const,
        isEnabled: true,
        priority: 1,
      };

      const createdProvider = {
        id: "provider-new",
        tenantId: mockTenantId,
        providerId: "anthropic",
        providerName: "anthropic",
        modelId: "claude-3-5-sonnet",
        modelName: "claude-3-5-sonnet",
        costTier: "premium" as const,
        isEnabled: true,
        priority: 1,
        scope: "tenant",
        status: "active" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        isOverride: false,
        metadata: null,
        customPricing: null,
        baseUrl: null,
        rateLimitOverride: null,
        timeoutOverride: null,
        credentialsId: null,
        lastUsedAt: null,
        lastError: null,
      };

      vi.spyOn(mockRepository, "findByScope").mockResolvedValue([] as unknown);
      vi.spyOn(mockRepository, "create").mockResolvedValue(createdProvider as unknown);

      const result = await service.createProvider(mockTenantId, inputData);

      expect(result).toEqual(createdProvider);
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: mockTenantId,
          providerId: "anthropic",
          scope: "tenant",
        }),
      );
    });

    it("should throw error when provider already exists", async () => {
      const inputData = {
        providerId: "anthropic",
        modelId: "claude-3-5-sonnet",
        costTier: "premium" as const,
        isEnabled: true,
        priority: 1,
      };

      const existingProviders = [{ id: "provider-existing", providerId: "anthropic" } as unknown];

      vi.spyOn(mockRepository, "findByScope").mockResolvedValue(existingProviders as unknown);

      await expect(service.createProvider(mockTenantId, inputData)).rejects.toThrow(
        "Provider already configured for tenant",
      );
    });

    it("should validate input with Zod schema", async () => {
      const invalidData = {
        providerId: "", // Invalid: empty string
        modelId: "claude-3-5-sonnet",
        costTier: "premium",
      };

      await expect(service.createProvider(mockTenantId, invalidData as unknown)).rejects.toThrow();
    });
  });

  describe("updateProvider", () => {
    it("should update existing provider", async () => {
      const existingProvider = {
        id: "provider-123",
        tenantId: mockTenantId,
        providerName: "anthropic",
        isEnabled: true,
      };

      const updateData = {
        isEnabled: false,
        priority: 2,
      };

      const updatedProvider = {
        ...existingProvider,
        ...updateData,
      };

      vi.spyOn(mockRepository, "findById").mockResolvedValue(existingProvider as unknown);
      vi.spyOn(mockRepository, "update").mockResolvedValue(updatedProvider as unknown);

      const result = await service.updateProvider(mockTenantId, "provider-123", updateData);

      expect(result).toEqual(updatedProvider);
      expect(mockRepository.update).toHaveBeenCalledWith(
        mockTenantId,
        "provider-123",
        expect.objectContaining(updateData),
      );
    });

    it("should throw error when provider not found", async () => {
      vi.spyOn(mockRepository, "findById").mockResolvedValue(null);

      await expect(
        service.updateProvider(mockTenantId, "non-existent", { isEnabled: false }),
      ).rejects.toThrow("Provider not found");
    });

    it("should validate update data with Zod schema", async () => {
      const existingProvider = { id: "provider-123", tenantId: mockTenantId };
      const invalidData = { priority: -1 }; // Invalid: negative priority

      vi.spyOn(mockRepository, "findById").mockResolvedValue(existingProvider as unknown);

      await expect(
        service.updateProvider(mockTenantId, "provider-123", invalidData as unknown),
      ).rejects.toThrow(); // Zod validation error
    });
  });

  describe("deleteProvider", () => {
    it("should delete provider", async () => {
      vi.spyOn(mockRepository, "delete").mockResolvedValue(true);

      const result = await service.deleteProvider(mockTenantId, "provider-123");

      expect(result).toBe(true);
      expect(mockRepository.delete).toHaveBeenCalledWith(mockTenantId, "provider-123");
    });

    it("should return false when provider not found", async () => {
      vi.spyOn(mockRepository, "delete").mockResolvedValue(false);

      const result = await service.deleteProvider(mockTenantId, "non-existent");

      expect(result).toBe(false);
    });
  });

  describe("toggleProvider", () => {
    it("should enable provider", async () => {
      const provider = { id: "provider-123", tenantId: mockTenantId } as unknown;
      const toggledProvider = { ...provider, isEnabled: true } as unknown;

      vi.spyOn(mockRepository, "findById").mockResolvedValue(provider as unknown);
      vi.spyOn(mockRepository, "toggleEnabled").mockResolvedValue(toggledProvider as unknown);

      const result = await service.toggleProvider(mockTenantId, "provider-123", true);

      expect(result).toEqual(toggledProvider);
      expect(mockRepository.toggleEnabled).toHaveBeenCalledWith(mockTenantId, "provider-123", true);
    });

    it("should disable provider", async () => {
      const provider = { id: "provider-123", tenantId: mockTenantId } as unknown;
      const toggledProvider = { ...provider, isEnabled: false } as unknown;

      vi.spyOn(mockRepository, "findById").mockResolvedValue(provider as unknown);
      vi.spyOn(mockRepository, "toggleEnabled").mockResolvedValue(toggledProvider as unknown);

      const result = await service.toggleProvider(mockTenantId, "provider-123", false);

      expect(result).toEqual(toggledProvider);
    });

    it("should throw error when provider not found", async () => {
      vi.spyOn(mockRepository, "findById").mockResolvedValue(null);

      await expect(service.toggleProvider(mockTenantId, "non-existent", true)).rejects.toThrow(
        "Provider not found",
      );
    });
  });

  describe("configureCredentials", () => {
    it("should configure provider credentials", async () => {
      const provider = {
        id: "provider-123",
        tenantId: mockTenantId,
        providerId: "anthropic",
        providerName: "anthropic",
        modelId: "claude-3",
        status: "active" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        priority: 1,
        isEnabled: true,
        scope: "tenant",
        modelName: "claude-3",
        costTier: "standard",
        isOverride: false,
        metadata: null,
        customPricing: null,
        baseUrl: null,
        rateLimitOverride: null,
        timeoutOverride: null,
        credentialsId: null,
        lastUsedAt: null,
        lastError: null,
      };

      const credentialsData = {
        providerId: "anthropic",
        apiKey: "sk-ant-123456",
      };

      vi.spyOn(mockRepository, "findByScope").mockResolvedValue([provider] as unknown);
      vi.spyOn(mockRepository, "update").mockResolvedValue({ id: "provider-123" } as unknown);

      const result = await service.configureCredentials(mockTenantId, credentialsData);

      expect(result).toBeDefined();
      expect(mockRepository.update).toHaveBeenCalled();
    });

    it("should throw error for invalid API key format", async () => {
      const invalidCredentials = {
        providerId: "anthropic",
        apiKey: "", // Invalid: empty
      };

      await expect(
        service.configureCredentials(mockTenantId, invalidCredentials as unknown),
      ).rejects.toThrow(); // Zod validation error
    });
  });

  describe("testConnectivity", () => {
    it("should test provider connectivity", async () => {
      const provider = {
        id: "provider-123",
        tenantId: mockTenantId,
        providerName: "anthropic",
        isEnabled: true,
      } as unknown;

      vi.spyOn(mockRepository, "findById").mockResolvedValue(provider as unknown);
      vi.spyOn(mockRepository, "updateHealth").mockResolvedValue(provider as unknown);

      const result = await service.testConnectivity(mockTenantId, "provider-123");

      expect(result.success).toBe(true);
      expect(result.latencyMs).toBeDefined();
      expect(mockRepository.updateHealth).toHaveBeenCalledWith(
        mockTenantId,
        "provider-123",
        "active",
      );
    });

    it("should handle connectivity failure", async () => {
      const provider = { id: "provider-123", tenantId: mockTenantId };

      vi.spyOn(mockRepository, "findById").mockResolvedValue(provider as unknown);
      vi.spyOn(mockRepository, "updateHealth").mockResolvedValue(provider as unknown);

      // Mock the simulateHealthCheck to throw
      vi.spyOn(service as unknown, "simulateHealthCheck").mockRejectedValue(
        new Error("Connection failed"),
      );

      const result = await service.testConnectivity(mockTenantId, "provider-123");

      expect(result.success).toBe(false);
      expect(result.errorMessage).toBeDefined();
    });

    it("should throw error when provider not found", async () => {
      vi.spyOn(mockRepository, "findById").mockResolvedValue(null);

      await expect(service.testConnectivity(mockTenantId, "non-existent")).rejects.toThrow(
        "Provider not found",
      );
    });
  });

  describe("getActiveProviders", () => {
    it("should return only active and enabled providers", async () => {
      const activeProviders = [
        { id: "provider-1", isEnabled: true, status: "active" },
        { id: "provider-2", isEnabled: true, status: "active" },
      ];

      vi.spyOn(mockRepository, "getActiveProviders").mockResolvedValue(activeProviders as unknown);

      const result = await service.getActiveProviders(mockTenantId);

      expect(result).toEqual(activeProviders);
      expect(result.length).toBe(2);
    });
  });

  describe("Tenant isolation", () => {
    it("should always pass tenantId to repository methods", async () => {
      vi.spyOn(mockRepository, "findById").mockResolvedValue(null);

      await service.getProviderById(mockTenantId, "provider-123");

      expect(mockRepository.findById).toHaveBeenCalledWith(mockTenantId, "provider-123");
    });
  });
});
