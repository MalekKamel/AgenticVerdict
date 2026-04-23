import type { TenantConfig } from "@agenticverdict/config";
import { runWithTenantContext } from "@agenticverdict/core";
import { eq } from "drizzle-orm";

import type { Database } from "./client";
import { dbScoped } from "./db-scoped";
import { tenants } from "./schema/tenants";

export function suggestSlugFromTenantName(tenantName: string): string {
  const base = tenantName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
  return base.length > 0 ? base : "tenant";
}

/**
 * Inserts the tenant row for a validated `TenantConfig`. Caller must ensure config files (or env) exist for runtime loading.
 * Uses `runWithTenantContext` + `dbScoped` so RLS policies on `tenants` allow the insert.
 */
export async function provisionTenantTenant(
  db: Database,
  tenantConfig: TenantConfig,
  slug: string,
): Promise<void> {
  const ctx = {
    tenantId: tenantConfig.tenantId,
    config: tenantConfig,
    requestId: "provision-tenant",
  };

  await runWithTenantContext(ctx, async () =>
    dbScoped(db, async (tx) => {
      const [existing] = await tx
        .select({ id: tenants.id })
        .from(tenants)
        .where(eq(tenants.id, tenantConfig.tenantId))
        .limit(1);
      if (existing) {
        throw new Error(`Tenant ${tenantConfig.tenantId} already exists`);
      }
      await tx.insert(tenants).values({
        id: tenantConfig.tenantId,
        name: tenantConfig.tenantName,
        slug,
        active: true,
      });
    }),
  );
}
