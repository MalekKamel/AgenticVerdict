import type { TenantContext } from "@agenticverdict/core";
import { runWithTenantContext } from "@agenticverdict/core";
import { eq } from "drizzle-orm";

import type { Database } from "./client";
import { dbScoped } from "./db-scoped";
import { tenants } from "./schema/tenants";

/**
 * Sets `tenants.active` for the tenant in the current security context.
 */
export async function setTenantTenantActive(
  db: Database,
  ctx: TenantContext,
  active: boolean,
): Promise<void> {
  await runWithTenantContext(ctx, async () =>
    dbScoped(db, async (tx) => {
      await tx
        .update(tenants)
        .set({ active, updatedAt: new Date() })
        .where(eq(tenants.id, ctx.tenantId));
    }),
  );
}
