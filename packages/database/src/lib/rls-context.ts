import { sql } from "drizzle-orm";
import { Database } from "../client";

/**
 * Sets tenant context for RLS policies
 * Must be called at the start of each request
 */
export async function setTenantContext(
  db: Database,
  tenantId: string,
  userId?: string,
): Promise<void> {
  await db.execute(sql`select set_config('app.current_tenant_id', ${tenantId}, true)`);

  if (userId) {
    await db.execute(sql`select set_config('app.current_user_id', ${userId}, true)`);
  }
}

/**
 * Clear tenant context after request completes
 */
export async function clearTenantContext(db: Database): Promise<void> {
  await db.execute(sql`select set_config('app.current_tenant_id', NULL, true)`);
  await db.execute(sql`select set_config('app.current_user_id', NULL, true)`);
}
