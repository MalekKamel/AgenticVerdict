import { createTenantContext, runWithTenantContext } from "@agenticverdict/core";
import type { TenantConfig } from "@agenticverdict/config";
import type { SystemRole } from "@agenticverdict/types";

import type { Database } from "../client";
import { dbScoped } from "../db-scoped";
import { users } from "../schema/users";
import { tenants } from "../schema/tenants";
import { agencyPartners } from "../schema/core/tenants";
import { roles } from "../schema/rbac/roles";
import { userRoles } from "../schema/rbac/user-roles";
import { eq, inArray } from "drizzle-orm";

export type TenantType = "direct_business" | "agency_partner" | "agency_managed";
export type TenantStatus =
  | "onboarding"
  | "active"
  | "suspended"
  | "restricted"
  | "archived"
  | "deleted";

/**
 * Configuration for seeding a single user within a tenant.
 */
export interface SeedUserConfig {
  email: string;
  displayName?: string;
  passwordHash?: string;
  role?: SystemRole;
}

/**
 * Configuration for seeding a tenant with optional users.
 * Tenants can be direct business tenants or agency-managed client tenants.
 */
export interface SeedTenantConfig {
  tenantId: string;
  tenantName: string;
  slug?: string;
  type?: TenantType;
  status?: TenantStatus;
  agencyPartnerId?: string | null;
  users?: SeedUserConfig[];
}

/**
 * Configuration for seeding an agency partner with optional client tenants.
 * Agency partners manage multiple client tenants in the multi-tenant SaaS model.
 */
export interface SeedAgencyPartnerConfig {
  agencyPartnerId?: string;
  name: string;
  slug: string;
  settings?: Record<string, unknown>;
  clientTenants?: SeedTenantConfig[];
}

function createMinimalTenantConfig(tenantId: string, tenantName?: string): TenantConfig {
  return {
    tenantId,
    tenantName: tenantName ?? "Seed Tenant",
    localization: {
      language: "en",
      region: "US",
      timezone: "UTC",
      currency: "USD",
    },
    marketing: {
      channels: [],
      kpis: [],
    },
    ai: {
      primaryModel: "claude-3-5-sonnet-20241022",
      provider: "anthropic",
    },
    features: {
      enableInsights: true,
      enableVerdict: true,
    },
  };
}

/**
 * Seeds users for an existing tenant with optional RBAC role assignments.
 *
 * This function:
 * 1. Validates the tenant exists before seeding
 * 2. Creates users within the tenant context for proper isolation
 * 3. Assigns system roles (admin, analyst, editor, viewer) to users if specified
 * 4. Uses conflict handling to ensure idempotent operations
 *
 * @param db - Database instance
 * @param tenantId - UUID of the existing tenant
 * @param userConfigs - Array of user configurations with optional roles
 * @throws Error if tenant does not exist
 *
 * @example
 * ```typescript
 * await seedUsersForTenant(db, 'tenant-uuid', [
 *   { email: 'admin@example.com', role: 'admin', displayName: 'Admin User' },
 *   { email: 'analyst@example.com', role: 'analyst', displayName: 'Analyst User' },
 * ]);
 * ```
 */
export async function seedUsersForTenant(
  db: Database,
  tenantId: string,
  userConfigs: SeedUserConfig[],
): Promise<void> {
  const tenant = await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1);
  if (tenant.length === 0) {
    throw new Error(`Tenant ${tenantId} does not exist. Create tenant first.`);
  }

  const context = createTenantContext({
    tenantId,
    tenantType: tenant[0].type as TenantType,
    tenantStatus: tenant[0].status as TenantStatus,
    requestId: `seed-users-${Date.now()}`,
    config: createMinimalTenantConfig(tenantId, tenant[0].name),
  });

  await runWithTenantContext(context, async () => {
    await dbScoped(db, async (tx) => {
      const insertedUsers = await tx
        .insert(users)
        .values(
          userConfigs.map((cfg) => ({
            tenantId,
            email: cfg.email,
            displayName: cfg.displayName,
            passwordHash: cfg.passwordHash,
            emailVerified: true,
          })),
        )
        .onConflictDoNothing()
        .returning();

      const usersWithRoles = userConfigs.filter((cfg) => cfg.role);
      if (usersWithRoles.length > 0) {
        const systemRoles = await tx
          .select()
          .from(roles)
          .where(
            inArray(
              roles.name,
              usersWithRoles.map((cfg) => cfg.role!),
            ),
          );

        const roleMap = new Map(systemRoles.map((r) => [r.name, r.id]));

        for (const userConfig of usersWithRoles) {
          const user = insertedUsers.find((u) => u.email === userConfig.email);
          if (!user || !userConfig.role) continue;

          const roleId = roleMap.get(userConfig.role);
          if (!roleId) continue;

          await tx
            .insert(userRoles)
            .values({
              userId: user.id,
              roleId,
              grantedAt: new Date(),
            })
            .onConflictDoNothing();
        }
      }
    });
  });
}

