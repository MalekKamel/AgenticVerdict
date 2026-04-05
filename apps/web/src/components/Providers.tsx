"use client";

import { createTheme, DirectionProvider, MantineProvider } from "@mantine/core";
import { useLocale } from "next-intl";
import type { ReactNode } from "react";

const theme = createTheme({
  /** Darker primary for WCAG AA contrast on filled buttons (Phase 03 a11y hardening). */
  primaryShade: { light: 8, dark: 7 },
});

export function Providers({ children }: { children: ReactNode }) {
  const locale = useLocale();
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <DirectionProvider initialDirection={dir}>
      <MantineProvider theme={theme} defaultColorScheme="auto">
        {children}
      </MantineProvider>
    </DirectionProvider>
  );
}
