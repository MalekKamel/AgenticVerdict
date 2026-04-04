import type { CompanyConfig } from "@agenticverdict/config";
import { runWithTenantContext } from "@agenticverdict/core";
import { eq } from "drizzle-orm";

import type { Database } from "./client";
import { dbScoped } from "./db-scoped";
import { companies } from "./schema/companies";

export function suggestSlugFromCompanyName(companyName: string): string {
  const base = companyName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
  return base.length > 0 ? base : "tenant";
}

/**
 * Inserts the tenant row for a validated `CompanyConfig`. Caller must ensure config files (or env) exist for runtime loading.
 * Uses `runWithTenantContext` + `dbScoped` so RLS policies on `companies` allow the insert.
 */
export async function provisionTenantCompany(
  db: Database,
  companyConfig: CompanyConfig,
  slug: string,
): Promise<void> {
  const ctx = {
    tenantId: companyConfig.companyId,
    config: companyConfig,
    requestId: "provision-tenant",
  };

  await runWithTenantContext(ctx, async () =>
    dbScoped(db, async (tx) => {
      const [existing] = await tx
        .select({ id: companies.id })
        .from(companies)
        .where(eq(companies.id, companyConfig.companyId))
        .limit(1);
      if (existing) {
        throw new Error(`Company ${companyConfig.companyId} already exists`);
      }
      await tx.insert(companies).values({
        id: companyConfig.companyId,
        name: companyConfig.companyName,
        slug,
        active: true,
      });
    }),
  );
}
