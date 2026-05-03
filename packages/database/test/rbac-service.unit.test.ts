import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@agenticverdict/core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@agenticverdict/core")>();
  return {
    ...actual,
    getTenantContext: vi.fn(),
  };
});

vi.mock("../src/db-scoped", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../src/db-scoped")>();
  return {
    ...actual,
    dbScoped: vi.fn(),
  };
});

import { getTenantContext } from "@agenticverdict/core";
import { dbScoped } from "../src/db-scoped";

import type { Database } from "../src/client";
import { RBACService, createRbacService, getRbacService } from "../src/rbac-service";
import type { Permission } from "@agenticverdict/types";

describe("RBACService", () => {
  let mockDb: Database;
  let mockTx: ReturnType<typeof vi.fn>;
  let rbacService: RBACService;

  const mockUserId = "user-123";
  const mockRoleId = "role-456";
  const mockTenantId = "tenant-789";
  const mockGrantedBy = "admin-001";

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getTenantContext).mockReturnValue({
      tenantId: mockTenantId,
      config: {} as never,
      requestId: "req-123",
    });

    mockTx = vi.fn();
    mockDb = {
      select: vi.fn(),
      insert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      transaction: vi.fn(async (fn) => fn(mockTx)),
    } as unknown as Database;

    rbacService = new RBACService(mockDb);
  });

  describe("getUserRoles", () => {
    it("returns empty array when user has no roles", async () => {
      vi.mocked(dbScoped).mockImplementation(async (_, fn) => {
        return fn(mockTx);
      });

      const mockSelectChain = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      };
      mockTx.select = vi.fn().mockReturnValue(mockSelectChain);

      const result = await rbacService.getUserRoles(mockUserId);

      expect(result).toEqual([]);
      expect(dbScoped).toHaveBeenCalled();
    });

    it("returns user roles within tenant context", async () => {
      vi.mocked(dbScoped).mockImplementation(async (_, fn) => {
        return fn(mockTx);
      });

      const mockSelectChain1 = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ roleId: mockRoleId }]),
          }),
        }),
      };

      const mockSelectChain2 = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ name: "admin" }]),
          }),
        }),
      };

      mockTx.select = vi
        .fn()
        .mockReturnValueOnce(mockSelectChain1)
        .mockReturnValueOnce(mockSelectChain2);

      const result = await rbacService.getUserRoles(mockUserId);

      expect(result).toEqual(["admin"]);
    });

    it("enforces tenant isolation by including tenantId in query", async () => {
      vi.mocked(dbScoped).mockImplementation(async (_, fn) => {
        return fn(mockTx);
      });

      const mockSelectChain1 = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ roleId: mockRoleId }]),
          }),
        }),
      };

      const mockSelectChain2 = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ name: "viewer" }]),
          }),
        }),
      };

      mockTx.select = vi
        .fn()
        .mockReturnValueOnce(mockSelectChain1)
        .mockReturnValueOnce(mockSelectChain2);

      await rbacService.getUserRoles(mockUserId, mockTenantId);

      expect(mockTx.select).toHaveBeenCalledTimes(2);
    });
  });

  describe("getUserPermissions", () => {
    it("returns empty array when user has no roles", async () => {
      vi.mocked(dbScoped).mockImplementation(async (_, fn) => {
        return fn(mockTx);
      });

      const mockSelectChain = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      };
      mockTx.select = vi.fn().mockReturnValue(mockSelectChain);

      const result = await rbacService.getUserPermissions(mockUserId);

      expect(result).toEqual([]);
    });

    it("returns deduplicated permissions from all user roles", async () => {
      vi.mocked(dbScoped).mockImplementation(async (_, fn) => {
        return fn(mockTx);
      });

      const mockSelectChain1 = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ roleId: "role-1" }, { roleId: "role-2" }]),
          }),
        }),
      };

      const mockInnerJoinChain = {
        where: vi.fn().mockReturnValue({
          limit: vi
            .fn()
            .mockResolvedValue([
              { name: "reports:read" },
              { name: "reports:write" },
              { name: "reports:read" },
            ]),
        }),
      };

      const mockSelectChain2 = {
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue(mockInnerJoinChain),
        }),
      };

      mockTx.select = vi
        .fn()
        .mockReturnValueOnce(mockSelectChain1)
        .mockReturnValueOnce(mockSelectChain2);

      const result = await rbacService.getUserPermissions(mockUserId);

      expect(result).toEqual(["reports:read", "reports:write"]);
    });
  });

  describe("hasPermission", () => {
    it("returns false when user has no roles", async () => {
      vi.mocked(dbScoped).mockImplementation(async (_, fn) => {
        return fn(mockTx);
      });

      const mockSelectChain = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      };
      mockTx.select = vi.fn().mockReturnValue(mockSelectChain);

      const result = await rbacService.hasPermission(
        mockUserId,
        mockTenantId,
        "reports:read" as Permission,
      );

      expect(result).toBe(false);
    });

    it("returns true when user has the required permission", async () => {
      vi.mocked(dbScoped).mockImplementation(async (_, fn) => {
        return fn(mockTx);
      });

      const mockSelectChain1 = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ roleId: mockRoleId }]),
          }),
        }),
      };

      const mockInnerJoinChain = {
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([{ id: "perm-123" }]),
        }),
      };

      const mockSelectChain2 = {
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue(mockInnerJoinChain),
        }),
      };

      mockTx.select = vi
        .fn()
        .mockReturnValueOnce(mockSelectChain1)
        .mockReturnValueOnce(mockSelectChain2);

      const result = await rbacService.hasPermission(
        mockUserId,
        mockTenantId,
        "reports:write" as Permission,
      );

      expect(result).toBe(true);
    });

    it("returns false when user lacks the permission", async () => {
      vi.mocked(dbScoped).mockImplementation(async (_, fn) => {
        return fn(mockTx);
      });

      const mockSelectChain1 = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ roleId: mockRoleId }]),
          }),
        }),
      };

      const mockInnerJoinChain = {
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      };

      const mockSelectChain2 = {
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue(mockInnerJoinChain),
        }),
      };

      mockTx.select = vi
        .fn()
        .mockReturnValueOnce(mockSelectChain1)
        .mockReturnValueOnce(mockSelectChain2);

      const result = await rbacService.hasPermission(
        mockUserId,
        mockTenantId,
        "users:delete" as Permission,
      );

      expect(result).toBe(false);
    });
  });

  describe("assignRole", () => {
    it("creates user_roles record with granted_at timestamp", async () => {
      vi.mocked(dbScoped).mockImplementation(async (_, fn) => {
        return fn(mockTx);
      });

      const mockInsertChain = {
        values: vi.fn().mockResolvedValue(undefined),
      };
      mockTx.insert = vi.fn().mockReturnValue(mockInsertChain);

      await rbacService.assignRole(mockUserId, mockRoleId, mockGrantedBy);

      expect(mockTx.insert).toHaveBeenCalled();
      expect(mockInsertChain.values).toHaveBeenCalledWith({
        userId: mockUserId,
        roleId: mockRoleId,
        grantedBy: mockGrantedBy,
        grantedAt: expect.any(Date),
      });
    });
  });

  describe("revokeRole", () => {
    it("deletes user_roles record for user and role", async () => {
      vi.mocked(dbScoped).mockImplementation(async (_, fn) => {
        return fn(mockTx);
      });

      const mockDeleteChain = {
        where: vi.fn().mockResolvedValue(undefined),
      };
      mockTx.delete = vi.fn().mockReturnValue(mockDeleteChain);

      await rbacService.revokeRole(mockUserId, mockRoleId);

      expect(mockTx.delete).toHaveBeenCalled();
      expect(mockDeleteChain.where).toHaveBeenCalled();
    });

    it("is idempotent (no error if record doesn't exist)", async () => {
      vi.mocked(dbScoped).mockImplementation(async (_, fn) => {
        return fn(mockTx);
      });

      const mockDeleteChain = {
        where: vi.fn().mockResolvedValue(undefined),
      };
      mockTx.delete = vi.fn().mockReturnValue(mockDeleteChain);

      await expect(
        rbacService.revokeRole("non-existent-user", "non-existent-role"),
      ).resolves.toBeUndefined();
    });
  });

  describe("getRoleByName", () => {
    it("returns role name when role exists", async () => {
      vi.mocked(dbScoped).mockImplementation(async (_, fn) => {
        return fn(mockTx);
      });

      const mockSelectChain = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi
              .fn()
              .mockResolvedValue([{ name: "admin", id: mockRoleId, tenantId: mockTenantId }]),
          }),
        }),
      };
      mockTx.select = vi.fn().mockReturnValue(mockSelectChain);

      const result = await rbacService.getRoleByName("admin", mockTenantId);

      expect(result).toBe("admin");
    });

    it("returns undefined when role doesn't exist", async () => {
      vi.mocked(dbScoped).mockImplementation(async (_, fn) => {
        return fn(mockTx);
      });

      const mockSelectChain = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      };
      mockTx.select = vi.fn().mockReturnValue(mockSelectChain);

      const result = await rbacService.getRoleByName("non-existent", mockTenantId);

      expect(result).toBeUndefined();
    });
  });

  describe("getPermissionByName", () => {
    it("returns permission when it exists", async () => {
      vi.mocked(dbScoped).mockImplementation(async (_, fn) => {
        return fn(mockTx);
      });

      const mockSelectChain = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ name: "reports:read", id: "perm-123" }]),
          }),
        }),
      };
      mockTx.select = vi.fn().mockReturnValue(mockSelectChain);

      const result = await rbacService.getPermissionByName("reports:read" as Permission);

      expect(result).toBe("reports:read");
    });

    it("returns undefined when permission doesn't exist", async () => {
      vi.mocked(dbScoped).mockImplementation(async (_, fn) => {
        return fn(mockTx);
      });

      const mockSelectChain = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      };
      mockTx.select = vi.fn().mockReturnValue(mockSelectChain);

      const result = await rbacService.getPermissionByName("non:existent" as Permission);

      expect(result).toBeUndefined();
    });
  });
});

describe("RBACService Singleton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates singleton instance with createRbacService", () => {
    const mockDb = {
      select: vi.fn(),
      insert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      transaction: vi.fn(),
    } as unknown as Database;

    const service = createRbacService(mockDb);

    expect(service).toBeInstanceOf(RBACService);
    expect(getRbacService()).toBe(service);
  });

  it("returns the same instance when getRbacService called multiple times", () => {
    const mockDb = {
      select: vi.fn(),
      insert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      transaction: vi.fn(),
    } as unknown as Database;

    const service1 = createRbacService(mockDb);
    const service2 = getRbacService();

    expect(service1).toBe(service2);
  });
});
