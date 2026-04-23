import { z } from "zod";

/**
 * Tenant UI overrides aligned with `BrandTokens` in `@agenticverdict/ui`.
 * Kept in config (not re-exported from ui) to avoid a config ↔ ui dependency cycle.
 */
export const tenantBrandTokensSchema = z.object({
  colors: z.object({
    primary: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    secondary: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    success: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    warning: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    danger: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    info: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  }),
  typography: z.object({
    fontFamily: z.string().min(1),
    fontFamilySecondary: z.string().optional(),
  }),
  branding: z.object({
    logoUrl: z.string().optional(),
    logoHeight: z.string().optional(),
    appName: z.string().optional(),
  }),
});

export const tenantUiSchema = z.object({
  brand: tenantBrandTokensSchema.optional(),
});

export type TenantUi = z.infer<typeof tenantUiSchema>;
export type TenantBrandTokens = z.infer<typeof tenantBrandTokensSchema>;