/**
 * Seeds an agency partner entity with optional client tenants.
 *
 * Agency partners represent organizations that manage multiple client tenants.
 * This function:
 * 1. Creates the agency partner entity if it doesn't exist (idempotent by slug)
 * 2. Optionally creates client tenants linked to the agency partner
 * 3. Seeds users for each client tenant if specified
 *
 * @param db - Database instance
 * @param config - Agency partner configuration with optional client tenants
 * @returns The agency partner UUID
 *
 * @example
 * ```typescript
 * await seedAgencyPartner(db, {
 *   name: 'Digital Marketing Agency',
 *   slug: 'dma-agency',
 *   clientTenants: [
 *     {
 *       tenantId: 'client-1-uuid',
 *       tenantName: 'Client Brand A',
 *       users: [{ email: 'admin@clientA.com', role: 'admin' }],
 *     },
 *   ],
 * });
 * ```
 */
export async function seedAgencyPartner(
  db: Database,
  config: SeedAgencyPartnerConfig,
): Promise<string> {
  const existing = await db
    .select()
    .from(agencyPartners)
    .where(eq(agencyPartners.slug, config.slug))
    .limit(1);

  if (existing.length > 0) {
    if (config.clientTenants && config.clientTenants.length > 0) {
      for (const tenantConfig of config.clientTenants) {
        await seedClientTenant(db, tenantConfig, existing[0].id);
      }
    }
    return existing[0].id;
  }

  const [agencyPartner] = await db
    .insert(agencyPartners)
    .values({
      id: config.agencyPartnerId,
      name: config.name,
      slug: config.slug,
      settings: config.settings ?? {},
    })
    .returning();

  if (config.clientTenants && config.clientTenants.length > 0) {
    for (const tenantConfig of config.clientTenants) {
      await seedClientTenant(db, tenantConfig, agencyPartner.id);
    }
  }

  return agencyPartner.id;
}

/**
 * Seeds a client tenant, optionally linked to an agency partner.
 *
 * This function:
 * 1. Creates or updates the tenant entity (idempotent by ID)
 * 2. Links the tenant to an agency partner if provided (null = direct business)
 * 3. Seeds users for the tenant if specified in config
 *
 * @param db - Database instance
 * @param config - Tenant configuration with optional users
 * @param agencyPartnerId - Optional agency partner ID (null for direct business tenants)
 * @returns The tenant UUID
 *
 * @example
 * ```typescript
 * // Agency-managed client tenant
 * await seedClientTenant(db, {
 *   tenantId: 'client-uuid',
 *   tenantName: 'Client Brand',
 *   users: [{ email: 'admin@client.com', role: 'admin' }],
 * }, 'agency-partner-uuid');
 *
 * // Direct business tenant (no agency)
 * await seedClientTenant(db, {
 *   tenantId: 'direct-uuid',
 *   tenantName: 'Direct Business',
 *   users: [{ email: 'admin@direct.com', role: 'admin' }],
 * }, null);
 * ```
 */
export async function seedClientTenant(
  db: Database,
  config: SeedTenantConfig,
  agencyPartnerId?: string | null,
): Promise<string> {
  const existing = await db.select().from(tenants).where(eq(tenants.id, config.tenantId)).limit(1);

  const slug = config.slug ?? config.tenantId.slice(0, 8);
  const tenantType = config.type ?? "direct_business";
  const tenantStatus = config.status ?? "active";

  if (existing.length > 0) {
    await db
      .update(tenants)
      .set({
        name: config.tenantName,
        slug,
        type: tenantType,
        status: tenantStatus,
        agencyPartnerId: agencyPartnerId ?? null,
        updatedAt: new Date(),
      })
      .where(eq(tenants.id, config.tenantId));

    if (config.users && config.users.length > 0) {
      await seedUsersForTenant(db, config.tenantId, config.users);
    }

    return config.tenantId;
  }

  await db.insert(tenants).values({
    id: config.tenantId,
    name: config.tenantName,
    slug,
    type: tenantType,
    status: tenantStatus,
    agencyPartnerId: agencyPartnerId ?? null,
  });

  if (config.users && config.users.length > 0) {
    await seedUsersForTenant(db, config.tenantId, config.users);
  }

  return config.tenantId;
}

