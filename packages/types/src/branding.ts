import { z } from "zod";

/**
 * Brand tokens - tenant-specific theme overrides
 * Unified source of truth for branding across ui, config, and types packages.
 */

export const brandTokensSchema = z.object({
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

export type BrandTokens = z.infer<typeof brandTokensSchema>;

export const designTokensSchema = z.object({
  colors: z.object({
    primary: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    secondary: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    accent: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    success: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    warning: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    error: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    info: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    neutral: z.array(z.string().regex(/^#[0-9A-Fa-f]{6}$/)).min(1),
    semantic: z.object({
      background: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
      foreground: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
      border: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    }),
  }),
  typography: z.object({
    families: z.object({
      headings: z.string().min(1),
      body: z.string().min(1),
      mono: z.string().min(1),
    }),
    sizes: z.record(z.string(), z.string().min(1)),
    weights: z.object({
      regular: z.number().int().min(100).max(900),
      medium: z.number().int().min(100).max(900),
      semibold: z.number().int().min(100).max(900),
      bold: z.number().int().min(100).max(900),
    }),
    lineHeights: z.object({
      tight: z.number().positive(),
      normal: z.number().positive(),
      relaxed: z.number().positive(),
    }),
  }),
  spacing: z.record(z.string(), z.string().min(1)),
  borders: z.object({
    radius: z.record(z.string(), z.string().min(1)),
    width: z.record(z.string(), z.string().min(1)),
  }),
  shadows: z.record(z.string(), z.string().min(1)),
  transitions: z.record(z.string(), z.string().min(1)),
});

export type DesignTokens = z.infer<typeof designTokensSchema>;
