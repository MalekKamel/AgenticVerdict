import { z } from "zod";

/**
 * Tenant AI Configuration Schema
 *
 * Provides per-tenant AI provider preferences, budgets, and failover strategies.
 * This schema is used for:
 * - JWT extraction and validation
 * - AsyncLocalStorage context propagation
 * - API request validation
 * - Database storage (JSON column)
 */

// Provider ID - must match registered providers in ProviderRegistry
export const providerIdSchema = z.string().min(1).max(64);

// Model configuration per provider
export const providerModelConfigSchema = z.object({
  providerId: providerIdSchema,
  modelId: z.string().min(1).max(128),
  displayName: z.string().max(128).optional(),
});

// Role-based model configuration
export const roleBasedModelConfigSchema = z.object({
  analysis: providerModelConfigSchema.optional(),
  insights: providerModelConfigSchema.optional(),
  reports: providerModelConfigSchema.optional(),
  custom: z.record(providerIdSchema, providerModelConfigSchema).optional(),
});

// Budget configuration
export const budgetConfigSchema = z.object({
  // Monthly budget limit in USD
  monthlyLimit: z.number().positive().optional(),
  // Alert threshold (percentage of monthly limit, 0-100)
  alertThreshold: z.number().min(0).max(100).default(80),
  // Hard limit enforcement (blocks requests when reached)
  hardLimit: z.boolean().default(false),
  // Alert recipients (emails)
  alertRecipients: z.array(z.string().email()).optional(),
});

// Failover configuration
export const failoverConfigSchema = z.object({
  // Ordered list of fallback provider IDs (excluding primary)
  fallbackProviders: z.array(providerIdSchema).min(0).max(5).default([]),
  // Enable automatic failover
  enabled: z.boolean().default(true),
  // Timeout per provider attempt in milliseconds
  providerTimeout: z.number().positive().max(30000).default(10000),
  // Maximum retry attempts per provider
  maxRetriesPerProvider: z.number().min(0).max(5).default(1),
});

// Circuit breaker configuration
export const circuitBreakerConfigSchema = z.object({
  // Enable circuit breaker
  enabled: z.boolean().default(true),
  // Number of failures before opening circuit
  failureThreshold: z.number().positive().default(5),
  // Time window for failure counting (seconds)
  failureWindow: z.number().positive().default(30),
  // Time before attempting recovery (seconds)
  recoveryTimeout: z.number().positive().default(60),
  // Number of successful requests in half-open state to close circuit
  halfOpenMaxRequests: z.number().positive().default(3),
});

// Main Tenant AI Configuration schema
export const tenantAIConfigSchema = z.object({
  // Primary provider configuration
  primaryProvider: providerIdSchema.default("anthropic"),

  // Default model (fallback if role-based not specified)
  defaultModel: providerModelConfigSchema.optional(),

  // Role-specific model configurations
  roleBasedModels: roleBasedModelConfigSchema.optional(),

  // Budget controls
  budget: budgetConfigSchema.optional(),

  // Failover strategy
  failover: failoverConfigSchema.optional(),

  // Circuit breaker settings
  circuitBreaker: circuitBreakerConfigSchema.optional(),

  // Custom provider-specific settings
  providerSettings: z.record(providerIdSchema, z.record(z.string(), z.unknown())).optional(),

  // Metadata
  updatedAt: z.string().datetime().optional(),
  updatedBy: z.string().uuid().optional(),
});

// Type exports
export type TenantAIConfig = z.infer<typeof tenantAIConfigSchema>;
export type ProviderModelConfig = z.infer<typeof providerModelConfigSchema>;
export type RoleBasedModelConfig = z.infer<typeof roleBasedModelConfigSchema>;
export type BudgetConfig = z.infer<typeof budgetConfigSchema>;
export type FailoverConfig = z.infer<typeof failoverConfigSchema>;
export type CircuitBreakerConfig = z.infer<typeof circuitBreakerConfigSchema>;

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
  errors?: z.ZodError;
} {
  const result = tenantAIConfigSchema.safeParse(config);

  if (!result.success) {
    // Return default config with validation errors
    return {
      config: defaultTenantAIConfig,
      errors: result.error,
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
    // This should not happen since we're merging with valid defaults
    // But if it does, return defaults
    return defaultTenantAIConfig;
  }

  return result.data;
}
