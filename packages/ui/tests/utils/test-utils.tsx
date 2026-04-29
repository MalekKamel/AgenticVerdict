/**
 * Test utilities for @agenticverdict/ui
 */

import React, { ReactElement } from "react";
import { render, RenderOptions } from "@testing-library/react";
import { vi } from "vitest";
import { ThemeProvider } from "../src/providers/ThemeProvider";
import { DirectionProvider } from "../src/providers/DirectionProvider";
import { MantineProvider } from "../src/providers/MantineProvider";
import { defaultBrandTheme } from "../src/tokens/brand";

/**
 * Test providers wrapper
 */
interface TestProvidersProps {
  children: React.ReactNode;
  theme?: typeof defaultBrandTheme;
  direction?: "ltr" | "rtl";
}

function TestProviders({
  children,
  theme = defaultBrandTheme,
  direction = "ltr",
}: TestProvidersProps) {
  return (
    <ThemeProvider initialTheme={theme}>
      <DirectionProvider initialDirection={direction}>
        <MantineProvider>{children}</MantineProvider>
      </DirectionProvider>
    </ThemeProvider>
  );
}

/**
 * Custom render function with providers
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper"> & {
    theme?: typeof defaultBrandTheme;
    direction?: "ltr" | "rtl";
  },
) {
  const { theme, direction, ...renderOptions } = options || {};

  return {
    ...render(ui, {
      wrapper: ({ children }) => (
        <TestProviders theme={theme} direction={direction}>
          {children}
        </TestProviders>
      ),
      ...renderOptions,
    }),
  };
}

/**
 * Mock theme for testing
 */
export const mockTheme = defaultBrandTheme;

/**
 * Mock RTL context for testing
 */
export const mockRTLContext = {
  direction: "rtl" as const,
  setDirection: vi.fn(),
  setLocale: vi.fn(),
  isRTL: true,
};

/**
 * Get accessibility tree for testing
 * Useful for verifying ARIA attributes and roles
 */
export function getA11yTree(container: HTMLElement) {
  return {
    getRoles: () => {
      const elements = container.querySelectorAll("[role]");
      return Array.from(elements).map((el) => ({
        role: el.getAttribute("role"),
        element: el,
      }));
    },
    getLabels: () => {
      const elements = container.querySelectorAll("label, [aria-label], [aria-labelledby]");
      return Array.from(elements).map((el) => ({
        text: el.textContent,
        element: el,
      }));
    },
  };
}
