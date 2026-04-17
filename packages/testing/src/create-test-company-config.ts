import { companyConfigSchema, type CompanyConfig } from "@agenticverdict/config";

import { TEST_TENANT_ALPHA } from "./tenant-ids";

function defaultConfig(): CompanyConfig {
  return companyConfigSchema.parse({
    companyId: TEST_TENANT_ALPHA,
    companyName: "Test Company",
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
      primaryModel: "claude-3-5-sonnet-20241022",
      provider: "anthropic",
    },
    features: {
      enableInsights: false,
      enableVerdict: false,
    },
  });
}

/**
 * Builds a Zod-valid {@link CompanyConfig} for tests. Nested objects are merged shallowly
 * where noted so callers can override `localization`, `marketing`, etc. partially.
 */
export function createTestCompanyConfig(overrides: Partial<CompanyConfig> = {}): CompanyConfig {
  const base = defaultConfig();
  return companyConfigSchema.parse({
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
