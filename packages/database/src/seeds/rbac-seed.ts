import { eq, inArray } from "drizzle-orm";

import type { Database } from "../client";
import { tenants } from "../schema/tenants";
import { permissions } from "../schema/rbac/permissions";
import { roles } from "../schema/rbac/roles";
import { rolePermissions } from "../schema/rbac/role-permissions";
import { PERMISSIONS, type SystemRole } from "@agenticverdict/types";

/**
 * System tenant ID for platform-wide RBAC data.
 * This tenant holds system roles and permissions that are shared across all tenants.
 */
export const SYSTEM_TENANT_ID = "00000000-0000-0000-0000-000000000001";

/**
 * System role definitions with their associated permissions.
 */
const SYSTEM_ROLES: Array<{
  name: SystemRole;
  description: string;
  permissions: string[];
}> = [
  {
    name: "admin",
    description: "Full system access",
    permissions: Object.values(PERMISSIONS),
  },
  {
    name: "analyst",
    description: "Read + analysis capabilities",
    permissions: [
      PERMISSIONS.REPORTS_READ,
      PERMISSIONS.REPORTS_WRITE,
      PERMISSIONS.TRANSLATIONS_READ,
      PERMISSIONS.CONNECTORS_READ,
    ],
  },
  {
    name: "editor",
    description: "Content editing access",
    permissions: [
      PERMISSIONS.REPORTS_READ,
      PERMISSIONS.REPORTS_WRITE,
      PERMISSIONS.TRANSLATIONS_READ,
      PERMISSIONS.TRANSLATIONS_WRITE,
    ],
  },
  {
    name: "viewer",
    description: "Read-only access",
    permissions: [
      PERMISSIONS.REPORTS_READ,
      PERMISSIONS.TRANSLATIONS_READ,
      PERMISSIONS.CONNECTORS_READ,
    ],
  },
];

/**
 * Seeds the system tenant for RBAC data.
 * Creates the system tenant if it doesn't exist.
 */
async function seedSystemTenant(db: Database): Promise<void> {
  const existing = await db.select().from(tenants).where(eq(tenants.id, SYSTEM_TENANT_ID)).limit(1);
  if (existing.length === 0) {
    await db.insert(tenants).values({
      id: SYSTEM_TENANT_ID,
      name: "System",
      slug: "system",
      type: "direct_business",
      status: "active",
    });
  }
}

/**
 * Seeds all system permissions from the PERMISSIONS constant.
 * Idempotent - uses upsert behavior.
 */
async function seedSystemPermissions(db: Database): Promise<void> {
  const permissionValues = Object.values(PERMISSIONS).map((permission) => ({
    name: permission,
    resource: permission.split(":")[0],
    action: permission.split(":")[1],
    description: `Permission to ${permission.split(":")[1]} ${permission.split(":")[0]}`,
  }));

  for (const perm of permissionValues) {
    const existing = await db
      .select()
      .from(permissions)
      .where(eq(permissions.name, perm.name))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(permissions).values(perm);
    }
  }
}

/**
 * Seeds system roles and their permission mappings for a specific tenant.
 * Idempotent - skips existing roles for this tenant.
 */
export async function seedSystemRolesForTenant(db: Database, tenantId: string): Promise<void> {
  for (const roleDef of SYSTEM_ROLES) {
    const existing = await db.select().from(roles).where(eq(roles.name, roleDef.name)).limit(1);

    if (existing.length > 0) {
      const roleForThisTenant = existing.some((r) => r.tenantId === tenantId);
      if (roleForThisTenant) {
        continue;
      }
    }

    const [role] = await db
      .insert(roles)
      .values({
        tenantId,
        name: roleDef.name,
        description: roleDef.description,
        isSystemRole: true,
        isCustomRole: false,
      })
      .returning();

    const permissionNames = roleDef.permissions;
    const permissionRows = await db
      .select()
      .from(permissions)
      .where(inArray(permissions.name, permissionNames));

    for (const permission of permissionRows) {
      await db.insert(rolePermissions).values({
        roleId: role.id,
        permissionId: permission.id,
      });
    }
  }
}

/**
 * Seeds system roles and their permission mappings.
 * Idempotent - skips existing roles.
 */
async function seedSystemRoles(db: Database): Promise<void> {
  await seedSystemRolesForTenant(db, SYSTEM_TENANT_ID);
}

/**
 * Main RBAC seed function - seeds system tenant, permissions, and roles.
 * Should be called after tenant seeding but before other data seeding.
 */
export async function seedRbacSystem(db: Database): Promise<void> {
  await seedSystemTenant(db);
  await seedSystemPermissions(db);
  await seedSystemRoles(db);
}
