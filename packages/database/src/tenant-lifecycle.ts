import type { TenantContext } from "@agenticverdict/core";
import { runWithTenantContext } from "@agenticverdict/core";
import { eq } from "drizzle-orm";

import type { Database } from "./client";
import { dbScoped } from "./db-scoped";
import { companies } from "./schema/companies";

/**
 * Sets `companies.active` for the tenant in the current security context.
 */
export async function setTenantCompanyActive(
  db: Database,
  ctx: TenantContext,
  active: boolean,
): Promise<void> {
  await runWithTenantContext(ctx, async () =>
    dbScoped(db, async (tx) => {
      await tx
        .update(companies)
        .set({ active, updatedAt: new Date() })
        .where(eq(companies.id, ctx.tenantId));
    }),
  );
}
