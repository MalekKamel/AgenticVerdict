"use client";

import { DirectionProvider, MantineProvider, ThemeProvider } from "@agenticverdict/ui";
import { QueryClientProvider } from "@tanstack/react-query";
import { useLocale } from "@/i18n/react";
import { type ReactNode, useState } from "react";

import { getQueryClient } from "@/lib/query-client";

/**
 * App shell providers: design tokens, RTL/LTR, and Mantine theme from `@agenticverdict/ui`
 * (aligned with `design-system/*.pen` → shared UI package).
 */
export function Providers({ children }: { children: ReactNode }) {
  const locale = useLocale();
  const [queryClient] = useState(() => getQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <DirectionProvider initialLocale={locale}>
          <MantineProvider>{children}</MantineProvider>
        </DirectionProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
