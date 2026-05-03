/**
 * Seed Data Examples
 *
 * This file demonstrates example seed configurations for the multi-tenant SaaS platform.
 * Use these patterns as reference for seeding test data, development environments, or demos.
 *
 * @see users-seed.ts for the seed function implementations
 * @see ../../../../prompts/users-seed-multi-tenant-support.md for the full requirements
 */

import type { Database } from "../client";
import {
  seedAgencyPartner,
  seedDirectTenant,
  seedUsersForMultipleTenants,
  seedSystemRolesForTenantIfNotExists,
  type SeedAgencyPartnerConfig,
  type SeedTenantConfig,
} from "./users-seed";
import { seedRbacSystem } from "./rbac-seed";

/**
 * Example 1: Direct Business Tenant (Masafh)
 *
 * A standalone business tenant not managed by an agency partner.
 * Example: Masafh (GPS fleet tracking company)
 */
export async function seedDirectBusinessExample(db: Database): Promise<void> {
  await seedRbacSystem(db);

  const tenantId = "00000000-0000-0000-0000-000000000002";

  await seedDirectTenant(db, {
    tenantId,
    tenantName: "Masafh",
    slug: "masafh",
    type: "direct_business",
    status: "active",
    users: [
      {
        email: "admin@direct-masafh.example.com",
        displayName: "Admin User",
        role: "admin",
      },
      {
        email: "analyst@direct-masafh.example.com",
        displayName: "Data Analyst",
        role: "analyst",
      },
      {
        email: "viewer@direct-masafh.example.com",
        displayName: "Read Only User",
        role: "viewer",
      },
    ],
  });
}

/**
 * Example 2: Agency Partner with Multiple Client Tenants
 *
 * An agency partner managing multiple client tenants.
 * Each client tenant has its own isolated users and data.
 * Email naming convention: {role}@agency-{slug}.example.com for agency partner users
 *                          {role}@client-{slug}.example.com for agency-managed client users
 */
export async function seedAgencyPartnerExample(db: Database): Promise<void> {
  await seedRbacSystem(db);

  const agencyPartnerId = "00000000-0000-0000-0000-000000000001";
  const agencyTenantId = "00000000-0000-0000-0000-000000000002";

  // Create agency partner tenant (type: agency_partner)
  await seedDirectTenant(db, {
    tenantId: agencyTenantId,
    tenantName: "Digital Marketing Agency",
    slug: "dma-agency",
    type: "agency_partner",
    status: "active",
    agencyPartnerId: null,
    users: [
      {
        email: "admin@agency-dma.example.com",
        displayName: "Agency Admin",
        role: "admin",
      },
      {
        email: "manager@agency-dma.example.com",
        displayName: "Agency Manager",
        role: "analyst",
      },
    ],
  });

  const agencyConfig: SeedAgencyPartnerConfig = {
    agencyPartnerId,
    name: "Digital Marketing Agency",
    slug: "dma-agency",
    clientTenants: [
      {
        tenantId: "00000000-0000-0000-0000-000000000003",
        tenantName: "Client Brand A",
        slug: "client-brand-a",
        type: "agency_managed",
        status: "active",
        users: [
          {
            email: "admin@client-branda.example.com",
            displayName: "Client A Admin",
            role: "admin",
          },
          {
            email: "editor@client-branda.example.com",
            displayName: "Client A Editor",
            role: "editor",
          },
        ],
      },
      {
        tenantId: "00000000-0000-0000-0000-000000000004",
        tenantName: "Client Brand B",
        slug: "client-brand-b",
        type: "agency_managed",
        status: "active",
        users: [
          {
            email: "admin@client-brandb.example.com",
            displayName: "Client B Admin",
            role: "admin",
          },
          {
            email: "analyst@client-brandb.example.com",
            displayName: "Client B Analyst",
            role: "analyst",
          },
        ],
      },
      {
        tenantId: "00000000-0000-0000-0000-000000000005",
        tenantName: "Client Brand C",
        slug: "client-brand-c",
        type: "agency_managed",
        status: "active",
        users: [
          {
            email: "admin@client-brandc.example.com",
            displayName: "Client C Admin",
            role: "admin",
          },
        ],
      },
    ],
  };

  await seedAgencyPartner(db, agencyConfig);
}

/**
 * Example 3: Mixed Environment (Direct + Agency-Managed Tenants)
 *
 * Seeds a combination of direct business tenants and agency-managed clients.
 * Useful for development environments that need to test both scenarios.
 * Email naming convention: {role}@direct-{slug}.example.com for direct business
 *                          {role}@client-{slug}.example.com for agency-managed
 */
