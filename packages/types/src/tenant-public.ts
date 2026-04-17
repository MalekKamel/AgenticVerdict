import { z } from "zod";

export const resolveTenantSlugInputSchema = z.object({
  slug: z.string().min(1).max(128),
});

export const resolveTenantSlugOutputSchema = z.object({
  tenantId: z.string().uuid().nullable(),
});

/** Public branding payload (mirrors `companyBrandTokensSchema` in `@agenticverdict/config`). */
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
