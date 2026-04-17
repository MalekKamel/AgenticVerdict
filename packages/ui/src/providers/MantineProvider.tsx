/**
 * MantineProvider - Integrates Mantine UI with AgenticVerdict design tokens
 * Wraps Mantine's ThemeProvider and applies our three-tier token system
 */

"use client";

import type { ReactNode } from "react";
import { MantineProvider as MantineCoreProvider } from "@mantine/core";
import { useDirection } from "./DirectionProvider";
import { useTheme } from "./ThemeProvider";

/**
 * Props for MantineProvider
 */
export interface MantineProviderProps {
  children: ReactNode;
  /** Additional CSS to inject */
  cssVariablesResolver?: () => Record<string, string>;
}

/**
 * Convert our design tokens to Mantine theme
 */
function createMantineTheme(direction: "ltr" | "rtl") {
  return {
    fontFamily: "var(--brand-font-family, Inter)",
    fontFamilyMonospace: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    headings: {
      fontFamily: "var(--brand-font-family, Inter)",
      fontWeight: "600",
      textWrap: "wrap" as const,
      sizes: {
        h1: { fontSize: "2rem", fontWeight: "700", lineHeight: "1.2" },
        h2: { fontSize: "1.5rem", fontWeight: "600", lineHeight: "1.3" },
        h3: { fontSize: "1.25rem", fontWeight: "600", lineHeight: "1.4" },
        h4: { fontSize: "1.125rem", fontWeight: "600", lineHeight: "1.4" },
        h5: { fontSize: "1rem", fontWeight: "600", lineHeight: "1.5" },
        h6: { fontSize: "0.875rem", fontWeight: "600", lineHeight: "1.5" },
      },
    },
    fontSizes: {
      xs: "0.75rem",
      sm: "0.875rem",
      md: "1rem",
      lg: "1.125rem",
      xl: "1.25rem",
    },
    spacing: {
      xs: "0.25rem",
      sm: "0.5rem",
      md: "1rem",
      lg: "1.5rem",
      xl: "2rem",
    },
    radius: {
      xs: "0.125rem",
      sm: "0.25rem",
      md: "0.5rem",
      lg: "0.75rem",
      xl: "1rem",
    },
    colors: {
      // Map our color tokens to Mantine's color system
      blue: [
        "#E3F2FD",
        "#BBDEFB",
        "#90CAF9",
        "#64B5F6",
        "#42A5F5",
        "#228BE6",
        "#1976D2",
        "#1565C0",
        "#0D47A1",
        "#0A3D91",
      ] as const,
      gray: [
        "#FAFAFA",
        "#F5F5F5",
        "#EEEEEE",
        "#E0E0E0",
        "#BDBDBD",
        "#9E9E9E",
        "#757575",
        "#616161",
        "#424242",
        "#212121",
      ] as const,
      green: [
        "#E8F5E9",
        "#C8E6C9",
        "#A5D6A7",
        "#81C784",
        "#66BB6A",
        "#2E7D32",
        "#43A047",
        "#2E7D32",
        "#1B5E20",
        "#0D3D0D",
      ] as const,
      orange: [
        "#FFF3E0",
        "#FFE0B2",
        "#FFCC80",
        "#FFB74D",
        "#FFA726",
        "#FF9800",
        "#ED6C02",
        "#F57C00",
        "#EF6C00",
        "#E65100",
      ] as const,
      red: [
        "#FFEBEE",
        "#FFCDD2",
        "#EF9A9A",
        "#E57373",
        "#EF5350",
        "#F44336",
        "#D32F2F",
        "#C62828",
        "#B71C1C",
        "#7B1FA2",
      ] as const,
      dark: [
        "#C1C2C5",
        "#A6A7AB",
        "#909296",
        "#5C5F66",
        "#373A40",
        "#2C2E33",
        "#25262B",
        "#1A1B1E",
        "#141517",
        "#101113",
      ] as const,
      pink: [
        "#FDE4EF",
        "#FAC9DE",
        "#F8A9C9",
        "#F588B5",
        "#F36BA1",
        "#F04F8D",
        "#E03A7A",
        "#C92B67",
        "#B01D54",
        "#961042",
      ] as const,
      grape: [
        "#F8F0FC",
        "#F0DBF7",
        "#E7B7EE",
        "#DE93E6",
        "#D570DD",
        "#CC4DD4",
        "#BA33C1",
        "#A71BAE",
        "#920A9A",
        "#7D0085",
      ] as const,
      violet: [
        "#F3F0FF",
        "#E5DBFF",
        "#D0BFFF",
        "#B197FC",
        "#9775FA",
        "#7950F2",
        "#7048E8",
        "#6741D9",
        "#5F3DC4",
        "#5334B0",
      ] as const,
      indigo: [
        "#EDF2FF",
        "#DBE4FF",
        "#BAC8FF",
        "#91A7FF",
        "#748FFC",
        "#5C7CFA",
        "#4C6EF5",
        "#4263EB",
        "#3B5BDB",
        "#364FC7",
      ] as const,
      yellow: [
        "#FFF9DB",
        "#FFF3BF",
        "#FFEC99",
        "#FFE066",
        "#FFD43B",
        "#FCC419",
        "#FAB005",
        "#F59F00",
        "#F08C00",
        "#E67700",
      ] as const,
      teal: [
        "#E3FCF8",
        "#C6F5ED",
        "#96E9D9",
        "#63D9C2",
        "#38C9AB",
        "#12B892",
        "#0CA682",
        "#089272",
        "#057E62",
        "#026A52",
      ] as const,
      cyan: [
        "#E5F9F7",
        "#C5F5ED",
        "#96EBE0",
        "#63DDD1",
        "#38CFC2",
        "#12BFB3",
        "#0CAFA3",
        "#089D92",
        "#058A80",
        "#02776E",
      ] as const,
      lime: [
        "#F4FCE3",
        "#E9FAC8",
        "#D8F5A2",
        "#C0EB75",
        "#A9E34B",
        "#94D82D",
        "#82C91E",
        "#70B80F",
        "#5CA306",
        "#4B8D00",
      ] as const,
    },
    primaryColor: "blue",
    /** Match apps/frontend WCAG AA contrast for filled primary actions */
    primaryShade: { light: 8, dark: 7 } as const,
    dir: direction,
    cursorType: "pointer" as const,
    respectReducedMotion: true,
  };
}

/**
 * MantineProvider component
 * Wraps children with Mantine's ThemeProvider and applies design tokens
 */
export function MantineProvider({ children }: MantineProviderProps) {
  const { direction } = useDirection();
  useTheme(); // Ensure theme context is available

  const mantineTheme = createMantineTheme(direction);

  return <MantineCoreProvider theme={mantineTheme}>{children}</MantineCoreProvider>;
}

/**
 * Default export for convenience
 */
export default MantineProvider;
