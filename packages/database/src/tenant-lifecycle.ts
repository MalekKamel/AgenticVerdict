import type { TenantContext } from "@agenticverdict/core";
import type { TenantStatus } from "@agenticverdict/types";
import { runWithTenantContext } from "@agenticverdict/core";
import { eq } from "drizzle-orm";

import type { Database } from "./client";
import { dbScoped } from "./db-scoped";
import { tenants } from "./schema/tenants";

/**
 * Sets `tenants.status` for the tenant in the current security context.
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
        .set({
          status: active ? ("active" as TenantStatus) : ("suspended" as TenantStatus),
          updatedAt: new Date(),
        })
        .where(eq(tenants.id, ctx.tenantId));
    }),
  );
}
