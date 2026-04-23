"use client";

import {
  ThemeProvider,
  brandTokensSchema,
  defaultBrandTheme,
  type BrandTokens,
} from "@agenticverdict/ui";
import { useMemo, type ReactNode } from "react";

import { trpc } from "@/lib/api/trpc-client";
import { resolveBrandTokensForTenantId } from "@/lib/tenant/tenant-branding";
import { useTenant } from "@/providers/TenantProvider";

/**
 * Applies TenantConfig `ui.brand` when available via `tenant.getBranding`, otherwise packaged
 * reference-tenant tokens from {@link resolveBrandTokensForTenantId}.
 */
export function TenantBrandedThemeProvider({ children }: { children: ReactNode }) {
  const { tenantId } = useTenant();
  const { data } = trpc.tenant.getBranding.useQuery(
    { tenantId: tenantId! },
    { enabled: Boolean(tenantId) },
  );

  const brand = useMemo((): BrandTokens => {
    if (!tenantId) {
      return defaultBrandTheme;
    }
    if (data?.brand) {
      return brandTokensSchema.parse(data.brand);
    }
    return resolveBrandTokensForTenantId(tenantId);
  }, [data?.brand, tenantId]);

  const themeKey = `${tenantId ?? "none"}-${data?.brand ? "cfg" : "fallback"}`;

  return (
    <ThemeProvider key={themeKey} initialTheme={brand}>
      {children}
    </ThemeProvider>
  );
}
