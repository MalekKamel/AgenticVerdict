/**
 * Global design tokens - brand-agnostic primitives
 * Based on AgenticVerdict design system specifications from .pen files
 *
 * Color palette inspired by Material Design with Inter font family
 * Base unit: 4px for spacing scale
 */

import type { GlobalTokens } from "./types";

/**
 * Global design token values
 * These are brand-agnostic primitives used across all tenants
 */
export const globalTokens: GlobalTokens = {
  color: {
    blue: {
      50: "#E3F2FD",
      100: "#BBDEFB",
      200: "#90CAF9",
      300: "#64B5F6",
      400: "#42A5F5",
      500: "#228BE6",
      600: "#1976D2", // Primary blue from button.pen
      700: "#1565C0", // Hover state
      800: "#0D47A1", // Active state
      900: "#0A3D91",
    },
    gray: {
      50: "#FAFAFA",
      100: "#F5F5F5",
      200: "#EEEEEE",
      300: "#E0E0E0", // Border color from input/search
      400: "#BDBDBD", // Disabled state
      500: "#9E9E9E", // Icon color from search-input
      600: "#757575", // Secondary text
      700: "#616161",
      800: "#424242",
      900: "#212121", // Primary text
    },
    green: {
      50: "#E8F5E9",
      100: "#C8E6C9",
      200: "#A5D6A7",
      300: "#81C784",
      400: "#66BB6A",
      500: "#2E7D32", // Success
      600: "#43A047",
      700: "#2E7D32",
      800: "#1B5E20",
      900: "#0D3D0D",
    },
    orange: {
      50: "#FFF3E0",
      100: "#FFE0B2",
      200: "#FFCC80",
      300: "#FFB74D",
      400: "#FFA726",
      500: "#FF9800",
      600: "#ED6C02", // Warning
      700: "#F57C00",
      800: "#EF6C00",
      900: "#E65100",
    },
    red: {
      50: "#FFEBEE",
      100: "#FFCDD2",
      200: "#EF9A9A",
      300: "#E57373",
      400: "#EF5350",
      500: "#F44336",
      600: "#D32F2F", // Danger/Error
      700: "#C62828",
      800: "#B71C1C",
      900: "#7B1FA2",
    },
  },
  spacing: {
    0: "0",
    1: "0.25rem" /* 4px */,
    2: "0.5rem" /* 8px */,
    3: "0.75rem" /* 12px */,
    4: "1rem" /* 16px - 1 base unit */,
    5: "1.25rem" /* 20px */,
    6: "1.5rem" /* 24px */,
    8: "2rem" /* 32px */,
    10: "2.5rem" /* 40px */,
    12: "3rem" /* 48px */,
    16: "4rem" /* 64px */,
    20: "5rem" /* 80px */,
    24: "6rem" /* 96px */,
  },
  fontSize: {
    xs: "0.75rem" /* 12px */,
    sm: "0.875rem" /* 14px */,
    md: "1rem" /* 16px - button text */,
    lg: "1.125rem" /* 18px */,
    xl: "1.25rem" /* 20px */,
    "2xl": "1.5rem" /* 24px */,
    "3xl": "1.875rem" /* 30px */,
  },
  fontWeight: {
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  },
  radius: {
    sm: "0.25rem" /* 4px */,
    md: "0.5rem" /* 8px - button/input radius */,
    lg: "0.75rem" /* 12px */,
    xl: "1rem" /* 16px */,
    full: "9999px" /* Pill shape */,
  },
  shadow: {
    sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
    xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
  },
};

/**
 * CSS custom properties for global tokens
 * These are applied to :root and available throughout the application
 */
