import { tenantBrandTokensSchema, getDefaultConfigManager } from "@agenticverdict/config";
import { tenants } from "@agenticverdict/database";
import {
  getTenantBrandingInputSchema,
  getTenantBrandingOutputSchema,
  resolveTenantSlugInputSchema,
  resolveTenantSlugOutputSchema,
} from "@agenticverdict/types";
import { sql } from "drizzle-orm";

import { t } from "../init";
import { requireTrpcDatabase } from "../database";

const publicProcedure = t.procedure;

const configManager = getDefaultConfigManager();

export const tenantRouter = t.router({
  resolveSlug: publicProcedure
    .input(resolveTenantSlugInputSchema)
    .output(resolveTenantSlugOutputSchema)
    .query(async ({ input }) => {
      const db = requireTrpcDatabase();
      const normalized = input.slug.trim().toLowerCase();
      if (!normalized) {
        return { tenantId: null };
      }
      const rows = await db
        .select({ id: tenants.id })
        .from(tenants)
        .where(sql`lower(${tenants.slug}) = ${normalized}`)
        .limit(1);
      const id = rows[0]?.id;
      return { tenantId: id ?? null };
    }),

  getBranding: publicProcedure
    .input(getTenantBrandingInputSchema)
    .output(getTenantBrandingOutputSchema)
    .query(async ({ input }) => {
      try {
        const config = await configManager.loadTenantConfig(input.tenantId);
        if (config.ui?.brand) {
          return { brand: tenantBrandTokensSchema.parse(config.ui.brand) };
        }
        return { brand: null };
      } catch {
        return { brand: null };
      }
    }),
});
