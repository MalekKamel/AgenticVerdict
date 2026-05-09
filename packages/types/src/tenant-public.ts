import { z } from "zod";

export const resolveTenantSlugInputSchema = z.object({
  slug: z.string().min(1).max(128),
});

export const resolveTenantSlugOutputSchema = z.object({
  tenantId: z.string().uuid().nullable(),
});

/** Public branding payload (mirrors `tenantBrandTokensSchema` in `@agenticverdict/config`). */
export const tenantBrandingTokensSchema = z.object({
  colors: z.object({
    primary: z.string(),
    secondary: z.string(),
    success: z.string(),
    warning: z.string(),
    danger: z.string(),
    info: z.string(),
  }),
  typography: z.object({
    fontFamily: z.string(),
    fontFamilySecondary: z.string().optional(),
  }),
  branding: z.object({
    logoUrl: z.string().optional(),
    logoHeight: z.string().optional(),
    appName: z.string().optional(),
  }),
});

export const getTenantBrandingInputSchema = z.object({
  tenantId: z.string().uuid(),
});

export const getTenantBrandingOutputSchema = z.object({
  brand: tenantBrandingTokensSchema.nullable(),
});

export type ResolveTenantSlugInput = z.infer<typeof resolveTenantSlugInputSchema>;
export type ResolveTenantSlugOutput = z.infer<typeof resolveTenantSlugOutputSchema>;
export type GetTenantBrandingInput = z.infer<typeof getTenantBrandingInputSchema>;
export type GetTenantBrandingOutput = z.infer<typeof getTenantBrandingOutputSchema>;

// ============================================================================
// Tenant Config Output Schema (moved from apps/api/src/trpc/routers/insights.ts)
// ============================================================================

export const tenantConfigOutputSchema = z.object({
  shareLinkExpiryHours: z.number().min(1).max(720),
  defaultAiModel: z.string().nullable(),
  defaultAiProvider: z.string().nullable(),
  defaultAiQuality: z.string().nullable(),
  defaultAiDetailLevel: z.string().nullable(),
  detailLevelOptions: z.array(
    z.object({
      value: z.string(),
      labelKey: z.string(),
      order: z.number().optional(),
    }),
  ),
  frequencyOptions: z.array(
    z.object({
      value: z.string(),
      labelKey: z.string(),
      order: z.number().optional(),
    }),
  ),
  formatOptions: z.array(
    z.object({
      value: z.string(),
      labelKey: z.string(),
      order: z.number().optional(),
    }),
  ),
});
export type TenantConfigOutput = z.infer<typeof tenantConfigOutputSchema>;
