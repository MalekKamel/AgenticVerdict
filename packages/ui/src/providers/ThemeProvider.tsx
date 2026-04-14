/**
 * ThemeProvider - Applies tenant-specific branding and design tokens
 * Manages the three-tier token system: global → brand → component
 */

"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import type { BrandTokens } from "../tokens/types";
import { defaultBrandTheme, getBrandCSSVariables, brandTokensSchema } from "../tokens/brand";

/**
 * Theme context interface
 */
interface ThemeContextValue {
  theme: BrandTokens;
  setTheme: (theme: BrandTokens) => void;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

/**
 * Theme provider props
 */
export interface ThemeProviderProps {
  children: React.ReactNode;
  /** Initial theme - if not provided, uses default */
  initialTheme?: BrandTokens;
  /** Callback when theme changes - useful for persisting tenant theme */
  onThemeChange?: (theme: BrandTokens) => void;
}

/**
 * ThemeProvider component
 * Applies tenant-specific branding via CSS custom properties
 */
export function ThemeProvider({ children, initialTheme, onThemeChange }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<BrandTokens>(initialTheme || defaultBrandTheme);
  const [isLoading, setIsLoading] = useState(true);

  // Apply theme CSS variables to document
  useEffect(() => {
    const root = document.documentElement;
    const variables = getBrandCSSVariables(theme);

    Object.entries(variables).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

    setIsLoading(false);
  }, [theme]);

  /**
   * Set a new theme
   * Validates the theme before applying
   */
  const setTheme = (newTheme: BrandTokens) => {
    try {
      // Validate theme structure
      const validatedTheme = brandTokensSchema.parse(newTheme);
      setThemeState(validatedTheme);
      onThemeChange?.(validatedTheme);
    } catch (error) {
      console.error("Invalid theme configuration:", error);
      // Fallback to default theme on validation error
      setThemeState(defaultBrandTheme);
    }
  };

  const contextValue: ThemeContextValue = {
    theme,
    setTheme,
    isLoading,
  };

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>;
}

/**
 * useTheme hook
 * Access theme context in components
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}

/**
 * Hook to load tenant theme from API
 * Useful for fetching theme based on authenticated user
 */
export function useTenantTheme(tenantId?: string) {
  const [theme, setTheme] = useState<BrandTokens>(defaultBrandTheme);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!tenantId) {
      setTheme(defaultBrandTheme);
      return;
    }

    const fetchTheme = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // TODO: Implement actual API call
        // const response = await fetch(`/api/tenants/${tenantId}/theme`);
        // const themeData = await response.json();
        // setTheme(brandTokensSchema.parse(themeData));

        // For now, use default theme
        setTheme(defaultBrandTheme);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to load theme"));
        setTheme(defaultBrandTheme); // Fallback to default
      } finally {
        setIsLoading(false);
      }
    };

    fetchTheme();
  }, [tenantId]);

  return { theme, setTheme, isLoading, error };
}
