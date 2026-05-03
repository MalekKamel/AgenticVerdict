import { and, eq, inArray } from "drizzle-orm";

import { dbScoped } from "./db-scoped";
import type { Database } from "./client";
import { roles, permissions, userRoles, rolePermissions } from "./schema";
import type { Permission, Role } from "@agenticverdict/types";

/**
 * RBAC Service for role and permission management.
 * All queries use dbScoped pattern for tenant isolation.
 */
export class RBACService {
  constructor(private readonly db: Database) {}

  /**
   * Get all roles assigned to a user within a tenant context.
   * Returns empty array if user has no roles.
   */
  async getUserRoles(userId: string): Promise<Role[]> {
    return dbScoped(this.db, async (tx) => {
      const userRoleRows = await tx
        .select({ roleId: userRoles.roleId })
        .from(userRoles)
        .where(and(eq(userRoles.userId, userId)))
        .limit(100);

      if (userRoleRows.length === 0) {
        return [];
      }

      const roleIds = userRoleRows.map((r) => r.roleId);
      const roleRows = await tx
        .select({ name: roles.name })
        .from(roles)
        .where(inArray(roles.id, roleIds))
        .limit(100);

      return roleRows.map((r) => r.name as Role);
    });
  }

  /**
   * Get all permissions for a user within a tenant context.
   * Returns deduplicated set of permissions from all user's roles.
   * Returns empty array if user has no roles or roles have no permissions.
   */
  async getUserPermissions(userId: string): Promise<Permission[]> {
    return dbScoped(this.db, async (tx) => {
      const userRoleRows = await tx
        .select({ roleId: userRoles.roleId })
        .from(userRoles)
        .where(and(eq(userRoles.userId, userId)))
        .limit(100);

      if (userRoleRows.length === 0) {
        return [];
      }

      const roleIds = userRoleRows.map((r) => r.roleId);
      const permRows = await tx
        .select({ name: permissions.name })
        .from(permissions)
        .innerJoin(rolePermissions, eq(rolePermissions.permissionId, permissions.id))
        .where(and(inArray(rolePermissions.roleId, roleIds)))
        .limit(500);

      return [...new Set(permRows.map((p) => p.name as Permission))];
    });
  }

  /**
   * Check if a user has a specific permission within a tenant context.
   * Performs efficient single query (not fetch all permissions).
   */
  async hasPermission(userId: string, tenantId: string, permission: Permission): Promise<boolean> {
    return dbScoped(this.db, async (tx) => {
      const userRoleRows = await tx
        .select({ roleId: userRoles.roleId })
        .from(userRoles)
        .where(and(eq(userRoles.userId, userId)))
        .limit(100);

      if (userRoleRows.length === 0) {
        return false;
      }

      const roleIds = userRoleRows.map((r) => r.roleId);
      const permRow = await tx
        .select({ id: permissions.id })
        .from(permissions)
        .innerJoin(rolePermissions, eq(rolePermissions.permissionId, permissions.id))
        .where(and(inArray(rolePermissions.roleId, roleIds), eq(permissions.name, permission)))
        .limit(1);

      return permRow.length > 0;
    });
  }

  /**
   * Assign a role to a user.
   * Creates new user_roles record with granted_at timestamp.
   */
  async assignRole(userId: string, roleId: string, grantedBy: string): Promise<void> {
    return dbScoped(this.db, async (tx) => {
      await tx.insert(userRoles).values({
        userId,
        roleId,
        grantedBy,
        grantedAt: new Date(),
      });
    });
  }

  /**
   * Revoke a role from a user.
   * Deletes user_roles record for user and role.
   * Operation is idempotent (no error if record doesn't exist).
   */
  async revokeRole(userId: string, roleId: string): Promise<void> {
    return dbScoped(this.db, async (tx) => {
      await tx
        .delete(userRoles)
        .where(and(eq(userRoles.userId, userId), eq(userRoles.roleId, roleId)));
    });
  }

  /**
   * Get role by name within tenant context.
   * Returns undefined if role doesn't exist.
   */
  async getRoleByName(name: string, tenantId: string): Promise<Role | undefined> {
    return dbScoped(this.db, async (tx) => {
      const roleRows = await tx
        .select()
        .from(roles)
        .where(and(eq(roles.name, name), eq(roles.tenantId, tenantId)))
        .limit(1);

      return roleRows.length > 0 ? (roleRows[0].name as Role) : undefined;
    });
  }

  /**
   * Get permission by name.
   * Returns undefined if permission doesn't exist.
   */
  async getPermissionByName(name: Permission): Promise<Permission | undefined> {
    return dbScoped(this.db, async (tx) => {
      const permRows = await tx
        .select()
        .from(permissions)
        .where(eq(permissions.name, name))
        .limit(1);

      return permRows.length > 0 ? (permRows[0].name as Permission) : undefined;
    });
  }
}

/**
 * Singleton RBACService instance.
 * Exported for convenient access throughout the application.
 * Initialize with createRbacService() before using.
 */
let rbacServiceInstance: RBACService | null = null;

/**
 * Create and initialize the RBACService singleton.
 * Must be called before using rbacService.
 */
export function createRbacService(db: Database): RBACService {
  rbacServiceInstance = new RBACService(db);
  return rbacServiceInstance;
}

/**
 * Get the RBACService singleton instance.
 * Throws error if createRbacService() hasn't been called yet.
 */
export function getRbacService(): RBACService {
  if (!rbacServiceInstance) {
    throw new Error("RBACService not initialized. Call createRbacService(db) before using.");
  }
  return rbacServiceInstance;
}
