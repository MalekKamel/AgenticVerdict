"use client";

import { DirectionProvider, MantineProvider } from "@mantine/core";
import { useLocale } from "next-intl";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  const locale = useLocale();
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <DirectionProvider initialDirection={dir}>
      <MantineProvider defaultColorScheme="auto">{children}</MantineProvider>
    </DirectionProvider>
  );
}