/**
 * Seeds a direct business tenant (not managed by an agency partner).
 *
 * Convenience wrapper around seedClientTenant with agencyPartnerId set to null.
 * Direct business tenants are end consumers of the platform.
 *
 * @param db - Database instance
 * @param config - Tenant configuration with optional users
 * @returns The tenant UUID
 *
 * @example
 * ```typescript
 * await seedDirectTenant(db, {
 *   tenantId: 'masafh-uuid',
 *   tenantName: 'Masafh',
 *   users: [
 *     { email: 'admin@masafh.com', role: 'admin' },
 *     { email: 'analyst@masafh.com', role: 'analyst' },
 *   ],
 * });
 * ```
 */
export async function seedDirectTenant(db: Database, config: SeedTenantConfig): Promise<string> {
  return seedClientTenant(db, config, null);
}

/**
 * Seeds users across multiple tenants in batch.
 *
 * This function:
 * 1. Iterates through tenant configurations
 * 2. Creates each tenant with their agency linkage (if any)
 * 3. Seeds users for each tenant
 *
 * @param db - Database instance
 * @param tenantConfigs - Array of tenant configurations with optional users
 *
 * @example
 * ```typescript
 * await seedUsersForMultipleTenants(db, [
 *   {
 *     tenantId: 'tenant-1-uuid',
 *     tenantName: 'Tenant A',
 *     agencyPartnerId: 'agency-uuid',
 *     users: [{ email: 'admin@a.com', role: 'admin' }],
 *   },
 *   {
 *     tenantId: 'tenant-2-uuid',
 *     tenantName: 'Tenant B',
 *     agencyPartnerId: 'agency-uuid',
 *     users: [{ email: 'admin@b.com', role: 'admin' }],
 *   },
 * ]);
 * ```
 */
export async function seedUsersForMultipleTenants(
  db: Database,
  tenantConfigs: SeedTenantConfig[],
): Promise<void> {
  for (const config of tenantConfigs) {
    await seedClientTenant(db, config, config.agencyPartnerId ?? null);
  }
}

/**
 * Returns the default system role for a user based on tenant type and user order.
 *
 * Role assignment logic:
 * - First user (index 0): Always 'admin' regardless of tenant type
 * - Direct business tenants: Subsequent users default to 'analyst'
 * - Agency-managed tenants: Subsequent users default to 'editor'
 *
 * @param tenantType - Type of tenant ('direct_business' or 'agency_managed')
 * @param userIndex - Zero-based index of the user in the seeding order
 * @returns SystemRole to assign by default
 *
 * @example
 * ```typescript
 * // First user is always admin
 * getDefaultRoleForTenantType('direct_business', 0); // 'admin'
 * getDefaultRoleForTenantType('agency_managed', 0); // 'admin'
 *
 * // Subsequent users vary by tenant type
 * getDefaultRoleForTenantType('direct_business', 1); // 'analyst'
 * getDefaultRoleForTenantType('agency_managed', 1); // 'editor'
 * ```
 */
export function getDefaultRoleForTenantType(
  tenantType: "direct_business" | "agency_managed",
  userIndex: number,
): SystemRole {
  if (userIndex === 0) {
    return "admin";
  }

  return tenantType === "direct_business" ? "analyst" : "editor";
}

/**
 * Ensures system roles exist for a tenant (idempotent).
 *
 * This function:
 * 1. Checks if system roles (admin, analyst, editor, viewer) exist for the tenant
 * 2. Creates any missing roles with standard descriptions
 * 3. Skips roles that already exist (idempotent)
 *
 * Call this before seeding users to ensure role assignments succeed.
 *
 * @param db - Database instance
 * @param tenantId - UUID of the tenant
 *
 * @example
 * ```typescript
 * await seedSystemRolesForTenantIfNotExists(db, 'tenant-uuid');
 * await seedUsersForTenant(db, 'tenant-uuid', [
 *   { email: 'admin@example.com', role: 'admin' },
 * ]);
 * ```
 */
export async function seedSystemRolesForTenantIfNotExists(
  db: Database,
  tenantId: string,
): Promise<void> {
  const SYSTEM_ROLES: Array<{
    name: SystemRole;
    description: string;
  }> = [
    { name: "admin", description: "Full system access" },
    { name: "analyst", description: "Read + analysis capabilities" },
    { name: "editor", description: "Content editing access" },
    { name: "viewer", description: "Read-only access" },
  ];

  for (const roleDef of SYSTEM_ROLES) {
    const existing = await db
      .select()
      .from(roles)
      .where(eq(roles.tenantId, tenantId) && eq(roles.name, roleDef.name))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(roles).values({
        tenantId,
        name: roleDef.name,
        description: roleDef.description,
        isSystemRole: true,
        isCustomRole: false,
      });
    }
  }
}
