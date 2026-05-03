import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { eq, and } from "drizzle-orm";

import { createDatabaseClient, type Database } from "../src/client";
import { tenants, users, roles, permissions, userRoles, rolePermissions } from "../src/schema";
import {
  runWithTenantContext,
  createTenantContext,
  type TenantContext,
} from "@agenticverdict/core";
import { LOCAL_COMPOSE_POSTGRES_URL } from "../src/local-postgres-default-url";

describe("RBAC Integration Tests", () => {
  let db: Database;

  const testTenantId = crypto.randomUUID();
  const testUserId = crypto.randomUUID();
  const testAdminUserId = crypto.randomUUID();

  let viewerRoleId: string;
  let editorRoleId: string;
  let adminRoleId: string;

  function withTenantContext<T>(fn: () => Promise<T>): Promise<T> {
    const mockConfig = {
      tenantId: testTenantId,
      slug: "test-tenant",
      name: "Test Tenant",
      active: true,
      localization: { language: "en" as const },
      connectors: [],
      featureFlags: {},
    } as never;

    const context: TenantContext = createTenantContext({
      tenantId: testTenantId,
      requestId: `test-${crypto.randomUUID()}`,
      config: mockConfig,
    });

    return runWithTenantContext(context, fn);
  }

  beforeAll(async () => {
    db = createDatabaseClient(LOCAL_COMPOSE_POSTGRES_URL);

    await db.delete(userRoles);
    await db.delete(rolePermissions);
    await db.delete(permissions);
    await db.delete(roles);
    await db.delete(users);
    await db.delete(tenants).where(eq(tenants.id, testTenantId));

    await db.insert(tenants).values({
      id: testTenantId,
      name: "Test Tenant",
      slug: "test-tenant",
      active: true,
    });

    await db.insert(users).values([
      {
        id: testUserId,
        tenantId: testTenantId,
        email: "testuser@example.com",
        displayName: "Test User",
      },
      {
        id: testAdminUserId,
        tenantId: testTenantId,
        email: "admin@example.com",
        displayName: "Admin User",
      },
    ]);

    const permResults = await db
      .insert(permissions)
      .values([
        {
          id: crypto.randomUUID(),
          name: "reports:read",
          resource: "reports",
          action: "read",
          description: "Read reports",
        },
        {
          id: crypto.randomUUID(),
          name: "reports:write",
          resource: "reports",
          action: "write",
          description: "Write reports",
        },
        {
          id: crypto.randomUUID(),
          name: "users:read",
          resource: "users",
          action: "read",
          description: "Read users",
        },
      ])
      .returning({ id: permissions.id, name: permissions.name });

    const reportsReadPermId = permResults.find((p) => p.name === "reports:read")!.id;
    const reportsWritePermId = permResults.find((p) => p.name === "reports:write")!.id;

    const roleResults = await db
      .insert(roles)
      .values([
        {
          id: crypto.randomUUID(),
          tenantId: testTenantId,
          name: "viewer",
          description: "Read-only access",
          isSystemRole: true,
        },
        {
          id: crypto.randomUUID(),
          tenantId: testTenantId,
          name: "editor",
          description: "Can edit content",
          isSystemRole: true,
        },
        {
          id: crypto.randomUUID(),
          tenantId: testTenantId,
          name: "admin",
          description: "Full administrative access",
          isSystemRole: true,
        },
      ])
      .returning({ id: roles.id, name: roles.name });

    viewerRoleId = roleResults.find((r) => r.name === "viewer")!.id;
    editorRoleId = roleResults.find((r) => r.name === "editor")!.id;
    adminRoleId = roleResults.find((r) => r.name === "admin")!.id;

    await db.insert(rolePermissions).values([
      {
        id: crypto.randomUUID(),
        roleId: viewerRoleId,
        permissionId: reportsReadPermId,
      },
      {
        id: crypto.randomUUID(),
        roleId: editorRoleId,
        permissionId: reportsReadPermId,
      },
      {
        id: crypto.randomUUID(),
        roleId: editorRoleId,
        permissionId: reportsWritePermId,
      },
      {
        id: crypto.randomUUID(),
        roleId: adminRoleId,
        permissionId: reportsReadPermId,
      },
      {
        id: crypto.randomUUID(),
        roleId: adminRoleId,
        permissionId: reportsWritePermId,
      },
    ]);
  });

  afterAll(async () => {
    await db.delete(userRoles);
    await db.delete(rolePermissions);
    await db.delete(permissions);
    await db.delete(roles);
    await db.delete(users);
    await db.delete(tenants).where(eq(tenants.id, testTenantId));
    await db.$client.end();
  });

  describe("Role Assignment and Queries", () => {
    it("assigns role to user and retrieves it", async () => {
      await withTenantContext(async () => {
        await db.insert(userRoles).values({
          userId: testUserId,
          roleId: viewerRoleId,
          grantedBy: testAdminUserId,
        });

        const result = await db
          .select({ roleName: roles.name })
          .from(userRoles)
          .innerJoin(roles, eq(userRoles.roleId, roles.id))
          .where(and(eq(userRoles.userId, testUserId), eq(roles.tenantId, testTenantId)));

        expect(result.length).toBe(1);
        expect(result[0].roleName).toBe("viewer");

        await db.delete(userRoles).where(eq(userRoles.userId, testUserId));
      });
    });

    it("retrieves multiple roles for a user", async () => {
      await withTenantContext(async () => {
        await db.insert(userRoles).values([
          {
            userId: testUserId,
            roleId: viewerRoleId,
            grantedBy: testAdminUserId,
          },
          {
            userId: testUserId,
            roleId: editorRoleId,
            grantedBy: testAdminUserId,
          },
        ]);

        const result = await db
          .select({ roleName: roles.name })
          .from(userRoles)
          .innerJoin(roles, eq(userRoles.roleId, roles.id))
          .where(and(eq(userRoles.userId, testUserId), eq(roles.tenantId, testTenantId)));

        expect(result.length).toBeGreaterThanOrEqual(2);
        const roleNames = result.map((r) => r.roleName);
        expect(roleNames).toContain("viewer");
        expect(roleNames).toContain("editor");

        await db.delete(userRoles).where(eq(userRoles.userId, testUserId));
      });
    });

    it("revokes role from user", async () => {
      await withTenantContext(async () => {
        await db.insert(userRoles).values({
          userId: testUserId,
          roleId: viewerRoleId,
          grantedBy: testAdminUserId,
        });

        await db
          .delete(userRoles)
          .where(and(eq(userRoles.userId, testUserId), eq(userRoles.roleId, viewerRoleId)));

        const result = await db.select().from(userRoles).where(eq(userRoles.userId, testUserId));

        expect(result.length).toBe(0);
      });
    });
  });

  describe("Permission Queries", () => {
    it("retrieves permissions for user's role", async () => {
      await withTenantContext(async () => {
        await db.insert(userRoles).values({
          userId: testUserId,
          roleId: viewerRoleId,
          grantedBy: testAdminUserId,
        });

        const result = await db
          .selectDistinct({ permissionName: permissions.name })
          .from(userRoles)
          .innerJoin(roles, eq(userRoles.roleId, roles.id))
          .innerJoin(rolePermissions, eq(roles.id, rolePermissions.roleId))
          .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
          .where(eq(userRoles.userId, testUserId));

        expect(result.length).toBeGreaterThanOrEqual(1);
        const permNames = result.map((p) => p.permissionName);
        expect(permNames).toContain("reports:read");

        await db.delete(userRoles).where(eq(userRoles.userId, testUserId));
      });
    });

    it("retrieves deduplicated permissions from multiple roles", async () => {
      await withTenantContext(async () => {
        await db.delete(userRoles).where(eq(userRoles.userId, testUserId));

        await db.insert(userRoles).values([
          {
            userId: testUserId,
            roleId: viewerRoleId,
            grantedBy: testAdminUserId,
          },
          {
            userId: testUserId,
            roleId: editorRoleId,
            grantedBy: testAdminUserId,
          },
        ]);

        const result = await db
          .selectDistinct({ permissionName: permissions.name })
          .from(userRoles)
          .innerJoin(roles, eq(userRoles.roleId, roles.id))
          .innerJoin(rolePermissions, eq(roles.id, rolePermissions.roleId))
          .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
          .where(eq(userRoles.userId, testUserId));

        const permNames = result.map((p) => p.permissionName);
        expect(permNames).toContain("reports:read");
        expect(permNames).toContain("reports:write");

        await db.delete(userRoles).where(eq(userRoles.userId, testUserId));
      });
    });
  });

  describe("Multi-tenant Isolation", () => {
    it("prevents access to roles from different tenant", async () => {
      await withTenantContext(async () => {
        const otherTenantId = crypto.randomUUID();

        await db.insert(tenants).values({
          id: otherTenantId,
          name: "Other Tenant",
          slug: `other-tenant-${crypto.randomUUID()}`,
          active: true,
        });

        const otherTenantRoleId = crypto.randomUUID();
        await db.insert(roles).values({
          id: otherTenantRoleId,
          tenantId: otherTenantId,
          name: `super-admin-${crypto.randomUUID()}`,
          description: "Super admin from other tenant",
          isSystemRole: false,
        });

        await db.delete(userRoles).where(eq(userRoles.userId, testUserId));

        await db.insert(userRoles).values({
          userId: testUserId,
          roleId: otherTenantRoleId,
          grantedBy: testAdminUserId,
        });

        const result = await db
          .select({ roleName: roles.name })
          .from(userRoles)
          .innerJoin(roles, eq(userRoles.roleId, roles.id))
          .where(and(eq(userRoles.userId, testUserId), eq(roles.tenantId, testTenantId)));

        const roleNames = result.map((r) => r.roleName);
        expect(roleNames).not.toContain("super-admin");

        await db.delete(userRoles).where(eq(userRoles.userId, testUserId));
        await db.delete(roles).where(eq(roles.id, otherTenantRoleId));
        await db.delete(tenants).where(eq(tenants.id, otherTenantId));
      });
    });
  });
});
