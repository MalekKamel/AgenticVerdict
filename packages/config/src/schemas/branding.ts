import { z } from "zod";

const hex6 = z.string().regex(/^#[0-9A-Fa-f]{6}$/);

export const designTokensSchema = z.object({
  colors: z.object({
    primary: hex6,
    secondary: hex6,
    accent: hex6,
    success: hex6,
    warning: hex6,
    error: hex6,
    info: hex6,
    neutral: z.array(hex6).min(1),
    semantic: z.object({
      background: hex6,
      foreground: hex6,
      border: hex6,
    }),
  }),
  typography: z.object({
    families: z.object({
      headings: z.string().min(1),
      body: z.string().min(1),
      mono: z.string().min(1),
    }),
    sizes: z.object({
      xs: z.string().min(1),
      sm: z.string().min(1),
      md: z.string().min(1),
      lg: z.string().min(1),
      xl: z.string().min(1),
      "2xl": z.string().min(1),
      "3xl": z.string().min(1),
      "4xl": z.string().min(1),
    }),
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
  spacing: z.object({
    xs: z.string().min(1),
    sm: z.string().min(1),
    md: z.string().min(1),
    lg: z.string().min(1),
    xl: z.string().min(1),
    "2xl": z.string().min(1),
    "3xl": z.string().min(1),
  }),
  borders: z.object({
    radius: z.object({
      sm: z.string().min(1),
      md: z.string().min(1),
      lg: z.string().min(1),
      full: z.string().min(1),
    }),
    width: z.object({
      thin: z.string().min(1),
      medium: z.string().min(1),
      thick: z.string().min(1),
    }),
  }),
  shadows: z.object({
    sm: z.string().min(1),
    md: z.string().min(1),
    lg: z.string().min(1),
    xl: z.string().min(1),
  }),
  transitions: z.object({
    fast: z.string().min(1),
    normal: z.string().min(1),
    slow: z.string().min(1),
  }),
});

export type DesignTokens = z.infer<typeof designTokensSchema>;

/** Default design tokens (Mantine-friendly CSS values). */
export const defaultDesignTokens: DesignTokens = {
  colors: {
    primary: "#3B82F6",
    secondary: "#8B5CF6",
    accent: "#EC4899",
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
    info: "#06B6D4",
    neutral: [
      "#F9FAFB",
      "#F3F4F6",
      "#E5E7EB",
      "#D1D5DB",
      "#9CA3AF",
      "#6B7280",
      "#4B5563",
      "#374151",
      "#1F2937",
      "#111827",
    ],
    semantic: {
      background: "#FFFFFF",
      foreground: "#111827",
      border: "#E5E7EB",
    },
  },
  typography: {
    families: {
      headings: "Inter, system-ui, sans-serif",
      body: "Inter, system-ui, sans-serif",
      mono: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    },
    sizes: {
      xs: "0.75rem",
      sm: "0.875rem",
      md: "1rem",
      lg: "1.125rem",
      xl: "1.25rem",
      "2xl": "1.5rem",
      "3xl": "1.875rem",
      "4xl": "2.25rem",
    },
    weights: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeights: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
  },
  spacing: {
    xs: "0.25rem",
    sm: "0.5rem",
    md: "1rem",
    lg: "1.5rem",
    xl: "2rem",
    "2xl": "3rem",
    "3xl": "4rem",
  },
  borders: {
    radius: {
      sm: "0.25rem",
      md: "0.5rem",
      lg: "1rem",
      full: "9999px",
    },
    width: {
      thin: "1px",
      medium: "2px",
      thick: "4px",
    },
  },
  shadows: {
    sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
    xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
  },
  transitions: {
    fast: "120ms ease",
    normal: "200ms ease",
    slow: "320ms ease",
  },
};

/**
 * Maps {@link DesignTokens} to a Mantine-like theme object (v7 shape) without importing Mantine.
 * Consumers can spread into `createTheme` or adapt keys as needed.
 */
export function mantineThemeFromDesignTokens(tokens: DesignTokens): Record<string, unknown> {
  const [n0, n1, n2, n3, n4, , , n7, n8, n9] = tokens.colors.neutral;
  return {
    primaryColor: "brand",
    colors: {
      brand: [
        n0 ?? "#F9FAFB",
        n1 ?? "#F3F4F6",
        n2 ?? "#E5E7EB",
        n3 ?? "#D1D5DB",
        n4 ?? "#9CA3AF",
        tokens.colors.primary,
        tokens.colors.secondary,
        n7 ?? "#374151",
        n8 ?? "#1F2937",
        n9 ?? "#111827",
      ],
      green: [tokens.colors.success],
      yellow: [tokens.colors.warning],
      red: [tokens.colors.error],
      blue: [tokens.colors.info],
    },
    fontFamily: tokens.typography.families.body,
    headings: {
      fontFamily: tokens.typography.families.headings,
      fontWeight: String(tokens.typography.weights.semibold),
      sizes: {
        h1: {
          fontSize: tokens.typography.sizes["4xl"],
          lineHeight: String(tokens.typography.lineHeights.tight),
        },
        h2: {
          fontSize: tokens.typography.sizes["3xl"],
          lineHeight: String(tokens.typography.lineHeights.tight),
        },
        h3: {
          fontSize: tokens.typography.sizes["2xl"],
          lineHeight: String(tokens.typography.lineHeights.normal),
        },
        h4: {
          fontSize: tokens.typography.sizes.xl,
          lineHeight: String(tokens.typography.lineHeights.normal),
        },
      },
    },
    defaultRadius: tokens.borders.radius.md,
    spacing: {
      xs: tokens.spacing.xs,
      sm: tokens.spacing.sm,
      md: tokens.spacing.md,
      lg: tokens.spacing.lg,
      xl: tokens.spacing.xl,
    },
    shadows: {
      xs: tokens.shadows.sm,
      sm: tokens.shadows.sm,
      md: tokens.shadows.md,
      lg: tokens.shadows.lg,
      xl: tokens.shadows.xl,
    },
    other: {
      designTokensCssVariables: designTokensToCssVariables(tokens),
    },
  };
}

/** Flat CSS custom properties for PDF or non-Mantine renderers. */
export function designTokensToCssVariables(tokens: DesignTokens): Record<string, string> {
  return {
    "--av-color-primary": tokens.colors.primary,
    "--av-color-secondary": tokens.colors.secondary,
    "--av-color-accent": tokens.colors.accent,
    "--av-color-success": tokens.colors.success,
    "--av-color-warning": tokens.colors.warning,
    "--av-color-error": tokens.colors.error,
    "--av-color-info": tokens.colors.info,
    "--av-color-bg": tokens.colors.semantic.background,
    "--av-color-fg": tokens.colors.semantic.foreground,
    "--av-color-border": tokens.colors.semantic.border,
    "--av-font-body": tokens.typography.families.body,
    "--av-font-heading": tokens.typography.families.headings,
    "--av-space-xs": tokens.spacing.xs,
    "--av-space-sm": tokens.spacing.sm,
    "--av-space-md": tokens.spacing.md,
    "--av-space-lg": tokens.spacing.lg,
    "--av-radius-md": tokens.borders.radius.md,
  };
}

export function exportDesignTokensJsonSchema(): Record<string, unknown> {
  return designTokensSchema.toJSONSchema() as Record<string, unknown>;
}