export async function seedMixedEnvironmentExample(db: Database): Promise<void> {
  await seedRbacSystem(db);

  const agencyPartnerId = "00000000-0000-0000-0000-000000000010";
  const agencyTenantId = "00000000-0000-0000-0000-000000000009";

  // Create agency partner tenant
  await seedDirectTenant(db, {
    tenantId: agencyTenantId,
    tenantName: "Test Agency",
    slug: "test-agency",
    type: "agency_partner",
    status: "active",
    users: [
      { email: "admin@agency-test.example.com", role: "admin", displayName: "Agency Admin" },
      { email: "manager@agency-test.example.com", role: "analyst", displayName: "Agency Manager" },
    ],
  });

  const tenantConfigs: SeedTenantConfig[] = [
    {
      tenantId: "00000000-0000-0000-0000-000000000011",
      tenantName: "Direct Business 1",
      slug: "direct-biz-1",
      type: "direct_business",
      status: "active",
      agencyPartnerId: null,
      users: [
        { email: "admin@direct-biz1.example.com", role: "admin", displayName: "Admin User" },
        { email: "analyst@direct-biz1.example.com", role: "analyst", displayName: "Data Analyst" },
      ],
    },
    {
      tenantId: "00000000-0000-0000-0000-000000000012",
      tenantName: "Direct Business 2",
      slug: "direct-biz-2",
      type: "direct_business",
      status: "active",
      agencyPartnerId: null,
      users: [
        { email: "admin@direct-biz2.example.com", role: "admin", displayName: "Admin User" },
        { email: "editor@direct-biz2.example.com", role: "editor", displayName: "Content Editor" },
      ],
    },
    {
      tenantId: "00000000-0000-0000-0000-000000000013",
      tenantName: "Agency Client 1",
      slug: "agency-client-1",
      type: "agency_managed",
      status: "active",
      agencyPartnerId,
      users: [
        { email: "admin@client-agency1.example.com", role: "admin", displayName: "Client Admin" },
      ],
    },
    {
      tenantId: "00000000-0000-0000-0000-000000000014",
      tenantName: "Agency Client 2",
      slug: "agency-client-2",
      type: "agency_managed",
      status: "active",
      agencyPartnerId,
      users: [
        { email: "admin@client-agency2.example.com", role: "admin", displayName: "Client Admin" },
        {
          email: "viewer@client-agency2.example.com",
          role: "viewer",
          displayName: "Read Only User",
        },
      ],
    },
  ];

  await seedUsersForMultipleTenants(db, tenantConfigs);
}

/**
 * Example 4: Minimal Tenant with Default Roles
 *
 * Seeds a tenant with automatic role provisioning.
 * Uses seedSystemRolesForTenantIfNotExists to ensure roles exist before user assignment.
 */
export async function seedMinimalTenantExample(db: Database): Promise<void> {
  const tenantId = "00000000-0000-0000-0000-000000000020";

  await seedSystemRolesForTenantIfNotExists(db, tenantId);

  await seedDirectTenant(db, {
    tenantId,
    tenantName: "Minimal Direct Business",
    slug: "minimal-direct",
    type: "direct_business",
    status: "active",
    users: [{ email: "admin@direct-minimal.example.com", role: "admin", displayName: "Admin" }],
  });
}

/**
 * Example 5: Using Default Role Assignment Logic
 *
 * Demonstrates using getDefaultRoleForTenantType to assign roles based on tenant type.
 */
export async function seedWithDefaultRolesExample(db: Database): Promise<void> {
  const { getDefaultRoleForTenantType } = await import("./users-seed");

  const directTenantId = "00000000-0000-0000-0000-000000000030";
  const agencyTenantId = "00000000-0000-0000-0000-000000000031";

  await seedSystemRolesForTenantIfNotExists(db, directTenantId);
  await seedSystemRolesForTenantIfNotExists(db, agencyTenantId);

  const directUsers = [
    {
      email: "user0@direct-default.example.com",
      role: getDefaultRoleForTenantType("direct_business", 0),
      displayName: "Admin",
    },
    {
      email: "user1@direct-default.example.com",
      role: getDefaultRoleForTenantType("direct_business", 1),
      displayName: "Analyst",
    },
    {
      email: "user2@direct-default.example.com",
      role: getDefaultRoleForTenantType("direct_business", 2),
      displayName: "Analyst 2",
    },
  ];

  const agencyUsers = [
    {
      email: "user0@client-default.example.com",
      role: getDefaultRoleForTenantType("agency_managed", 0),
      displayName: "Admin",
    },
    {
      email: "user1@client-default.example.com",
      role: getDefaultRoleForTenantType("agency_managed", 1),
      displayName: "Editor",
    },
    {
      email: "user2@client-default.example.com",
      role: getDefaultRoleForTenantType("agency_managed", 2),
      displayName: "Editor 2",
    },
  ];

  await seedDirectTenant(db, {
    tenantId: directTenantId,
    tenantName: "Direct with Default Roles",
    slug: "direct-default",
    type: "direct_business",
    status: "active",
    users: directUsers,
  });

  await seedAgencyPartner(db, {
    name: "Agency with Default Roles",
    slug: "agency-default-roles",
    clientTenants: [
      {
        tenantId: agencyTenantId,
        tenantName: "Agency Client with Default Roles",
        slug: "client-default",
        type: "agency_managed",
        status: "active",
        users: agencyUsers,
      },
    ],
  });
}

