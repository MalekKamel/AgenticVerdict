import { z } from "zod";
import { brandTokensSchema, type BrandTokens } from "@agenticverdict/types";

/**
 * Tenant UI overrides aligned with `BrandTokens` in `@agenticverdict/types`.
 */

/** Re-exported under legacy name for config package consumers. */
export const tenantBrandTokensSchema = brandTokensSchema;
export type { BrandTokens as TenantBrandTokens };

export const tenantUiSchema = z.object({
  brand: tenantBrandTokensSchema.optional(),
});

export type TenantUi = z.infer<typeof tenantUiSchema>;
