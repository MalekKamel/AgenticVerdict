import { tenantConfigSchema, type TenantConfig } from "@agenticverdict/config";

import { TEST_TENANT_ALPHA } from "./tenant-ids";

function defaultConfig(): TenantConfig {
  return tenantConfigSchema.parse({
    tenantId: TEST_TENANT_ALPHA,
    tenantName: "Test Tenant",
    localization: {
      language: "en",
      region: "SA",
      timezone: "Asia/Riyadh",
      currency: "SAR",
    },
    marketing: {
      channels: [{ platform: "ga4", enabled: false }],
    },
    ai: {
      primaryProvider: "anthropic",
    },
    features: {
      enableInsights: false,
      enableVerdict: false,
    },
  });
}

/**
 * Builds a Zod-valid {@link TenantConfig} for tests. Nested objects are merged shallowly
 * where noted so callers can override `localization`, `marketing`, etc. partially.
 */
export function createTestTenantConfig(overrides: Partial<TenantConfig> = {}): TenantConfig {
  const base = defaultConfig();
  return tenantConfigSchema.parse({
    ...base,
    ...overrides,
    localization: { ...base.localization, ...overrides.localization },
    marketing: {
      ...base.marketing,
      ...overrides.marketing,
      channels: overrides.marketing?.channels ?? base.marketing.channels,
    },
    ai: { ...base.ai, ...overrides.ai },
    features: { ...base.features, ...overrides.features },
    ui: overrides.ui !== undefined ? { ...base.ui, ...overrides.ui } : base.ui,
  });
}
