import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { LOCAL_COMPOSE_POSTGRES_URL } from "../src/local-postgres-default-url";
import * as schema from "../src/schema/index";
import { seedConnectorRegistry } from "../src/seed-connectors";
import { seedTenantsFromJsonDir } from "../src/seeds/tenant-config-seed";
import { seedAgencyPartnersFromTenantConfigs } from "../src/seeds/agency-partners-seed";
import { seedRbacSystem, seedSystemRolesForTenant } from "../src/seeds/rbac-seed";
import { seedUsersForTenant } from "../src/seeds/users-seed";
import { seedTenantConnectors } from "../src/seeds/connectors-seed";
import { seedInsightsForTenant } from "../src/seeds/insights-seed";
import { seedReportTemplatesForTenant, seedReportsForTenant } from "../src/seeds/reports-seed";
import { UserFactory } from "../src/factories/user-factory";
import { ConnectorFactory } from "../src/factories/connector-factory";
import { InsightFactory } from "../src/factories/insight-factory";
import type { SystemRole } from "@agenticverdict/types";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(scriptDir, "..", "..", "..");
const DEV_TENANT_CONFIGS_DIR = join(repoRoot, "tests", "fixtures", "dev-seed-configs");

interface SeededTenant {
  id: string;
  slug: string;
  type: string;
}

async function main(): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    throw new Error("❌ Seeding is not allowed in production!");
  }

  if (process.env.DATABASE_URL?.includes("prod")) {
    throw new Error("❌ Seeding detected on production database!");
  }

  const connectionString = process.env.DATABASE_URL ?? LOCAL_COMPOSE_POSTGRES_URL;

  const client = postgres(connectionString, { max: 2 });
  const db = drizzle(client, { schema });

  try {
    console.log("🌱 Starting development database seed...");

    console.log("  → Seeding connector registry...");
    await seedConnectorRegistry(db);

    console.log("  → Seeding RBAC system (permissions / roles)...");
    await seedRbacSystem(db);

    console.log("  → Seeding agency partners from configs...");
    const agencyPartnerCount = await seedAgencyPartnersFromTenantConfigs(
      db,
      DEV_TENANT_CONFIGS_DIR,
    );
    console.log(`  → Seeded ${agencyPartnerCount} agency partners`);

    console.log("  → Seeding tenants from dev configs...");
    await seedTenantsFromJsonDir(db, DEV_TENANT_CONFIGS_DIR);

    const seededTenants: SeededTenant[] = await db
      .select({
        id: schema.tenants.id,
        slug: schema.tenants.slug,
        type: schema.tenants.type,
      })
      .from(schema.tenants);

    for (const tenant of seededTenants) {
      console.log(`  → Seeding data for tenant: ${tenant.slug}`);

      await seedSystemRolesForTenant(db, tenant.id);

      const users = UserFactory.createList(
        tenant.slug,
        3,
        true,
        tenant.type as "direct_business" | "agency_partner" | "agency_managed",
      );
      const userRoles: SystemRole[] =
        tenant.type === "agency_partner"
          ? ["admin", "manager", "viewer"]
          : tenant.type === "agency_managed"
            ? ["admin", "editor", "analyst"]
            : ["admin", "analyst", "viewer"];
      await seedUsersForTenant(
        db,
        tenant.id,
        users.map((u, index) => ({
          email: u.email,
          displayName: u.displayName,
          passwordHash: u.passwordHash,
          role: userRoles[index] || "viewer",
        })),
      );

      const connectors = ConnectorFactory.createList(tenant.slug, ["ga4", "meta", "gsc"]);
      await seedTenantConnectors(db, tenant.id, connectors);

      const insights = InsightFactory.createList(tenant.slug, [
        "Weekly Performance",
        "Monthly ROI",
      ]);
      await seedInsightsForTenant(db, tenant.id, insights);

      await seedReportTemplatesForTenant(db, tenant.id, [
        {
          name: "Standard Performance Template",
          definition: {
            version: "1.0",
            sections: ["overview", "metrics", "insights"],
          },
        },
      ]);

      const now = new Date();
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      await seedReportsForTenant(db, tenant.id, [
        {
          title: `Monthly Performance - ${monthAgo.toLocaleDateString("en-US", { month: "short", year: "numeric" })}`,
          status: "published",
        },
        {
          title: `Draft Report - ${now.toLocaleDateString("en-US", { month: "short", year: "numeric" })}`,
          status: "draft",
        },
      ]);
    }

    console.log("✅ Development seed complete!");
    console.log(`   - Seeded ${seededTenants.length} tenants`);
    console.log(`   - Each tenant has: 3 users, 3 connectors, 2 insights, 1 template, 2 reports`);
  } finally {
    await client.end({ timeout: 10 });
  }
}

main().catch((err: unknown) => {
  console.error(err);
  process.exitCode = 1;
});
