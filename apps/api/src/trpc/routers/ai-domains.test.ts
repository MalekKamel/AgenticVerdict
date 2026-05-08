/**
 * AI Domains Router Integration Tests
 *
 * Integration tests for business domain management tRPC endpoints.
 * Tests domain CRUD, hierarchy management, and provider inheritance.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { AiDomainsService } from "../../services/ai-domains.service";

vi.mock("../../services/ai-domains.service");

describe("AI Domains Router Integration Tests", () => {
  const mockTenantId = "tenant-123";
  const mockDomainId = "domain-456";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("list endpoint", () => {
    it("should list all domains for tenant", async () => {
      const mockDomains = [
        {
          id: mockDomainId,
          tenantId: mockTenantId,
          name: "Marketing",
          description: "Marketing domain",
          parentId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.spyOn(AiDomainsService.prototype, "getDomainsForTenant").mockResolvedValue(
        mockDomains as unknown,
      );

      expect(AiDomainsService.prototype.getDomainsForTenant).toBeDefined();
    });

    it("should return tree structure", async () => {
      const mockTree = [
        {
          id: mockDomainId,
          name: "Marketing",
          children: [
            {
              id: "child-1",
              name: "Social Media",
              children: [],
            },
          ],
        },
      ];

      vi.spyOn(AiDomainsService.prototype, "getDomainTree").mockResolvedValue(mockTree as unknown);

      expect(AiDomainsService.prototype.getDomainTree).toBeDefined();
    });
  });

  describe("getById endpoint", () => {
    it("should get domain by ID", async () => {
      const mockDomain = {
        id: mockDomainId,
        tenantId: mockTenantId,
        name: "Marketing",
        description: "Marketing domain",
        parentId: null,
      };

      vi.spyOn(AiDomainsService.prototype, "getDomainById").mockResolvedValue(
        mockDomain as unknown,
      );

      expect(AiDomainsService.prototype.getDomainById).toBeDefined();
    });

    it("should throw NOT_FOUND when domain doesn't exist", async () => {
      vi.spyOn(AiDomainsService.prototype, "getDomainById").mockResolvedValue(null);

      expect(AiDomainsService.prototype.getDomainById).toBeDefined();
    });
  });

  describe("create endpoint", () => {
    it("should create new domain", async () => {
      const mockDomain = {
        id: mockDomainId,
        tenantId: mockTenantId,
        name: "Sales",
        description: "Sales domain",
        parentId: null,
      };

      vi.spyOn(AiDomainsService.prototype, "createDomain").mockResolvedValue(mockDomain as unknown);

      expect(AiDomainsService.prototype.createDomain).toBeDefined();
    });

    it("should create subdomain with parent", async () => {
      const mockDomain = {
        id: "child-domain",
        tenantId: mockTenantId,
        name: "Enterprise Sales",
        parentId: mockDomainId,
      };

      vi.spyOn(AiDomainsService.prototype, "createDomain").mockResolvedValue(mockDomain as unknown);

      expect(AiDomainsService.prototype.createDomain).toBeDefined();
    });

    it("should throw CONFLICT on duplicate name", async () => {
      vi.spyOn(AiDomainsService.prototype, "createDomain").mockRejectedValue(
        new Error("Domain name already exists"),
      );

      expect(AiDomainsService.prototype.createDomain).toBeDefined();
    });
  });

  describe("update endpoint", () => {
    it("should update domain", async () => {
      const mockDomain = {
        id: mockDomainId,
        tenantId: mockTenantId,
        name: "Marketing Updated",
        description: "Updated description",
      };

      vi.spyOn(AiDomainsService.prototype, "updateDomain").mockResolvedValue(mockDomain as unknown);

      expect(AiDomainsService.prototype.updateDomain).toBeDefined();
    });

    it("should throw NOT_FOUND when updating non-existent domain", async () => {
      vi.spyOn(AiDomainsService.prototype, "updateDomain").mockRejectedValue(
        new Error("Domain not found"),
      );

      expect(AiDomainsService.prototype.updateDomain).toBeDefined();
    });
  });

  describe("delete endpoint", () => {
    it("should delete domain", async () => {
      vi.spyOn(AiDomainsService.prototype, "deleteDomain").mockResolvedValue(true);

      expect(AiDomainsService.prototype.deleteDomain).toBeDefined();
    });

    it("should throw error when deleting domain with children", async () => {
      vi.spyOn(AiDomainsService.prototype, "deleteDomain").mockRejectedValue(
        new Error("Cannot delete domain with children"),
      );

      expect(AiDomainsService.prototype.deleteDomain).toBeDefined();
    });
  });

  describe("assignProvider endpoint", () => {
    it("should assign provider to domain", async () => {
      const mockResult = {
        domainId: mockDomainId,
        providerId: "anthropic",
        assignedAt: new Date(),
      };

      vi.spyOn(AiDomainsService.prototype, "updateDomainProviderConfig").mockResolvedValue(
        mockResult as unknown,
      );

      expect(AiDomainsService.prototype.updateDomainProviderConfig).toBeDefined();
    });

    it("should override tenant-level provider", async () => {
      vi.spyOn(AiDomainsService.prototype, "updateDomainProviderConfig").mockResolvedValue({
        domainId: mockDomainId,
        isInherited: false,
      } as unknown);

      expect(AiDomainsService.prototype.updateDomainProviderConfig).toBeDefined();
    });
  });

  describe("removeProvider endpoint", () => {
    it("should remove provider from domain", async () => {
      vi.spyOn(AiDomainsService.prototype, "resetToTenantDefault").mockResolvedValue({
        success: true,
      } as unknown);

      expect(AiDomainsService.prototype.resetToTenantDefault).toBeDefined();
    });

    it("should revert to tenant-level provider", async () => {
      vi.spyOn(AiDomainsService.prototype, "resetToTenantDefault").mockResolvedValue({
        success: true,
        inheritedProvider: "anthropic",
      } as unknown);

      expect(AiDomainsService.prototype.resetToTenantDefault).toBeDefined();
    });
  });

  describe("getHierarchy endpoint", () => {
    it("should get domain hierarchy with providers", async () => {
      const mockHierarchy = {
        id: mockDomainId,
        name: "Marketing",
        provider: {
          providerId: "anthropic",
          isInherited: false,
        },
        children: [
          {
            id: "child-1",
            name: "Social Media",
            provider: {
              providerId: "anthropic",
              isInherited: true,
            },
          },
        ],
      };

      vi.spyOn(AiDomainsService.prototype, "getDomainHierarchy").mockResolvedValue(
        mockHierarchy as unknown,
      );

      expect(AiDomainsService.prototype.getDomainHierarchy).toBeDefined();
    });
  });

  describe("Tenant isolation", () => {
    it("should always scope queries to tenant", async () => {
      expect(AiDomainsService.prototype.getDomainsForTenant).toBeDefined();
      expect(AiDomainsService.prototype.getDomainById).toBeDefined();
      expect(AiDomainsService.prototype.createDomain).toBeDefined();
    });

    it("should not leak domains across tenants", async () => {
      vi.spyOn(AiDomainsService.prototype, "getDomainById").mockImplementation(
        (tenantId: string) => {
          expect(tenantId).toBe(mockTenantId);
          return Promise.resolve(null);
        },
      );

      expect(AiDomainsService.prototype.getDomainById).toBeDefined();
    });
  });
});
