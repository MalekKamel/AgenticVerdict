import { sql } from "drizzle-orm";

import { getTenantContext } from "@agenticverdict/core";

import type { Database } from "./client";

type TransactionCallback = Parameters<Database["transaction"]>[0];
type TransactionClient = Parameters<TransactionCallback>[0];

/**
 * Runs `fn` inside a transaction with PostgreSQL `app.current_tenant_id` set for RLS.
 * Requires an active tenant context from `@agenticverdict/core`.
 */
export async function dbScoped<T>(
  db: Database,
  fn: (tx: TransactionClient) => Promise<T>,
): Promise<T> {
  const ctx = getTenantContext();
  if (!ctx) {
    throw new Error("Tenant context is required for dbScoped database access");
  }

  return db.transaction(async (tx) => {
    await tx.execute(
      sql`select set_config('app.current_tenant_id', ${ctx.tenantId}::text, true)`,
    );
    return fn(tx);
  });
}
