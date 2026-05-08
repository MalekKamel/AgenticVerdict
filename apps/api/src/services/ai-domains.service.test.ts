/**
 * AI Domains Service Tests
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { AiDomainsService } from "./ai-domains.service";
import { BusinessDomainsRepository } from "@agenticverdict/database";

const mockRepository = {
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

describe("AiDomainsService", () => {
  let service: AiDomainsService;
  const mockTenantId = "tenant-123";

  beforeEach(() => {
    vi.clearAllMocks();
    service = AiDomainsService.forTest(mockRepository);
  });

  describe("getDomainsForTenant", () => {
    it("should return all domains for tenant", async () => {
      const mockDomains = [
        { id: "domain-1", tenantId: mockTenantId, name: "Marketing" },
        { id: "domain-2", tenantId: mockTenantId, name: "Sales" },
      ];

      vi.spyOn(mockRepository, "findAllByTenant").mockResolvedValue(mockDomains as unknown);

      const result = await service.getDomainsForTenant(mockTenantId);

      expect(result).toEqual(mockDomains);
    });
  });

  describe("getDomainById", () => {
    it("should return domain by ID", async () => {
      const mockDomain = { id: "domain-123", tenantId: mockTenantId, name: "Marketing" };

      vi.spyOn(mockRepository, "findById").mockResolvedValue(mockDomain as unknown);

      const result = await service.getDomainById(mockTenantId, "domain-123");

      expect(result).toEqual(mockDomain);
    });

    it("should throw error when not found", async () => {
      vi.spyOn(mockRepository, "findById").mockResolvedValue(null);

      await expect(service.getDomainById(mockTenantId, "non-existent")).rejects.toThrow(
        "Domain not found",
      );
    });
  });

  describe("createDomain", () => {
    it("should create new domain", async () => {
      const domainData = { name: "Marketing", order: 1 };
      const createdDomain = { id: "domain-new", tenantId: mockTenantId, ...domainData };

      vi.spyOn(mockRepository, "isNameUnique").mockResolvedValue(true);
      vi.spyOn(mockRepository, "create").mockResolvedValue(createdDomain as unknown);

      const result = await service.createDomain(mockTenantId, domainData);

      expect(result).toEqual(createdDomain);
    });

    it("should throw error when name not unique", async () => {
      const domainData = { name: "Existing", order: 1 };

      vi.spyOn(mockRepository, "isNameUnique").mockResolvedValue(false);

      await expect(service.createDomain(mockTenantId, domainData)).rejects.toThrow(
        "Domain name already exists",
      );
    });

    it("should detect circular reference", async () => {
      const domainData = {
        name: "Child",
        parentId: "00000000-0000-0000-0000-000000000001",
        order: 2,
      };

      vi.spyOn(mockRepository, "isNameUnique").mockResolvedValue(true);
      vi.spyOn(mockRepository, "findById").mockResolvedValue({
        id: "00000000-0000-0000-0000-000000000001",
      } as unknown);
      vi.spyOn(mockRepository, "wouldCreateCycle").mockResolvedValue(true);

      await expect(service.createDomain(mockTenantId, domainData)).rejects.toThrow(
        "Cannot create circular domain hierarchy",
      );
    });
  });

  describe("updateDomain", () => {
    it("should update existing domain", async () => {
      const existing = { id: "domain-123", tenantId: mockTenantId, name: "Marketing" };
      const updateData = { name: "Updated Marketing" };
      const updated = { ...existing, ...updateData };

      vi.spyOn(mockRepository, "findById").mockResolvedValue(existing as unknown);
      vi.spyOn(mockRepository, "isNameUnique").mockResolvedValue(true);
      vi.spyOn(mockRepository, "update").mockResolvedValue(updated as unknown);

      const result = await service.updateDomain(mockTenantId, "domain-123", updateData);

      expect(result).toEqual(updated);
    });

    it("should throw error when domain not found", async () => {
      vi.spyOn(mockRepository, "findById").mockResolvedValue(null);

      await expect(
        service.updateDomain(mockTenantId, "non-existent", { name: "Updated" }),
      ).rejects.toThrow("Domain not found");
    });
  });

  describe("deleteDomain", () => {
    it("should delete domain without children", async () => {
      vi.spyOn(mockRepository, "findById").mockResolvedValue({ id: "domain-123" } as unknown);
      vi.spyOn(mockRepository, "hasChildren").mockResolvedValue(false);
      vi.spyOn(mockRepository, "delete").mockResolvedValue(true);

      const result = await service.deleteDomain(mockTenantId, "domain-123");

      expect(result).toEqual({ success: true, hasChildren: false, hasConnectors: false });
    });

    it("should return failure when domain has children", async () => {
      vi.spyOn(mockRepository, "findById").mockResolvedValue({ id: "domain-123" } as unknown);
      vi.spyOn(mockRepository, "hasChildren").mockResolvedValue(true);

      const result = await service.deleteDomain(mockTenantId, "domain-123");

      expect(result).toEqual({ success: false, hasChildren: true, hasConnectors: false });
    });
  });

  describe("assignConnectorToDomain", () => {
    it("should assign connector to domain", async () => {
      const assignment = {
        id: "assign-1",
        tenantId: mockTenantId,
        domainId: "domain-123",
        connectorId: "connector-456",
      };

      vi.spyOn(mockRepository, "assignConnector").mockResolvedValue(assignment as unknown);

      const result = await service.assignConnectorToDomain(
        mockTenantId,
        "domain-123",
        "connector-456",
      );

      expect(result).toEqual(assignment);
    });
  });

  describe("getDomainTree", () => {
    it("should return domain hierarchy tree", async () => {
      const mockTree = [
        { id: "domain-root", name: "Root", parentId: null },
        { id: "domain-child", name: "Child", parentId: "domain-root" },
      ];

      vi.spyOn(mockRepository, "getHierarchyTree").mockResolvedValue(mockTree as unknown);

      const result = await service.getDomainTree(mockTenantId);

      expect(result).toEqual(mockTree);
    });
  });

  describe("Tenant isolation", () => {
    it("should always include tenantId in queries", async () => {
      vi.spyOn(mockRepository, "findById").mockResolvedValue(null);

      await expect(service.getDomainById(mockTenantId, "domain-123")).rejects.toThrow(
        "Domain not found",
      );

      expect(mockRepository.findById).toHaveBeenCalledWith(mockTenantId, "domain-123");
    });
  });
});
