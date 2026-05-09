/**
 * Brand tokens - tenant-specific theme overrides
 * These tokens allow multi-tenant theming without code changes
 */

import type { BrandTokens } from "@agenticverdict/types";
import { globalTokens } from "./global";

/**
 * Default brand theme - used when no tenant-specific theme is active
 * Based on Masafh branding (Riyadh-based B2B GPS fleet tracking)
 */
export const defaultBrandTheme: BrandTokens = {
  colors: {
    primary: globalTokens.color.blue[600], // #1976D2
    secondary: globalTokens.color.gray[600], // #757575
    success: globalTokens.color.green[600], // #43A047
    warning: globalTokens.color.orange[600], // #ED6C02
    danger: globalTokens.color.red[600], // #D32F2F
    info: globalTokens.color.blue[500], // #228BE6
  },
  typography: {
    fontFamily: "Inter, system-ui, -apple-system, sans-serif",
    fontFamilySecondary: undefined,
  },
  branding: {
    logoUrl: undefined,
    logoHeight: "32px",
    appName: "AgenticVerdict",
  },
};

/**
 * Masafh tenant theme
 * Primary client: B2B GPS fleet tracking tenant in Riyadh
 */
export const masafhTheme: BrandTokens = {
  colors: {
    primary: "#1976D2", // Masafh blue
    secondary: "#616161",
    success: "#2E7D32",
    warning: "#F57C00",
    danger: "#C62828",
    info: "#0288D1",
  },
  typography: {
    fontFamily: "Inter, system-ui, -apple-system, sans-serif",
  },
  branding: {
    logoUrl: "/logos/masafh-logo.svg",
    logoHeight: "32px",
    appName: "Masafh",
  },
};

/**
 * Brand CSS custom properties
 * These are applied at runtime based on the active tenant
 */
export function getBrandCSSVariables(theme: BrandTokens = defaultBrandTheme) {
  return {
    "--brand-color-primary": theme.colors.primary,
    "--brand-color-secondary": theme.colors.secondary,
    "--brand-color-success": theme.colors.success,
    "--brand-color-warning": theme.colors.warning,
    "--brand-color-danger": theme.colors.danger,
    "--brand-color-info": theme.colors.info,
    "--brand-font-family": theme.typography.fontFamily,
    "--brand-font-family-secondary":
      theme.typography.fontFamilySecondary || theme.typography.fontFamily,
    "--brand-logo-url": theme.branding.logoUrl || "",
    "--brand-logo-height": theme.branding.logoHeight || "32px",
    "--brand-app-name": theme.branding.appName || "AgenticVerdict",
  } as const;
}
