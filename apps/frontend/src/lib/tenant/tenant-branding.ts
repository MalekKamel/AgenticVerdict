/**
 * Fallback brand mapping when `tenant.getBranding` has no `TenantConfig.ui.brand` (see `TenantBrandedThemeProvider`).
 */

import { defaultBrandTheme, masafhTheme, type BrandTokens } from "@agenticverdict/ui";

export const MASAFH_REFERENCE_TENANT_ID = "11111111-1111-4111-8111-111111111111";

export function resolveBrandTokensForTenantId(tenantId: string | undefined): BrandTokens {
  if (tenantId === MASAFH_REFERENCE_TENANT_ID) {
    return masafhTheme;
  }
  return defaultBrandTheme;
}
