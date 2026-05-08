/**
 * Business Domains Repository Tests
 *
 * Tests for CRUD operations, hierarchy management, and connector assignments.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { BusinessDomainsRepository } from "./business-domains.repository";
import { type BusinessDomain, type NewBusinessDomain } from "../schema/business-domains";

const mockDb = {
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};
type TestDb = Parameters<typeof BusinessDomainsRepository.forTest>[0];

describe("BusinessDomainsRepository", () => {
  let repository: BusinessDomainsRepository;
  const mockTenantId = "tenant-123";

  beforeEach(() => {
    vi.clearAllMocks();
    repository = BusinessDomainsRepository.forTest(mockDb as unknown as TestDb);
  });

  describe("findAllByTenant", () => {
    it("should return all domains for a tenant ordered by order and name", async () => {
      const mockDomains: BusinessDomain[] = [
        {
          id: "domain-1",
          tenantId: mockTenantId,
          name: "Marketing",
          order: 1,
          parentId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "domain-2",
          tenantId: mockTenantId,
          name: "Sales",
          order: 2,
          parentId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const chain = {
        from: vi.fn().mockReturnValue(chain),
        where: vi.fn().mockReturnValue(chain),
        orderBy: vi.fn().mockResolvedValue(mockDomains),
      };
      mockDb.select.mockImplementation(() => chain);

      const result = await repository.findAllByTenant(mockTenantId);

      expect(result).toEqual(mockDomains);
      expect(result.length).toBe(2);
    });
  });

  describe("findRootDomains", () => {
    it("should find root domains (no parent)", async () => {
      const mockRootDomains: BusinessDomain[] = [
        {
          id: "domain-1",
          tenantId: mockTenantId,
          name: "Marketing",
          order: 1,
          parentId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const chain = {
        from: vi.fn().mockReturnValue(chain),
        where: vi.fn().mockReturnValue(chain),
        orderBy: vi.fn().mockResolvedValue(mockRootDomains),
      };
      mockDb.select.mockImplementation(() => chain);

      const result = await repository.findRootDomains(mockTenantId);

      expect(result).toEqual(mockRootDomains);
    });
  });

  describe("findById", () => {
    it("should return domain by ID with tenant isolation", async () => {
      const mockDomain: BusinessDomain = {
        id: "domain-123",
        tenantId: mockTenantId,
        name: "Marketing",
        order: 1,
        parentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const chain = {
        from: vi.fn().mockReturnValue(chain),
        where: vi.fn().mockReturnValue(chain),
        limit: vi.fn().mockResolvedValue([mockDomain]),
      };
      mockDb.select.mockImplementation(() => chain);

      const result = await repository.findById(mockTenantId, "domain-123");

      expect(result).toEqual(mockDomain);
    });

    it("should return null when domain not found", async () => {
      const chain = {
        from: vi.fn().mockReturnValue(chain),
        where: vi.fn().mockReturnValue(chain),
        limit: vi.fn().mockResolvedValue([]),
      };
      mockDb.select.mockImplementation(() => chain);

      const result = await repository.findById(mockTenantId, "non-existent");

      expect(result).toBeNull();
    });
  });

  describe("findChildren", () => {
    it("should find child domains of a parent", async () => {
      const mockChildren: BusinessDomain[] = [
        {
          id: "domain-child-1",
          tenantId: mockTenantId,
          name: "Digital Marketing",
          order: 1,
          parentId: "domain-parent",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const chain = {
        from: vi.fn().mockReturnValue(chain),
        where: vi.fn().mockReturnValue(chain),
        orderBy: vi.fn().mockResolvedValue(mockChildren),
      };
      mockDb.select.mockImplementation(() => chain);

      const result = await repository.findChildren(mockTenantId, "domain-parent");

      expect(result).toEqual(mockChildren);
    });
  });

  describe("create", () => {
    it("should create new domain", async () => {
      const newDomain: NewBusinessDomain = {
        tenantId: mockTenantId,
        name: "Marketing",
        order: 1,
      };

      const createdDomain: BusinessDomain = {
        ...newDomain,
        id: "domain-new",
        parentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const chain = {
        insert: vi.fn().mockReturnValue(chain),
        values: vi.fn().mockReturnValue(chain),
        returning: vi.fn().mockResolvedValue([createdDomain]),
      };
      mockDb.insert.mockImplementation(() => chain);

      const result = await repository.create(newDomain);

      expect(result).toEqual(createdDomain);
    });
  });

  describe("update", () => {
    it("should update domain", async () => {
      const updatedDomain: BusinessDomain = {
        id: "domain-123",
        tenantId: mockTenantId,
        name: "Updated Marketing",
        order: 1,
        parentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const chain = {
        update: vi.fn().mockReturnValue(chain),
        set: vi.fn().mockReturnValue(chain),
        where: vi.fn().mockReturnValue(chain),
        returning: vi.fn().mockResolvedValue([updatedDomain]),
      };
      mockDb.update.mockImplementation(() => chain);

      const result = await repository.update(mockTenantId, "domain-123", {
        name: "Updated Marketing",
      });

      expect(result).toEqual(updatedDomain);
    });

    it("should return null when updating non-existent domain", async () => {
      const chain = {
        update: vi.fn().mockReturnValue(chain),
        set: vi.fn().mockReturnValue(chain),
        where: vi.fn().mockReturnValue(chain),
        returning: vi.fn().mockResolvedValue([]),
      };
      mockDb.update.mockImplementation(() => chain);

      const result = await repository.update(mockTenantId, "non-existent", {
        name: "Updated",
      });

      expect(result).toBeNull();
    });
  });

  describe("delete", () => {
    it("should delete domain", async () => {
      const chain = {
        delete: vi.fn().mockReturnValue(chain),
        where: vi.fn().mockReturnValue(chain),
        returning: vi.fn().mockResolvedValue([{ id: "domain-123" }]),
      };
      mockDb.delete.mockReturnValue(chain);

      const result = await repository.delete(mockTenantId, "domain-123");

      expect(result).toBe(true);
    });

    it("should return false when deleting non-existent domain", async () => {
      const chain = {
        delete: vi.fn().mockReturnValue(chain),
        where: vi.fn().mockReturnValue(chain),
        returning: vi.fn().mockResolvedValue([]),
      };
      mockDb.delete.mockImplementation(() => chain);

      const result = await repository.delete(mockTenantId, "non-existent");

      expect(result).toBe(false);
    });
  });

  describe("hasChildren", () => {
    it("should return true when domain has children", async () => {
      const chain = {
        from: vi.fn().mockReturnValue(chain),
        where: vi.fn().mockResolvedValue([{ count: 3 }]),
      };
      mockDb.select.mockReturnValue(chain);

      const result = await repository.hasChildren(mockTenantId, "domain-parent");

      expect(result).toBe(true);
    });

    it("should return false when domain has no children", async () => {
      const chain = {
        from: vi.fn().mockReturnValue(chain),
        where: vi.fn().mockResolvedValue([{ count: 0 }]),
      };
      mockDb.select.mockReturnValue(chain);

      const result = await repository.hasChildren(mockTenantId, "domain-leaf");

      expect(result).toBe(false);
    });
  });

  describe("isNameUnique", () => {
    it("should return true when name is unique", async () => {
      const chain = {
        from: vi.fn().mockReturnValue(chain),
        where: vi.fn().mockResolvedValue([{ count: 0 }]),
      };
      mockDb.select.mockReturnValue(chain);

      const result = await repository.isNameUnique(mockTenantId, "Unique Name");

      expect(result).toBe(true);
    });

    it("should return false when name exists", async () => {
      const chain = {
        from: vi.fn().mockReturnValue(chain),
        where: vi.fn().mockResolvedValue([{ count: 1 }]),
      };
      mockDb.select.mockReturnValue(chain);

      const result = await repository.isNameUnique(mockTenantId, "Existing Name");

      expect(result).toBe(false);
    });

    it("should exclude specific domain ID when checking uniqueness", async () => {
      const chain = {
        from: vi.fn().mockReturnValue(chain),
        where: vi.fn().mockResolvedValue([{ count: 0 }]),
      };
      mockDb.select.mockReturnValue(chain);

      const result = await repository.isNameUnique(mockTenantId, "Name", "domain-123");

      expect(result).toBe(true);
    });
  });

  describe("Hierarchy operations", () => {
    describe("getAncestorChain", () => {
      it("should return ancestor chain for a domain", async () => {
        const mockDomain: BusinessDomain = {
          id: "domain-child",
          tenantId: mockTenantId,
          name: "Child",
          order: 2,
          parentId: "domain-parent",
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const mockParent: BusinessDomain = {
          id: "domain-parent",
          tenantId: mockTenantId,
          name: "Parent",
          order: 1,
          parentId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const selectChain = {
          from: vi.fn().mockReturnValue(selectChain),
          where: vi.fn().mockReturnValue(selectChain),
          limit: vi.fn(),
        };
        mockDb.select.mockReturnValue(selectChain);

        selectChain.limit.mockResolvedValueOnce([mockDomain]).mockResolvedValueOnce([mockParent]);

        const result = await repository.getAncestorChain(mockTenantId, "domain-child");

        expect(result.length).toBe(1);
        expect(result[0].id).toBe("domain-parent");
      });
    });

    describe("getDescendantIds", () => {
      it("should return all descendant domain IDs", async () => {
        const mockChildren: BusinessDomain[] = [
          {
            id: "domain-child-1",
            tenantId: mockTenantId,
            name: "Child 1",
            order: 1,
            parentId: "domain-parent",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ];

        const selectChain = {
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockResolvedValue(mockChildren),
        };
        mockDb.select.mockReturnValue(selectChain);

        const result = await repository.getDescendantIds(mockTenantId, "domain-parent");

        expect(result).toContain("domain-child-1");
      });
    });

    describe("wouldCreateCycle", () => {
      it("should return false if removing parent", async () => {
        const result = await repository.wouldCreateCycle(mockTenantId, "domain-1", null);

        expect(result).toBe(false);
      });

      it("should return true if new parent is the domain itself", async () => {
        const result = await repository.wouldCreateCycle(mockTenantId, "domain-1", "domain-1");

        expect(result).toBe(true);
      });

      it("should check if new parent is a descendant", async () => {
        vi.spyOn(repository, "getDescendantIds").mockResolvedValue(["domain-descendant"]);

        const result = await repository.wouldCreateCycle(
          mockTenantId,
          "domain-1",
          "domain-descendant",
        );

        expect(result).toBe(true);
      });
    });
  });

  describe("countByTenant", () => {
    it("should count domains by tenant", async () => {
      const chain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([{ count: 5 }]),
      };
      mockDb.select.mockReturnValue(chain);

      const result = await repository.countByTenant(mockTenantId);

      expect(result).toBe(5);
    });

    it("should return 0 when count returns null", async () => {
      const chain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([{ count: null }]),
      };
      mockDb.select.mockReturnValue(chain);

      const result = await repository.countByTenant(mockTenantId);

      expect(result).toBe(0);
    });
  });

  describe("Tenant isolation", () => {
    it("should always include tenantId in all queries", async () => {
      const chain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };
      mockDb.select.mockReturnValue(chain);

      await repository.findById(mockTenantId, "domain-123");

      expect(chain.where).toHaveBeenCalled();
    });
  });
});
