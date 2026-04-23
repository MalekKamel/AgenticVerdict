/**
 * Provider exports
 * Context providers for theme, direction, and Mantine integration
 */

export * from "./ThemeProvider";
export * from "./DirectionProvider";
export * from "./MantineProvider";
export * from "./color-scheme-storage";

/**
 * UIProvider - Combined provider for convenience
 * Wraps all providers in the correct order
 */

import type { ReactNode } from "react";
import { ThemeProvider } from "./ThemeProvider";
import { DirectionProvider } from "./DirectionProvider";
import { MantineProvider } from "./MantineProvider";
import type { ThemeProviderProps } from "./ThemeProvider";
import type { DirectionProviderProps } from "./DirectionProvider";

export interface UIProviderProps {
  children: ReactNode;
  theme?: ThemeProviderProps;
  direction?: DirectionProviderProps;
}

export function UIProvider({ children, theme, direction }: UIProviderProps) {
  return (
    <ThemeProvider {...theme}>
      <DirectionProvider {...direction}>
        <MantineProvider>{children}</MantineProvider>
      </DirectionProvider>
    </ThemeProvider>
  );
}