/**
 * Example 6: Complete Development Environment
 *
 * Seeds a full development environment with:
 * - 1 agency partner (with agency partner users)
 * - 3 agency-managed client tenants
 * - 2 direct business tenants
 * - Multiple users per tenant with varied roles
 *
 * Email naming convention:
 * - Agency partner: {role}@agency-{slug}.example.com
 * - Agency-managed clients: {role}@client-{slug}.example.com
 * - Direct business: {role}@direct-{slug}.example.com
 */
export async function seedCompleteDevEnvironment(db: Database): Promise<void> {
  await seedRbacSystem(db);

  const agencyPartnerId = "00000000-0000-0000-0000-000000000100";
  const agencyTenantId = "00000000-0000-0000-0000-000000000101";

  // Create agency partner tenant
  await seedDirectTenant(db, {
    tenantId: agencyTenantId,
    tenantName: "Development Agency",
    slug: "dev-agency",
    type: "agency_partner",
    status: "active",
    users: [
      { email: "admin@agency-dev.example.com", role: "admin", displayName: "Agency Admin" },
      { email: "manager@agency-dev.example.com", role: "analyst", displayName: "Agency Manager" },
    ],
  });

  await seedAgencyPartner(db, {
    agencyPartnerId,
    name: "Development Agency",
    slug: "dev-agency",
    clientTenants: [
      {
        tenantId: "00000000-0000-0000-0000-000000000102",
        tenantName: "Dev Client Alpha",
        slug: "client-alpha",
        type: "agency_managed",
        status: "active",
        users: [
          { email: "admin@client-alpha.example.com", role: "admin", displayName: "Alpha Admin" },
          {
            email: "analyst@client-alpha.example.com",
            role: "analyst",
            displayName: "Alpha Analyst",
          },
          { email: "editor@client-alpha.example.com", role: "editor", displayName: "Alpha Editor" },
        ],
      },
      {
        tenantId: "00000000-0000-0000-0000-000000000103",
        tenantName: "Dev Client Beta",
        slug: "client-beta",
        type: "agency_managed",
        status: "active",
        users: [
          { email: "admin@client-beta.example.com", role: "admin", displayName: "Beta Admin" },
          { email: "viewer@client-beta.example.com", role: "viewer", displayName: "Beta Viewer" },
        ],
      },
      {
        tenantId: "00000000-0000-0000-0000-000000000104",
        tenantName: "Dev Client Gamma",
        slug: "client-gamma",
        type: "agency_managed",
        status: "active",
        users: [
          { email: "admin@client-gamma.example.com", role: "admin", displayName: "Gamma Admin" },
        ],
      },
    ],
  });

  await seedDirectTenant(db, {
    tenantId: "00000000-0000-0000-0000-000000000105",
    tenantName: "Dev Direct Business 1",
    slug: "direct-dev1",
    type: "direct_business",
    status: "active",
    users: [
      { email: "admin@direct-dev1.example.com", role: "admin", displayName: "Direct1 Admin" },
      { email: "analyst@direct-dev1.example.com", role: "analyst", displayName: "Direct1 Analyst" },
    ],
  });

  await seedDirectTenant(db, {
    tenantId: "00000000-0000-0000-0000-000000000106",
    tenantName: "Dev Direct Business 2",
    slug: "direct-dev2",
    type: "direct_business",
    status: "active",
    users: [
      { email: "admin@direct-dev2.example.com", role: "admin", displayName: "Direct2 Admin" },
      { email: "editor@direct-dev2.example.com", role: "editor", displayName: "Direct2 Editor" },
      { email: "viewer@direct-dev2.example.com", role: "viewer", displayName: "Direct2 Viewer" },
    ],
  });
}
