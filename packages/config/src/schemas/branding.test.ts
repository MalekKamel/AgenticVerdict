import { describe, expect, it } from "vitest";

import {
  defaultDesignTokens,
  designTokensSchema,
  designTokensToCssVariables,
  exportDesignTokensJsonSchema,
  mantineThemeFromDesignTokens,
} from "./branding";

describe("designTokensSchema", () => {
  it("validates complete design tokens", () => {
    const parsed = designTokensSchema.parse(defaultDesignTokens);
    expect(parsed.colors.primary).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  it("rejects invalid hex colors", () => {
    const bad = {
      ...defaultDesignTokens,
      colors: { ...defaultDesignTokens.colors, primary: "#GG0000" },
    };
    expect(designTokensSchema.safeParse(bad).success).toBe(false);
  });
});

describe("designTokensToCssVariables", () => {
  it("generates CSS custom properties", () => {
    const vars = designTokensToCssVariables(defaultDesignTokens);
    expect(vars["--global-color-primary"]).toBe(defaultDesignTokens.colors.primary);
    expect(vars["--global-font-body"]).toBe(defaultDesignTokens.typography.families.body);
  });
});

describe("mantineThemeFromDesignTokens", () => {
  it("produces a Mantine-shaped theme object", () => {
    const theme = mantineThemeFromDesignTokens(defaultDesignTokens);
    expect(theme.primaryColor).toBe("brand");
    expect(theme.colors).toHaveProperty("brand");
    const brand = theme.colors as { brand: string[] };
    expect(Array.isArray(brand.brand)).toBe(true);
    expect(brand.brand.length).toBeGreaterThan(5);
  });

  it("embeds CSS variables under other.designTokensCssVariables", () => {
    const theme = mantineThemeFromDesignTokens(defaultDesignTokens);
    const other = theme.other as { designTokensCssVariables: Record<string, string> };
    expect(other.designTokensCssVariables["--global-color-primary"]).toBe(
      defaultDesignTokens.colors.primary,
    );
  });
});

describe("exportDesignTokensJsonSchema", () => {
  it("exports a JSON schema document", () => {
    const doc = exportDesignTokensJsonSchema();
    const defs = doc.definitions as Record<string, { properties?: unknown }> | undefined;
    expect(defs?.DesignTokens?.properties).toBeDefined();
  });
});
