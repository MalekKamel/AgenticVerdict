"use client";

import { DirectionProvider, MantineProvider } from "@agenticverdict/ui";
import { QueryClientProvider } from "@tanstack/react-query";
import { useLocale } from "@/i18n/react";
import { type ReactNode, useState } from "react";
import { Notifications } from "@mantine/notifications";

import { DesktopDeepLinkBridge } from "@/components/desktop/DesktopDeepLinkBridge";
import { TenantBrandedThemeProvider } from "@/components/providers/TenantBrandedThemeProvider";
import { WebVitalsReporter } from "@/components/observability/WebVitalsReporter";
import { getCspNonce } from "@web-csp-nonce";
import { trpc, trpcClient } from "@/lib/api/trpc-client";
import { getQueryClient } from "@/lib/query-client";
import { SessionProvider } from "@/features/auth/providers/SessionProvider";
import { TenantProvider } from "@/features/auth/providers/TenantProvider";

/**
 * App shell providers: design tokens, RTL/LTR, and Mantine theme from `@agenticverdict/ui`
 * (aligned with `design-system/*.pen` → shared UI package).
 */
export function Providers({ children }: { children: ReactNode }) {
  const locale = useLocale();
  const cspNonce = getCspNonce();
  const [queryClient] = useState(() => getQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <DesktopDeepLinkBridge />
        <WebVitalsReporter />
        <SessionProvider>
          <TenantProvider>
            <TenantBrandedThemeProvider>
              <DirectionProvider initialLocale={locale}>
                <MantineProvider cspNonce={cspNonce}>
                  <Notifications />
                  {children}
                </MantineProvider>
              </DirectionProvider>
            </TenantBrandedThemeProvider>
          </TenantProvider>
        </SessionProvider>
      </trpc.Provider>
    </QueryClientProvider>
  );
}
