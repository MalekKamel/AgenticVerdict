/**
 * Tenant AI Configuration - Runtime Functions
 *
 * Schemas are imported from @agenticverdict/types (single source of truth).
 * This file retains only runtime logic: defaults, validation, and merging.
 */

import { tenantAIConfigSchema, type TenantAIConfig } from "@agenticverdict/types";

export { tenantAIConfigSchema, type TenantAIConfig };

/**
 * Default tenant AI configuration
 * Used when tenant has no explicit configuration
 */
export const defaultTenantAIConfig: TenantAIConfig = {
  primaryProvider: "anthropic",
  defaultModel: {
    providerId: "anthropic",
    modelId: "claude-3-5-sonnet-20241022",
  },
  budget: {
    alertThreshold: 80,
    hardLimit: false,
  },
  failover: {
    fallbackProviders: ["openai", "google"],
    enabled: true,
    providerTimeout: 10000,
    maxRetriesPerProvider: 1,
  },
  circuitBreaker: {
    enabled: true,
    failureThreshold: 5,
    failureWindow: 30,
    recoveryTimeout: 60,
    halfOpenMaxRequests: 3,
  },
};

/**
 * Validate and normalize tenant AI configuration
 * Applies defaults and validates against schema
 */
export function validateTenantAIConfig(config: unknown): {
  config: TenantAIConfig;
  errors?: Record<string, unknown>;
} {
  const result = tenantAIConfigSchema.safeParse(config);

  if (!result.success) {
    return {
      config: defaultTenantAIConfig,
      errors: result.error as unknown as Record<string, unknown>,
    };
  }

  return { config: result.data };
}

/**
 * Merge partial config with defaults
 * Used for updating tenant configuration
 */
export function mergeTenantAIConfig(partial: Partial<TenantAIConfig>): TenantAIConfig {
  const result = tenantAIConfigSchema.safeParse({
    ...defaultTenantAIConfig,
    ...partial,
  });

  if (!result.success) {
    return defaultTenantAIConfig;
  }

  return result.data;
}