export const globalCSSVariables = {
  // Blue color scale
  "--av-color-blue-50": globalTokens.color.blue[50],
  "--av-color-blue-100": globalTokens.color.blue[100],
  "--av-color-blue-200": globalTokens.color.blue[200],
  "--av-color-blue-300": globalTokens.color.blue[300],
  "--av-color-blue-400": globalTokens.color.blue[400],
  "--av-color-blue-500": globalTokens.color.blue[500],
  "--av-color-blue-600": globalTokens.color.blue[600],
  "--av-color-blue-700": globalTokens.color.blue[700],
  "--av-color-blue-800": globalTokens.color.blue[800],
  "--av-color-blue-900": globalTokens.color.blue[900],

  // Gray color scale
  "--av-color-gray-50": globalTokens.color.gray[50],
  "--av-color-gray-100": globalTokens.color.gray[100],
  "--av-color-gray-200": globalTokens.color.gray[200],
  "--av-color-gray-300": globalTokens.color.gray[300],
  "--av-color-gray-400": globalTokens.color.gray[400],
  "--av-color-gray-500": globalTokens.color.gray[500],
  "--av-color-gray-600": globalTokens.color.gray[600],
  "--av-color-gray-700": globalTokens.color.gray[700],
  "--av-color-gray-800": globalTokens.color.gray[800],
  "--av-color-gray-900": globalTokens.color.gray[900],

  // Semantic colors
  "--av-color-success": globalTokens.color.green[600],
  "--av-color-warning": globalTokens.color.orange[600],
  "--av-color-danger": globalTokens.color.red[600],
  "--av-color-info": globalTokens.color.blue[600],

  // Spacing scale
  "--av-spacing-0": globalTokens.spacing[0],
  "--av-spacing-1": globalTokens.spacing[1],
  "--av-spacing-2": globalTokens.spacing[2],
  "--av-spacing-3": globalTokens.spacing[3],
  "--av-spacing-4": globalTokens.spacing[4],
  "--av-spacing-5": globalTokens.spacing[5],
  "--av-spacing-6": globalTokens.spacing[6],
  "--av-spacing-8": globalTokens.spacing[8],
  "--av-spacing-10": globalTokens.spacing[10],
  "--av-spacing-12": globalTokens.spacing[12],
  "--av-spacing-16": globalTokens.spacing[16],
  "--av-spacing-20": globalTokens.spacing[20],
  "--av-spacing-24": globalTokens.spacing[24],

  // Font sizes
  "--av-font-size-xs": globalTokens.fontSize.xs,
  "--av-font-size-sm": globalTokens.fontSize.sm,
  "--av-font-size-md": globalTokens.fontSize.md,
  "--av-font-size-lg": globalTokens.fontSize.lg,
  "--av-font-size-xl": globalTokens.fontSize.xl,
  "--av-font-size-2xl": globalTokens.fontSize["2xl"],
  "--av-font-size-3xl": globalTokens.fontSize["3xl"],

  // Font weights
  "--av-font-weight-normal": globalTokens.fontWeight.normal,
  "--av-font-weight-medium": globalTokens.fontWeight.medium,
  "--av-font-weight-semibold": globalTokens.fontWeight.semibold,
  "--av-font-weight-bold": globalTokens.fontWeight.bold,

  // Border radius
  "--av-radius-sm": globalTokens.radius.sm,
  "--av-radius-md": globalTokens.radius.md,
  "--av-radius-lg": globalTokens.radius.lg,
  "--av-radius-xl": globalTokens.radius.xl,
  "--av-radius-full": globalTokens.radius.full,

  // Shadows
  "--av-shadow-sm": globalTokens.shadow.sm,
  "--av-shadow-md": globalTokens.shadow.md,
  "--av-shadow-lg": globalTokens.shadow.lg,
  "--av-shadow-xl": globalTokens.shadow.xl,

  // Font family
  "--av-font-family": "Inter, system-ui, -apple-system, sans-serif",
} as const;

/**
 * Type for CSS variable names
 */
export type GlobalCSSVariable = keyof typeof globalCSSVariables;

/**
 * Get a CSS variable value by name
 */
export function getCSSVariable(name: GlobalCSSVariable): string {
  return `var(${name})`;
}
