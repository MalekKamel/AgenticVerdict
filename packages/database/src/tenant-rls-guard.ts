import { sql } from "drizzle-orm";

import type { Database } from "./client";

const DEFAULT_PROBE_TENANT_ID = "00000000-0000-4000-8000-000000000000";

/**
 * Verifies that Postgres session-local tenant binding is functional in this runtime.
 * This is a startup guard for `dbScoped` + RLS assumptions.
 */
export async function verifyTenantRlsSessionBinding(
  db: Database,
  probeTenantId: string = DEFAULT_PROBE_TENANT_ID,
): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.execute(sql`select set_config('app.current_tenant_id', ${probeTenantId}, true)`);
    const rows = await tx.execute<{ tenant: string | null }>(
      sql`select current_setting('app.current_tenant_id', true) as tenant`,
    );
    const tenant = rows[0]?.tenant ?? null;
    if (tenant !== probeTenantId) {
      throw new Error(
        `Tenant RLS session binding check failed: expected "${probeTenantId}" got "${tenant ?? "null"}"`,
      );
    }
  });
}
