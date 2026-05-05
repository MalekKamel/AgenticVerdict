import { z } from "zod";

/**
 * Provider configuration schema (Task 3.43)
 * Zod schema for validating provider configurations per tenant
 */

/** Provider type enumeration */
export const ProviderTypeSchema = z.enum([
  "openai",
  "anthropic",
  "google",
  "bedrock",
  "deepseek",
  "groq",
  "mistral",
  "moonshot",
  "togetherai",
  "openai-compatible",
]);

export type ProviderType = z.infer<typeof ProviderTypeSchema>;

/** Credential configuration for a provider */
export const ProviderCredentialSchema = z.object({
  /** Encrypted API key reference (stored in secrets manager) */
  apiKeySecretRef: z.string().min(1, "API key secret reference is required"),
  /** Optional AWS access key for Bedrock */
  awsAccessKeyId: z.string().optional(),
  /** Optional AWS secret key for Bedrock */
  awsSecretAccessKey: z.string().optional(),
  /** Optional AWS region for Bedrock */
  awsRegion: z.string().optional(),
  /** Optional custom base URL for OpenAI-compatible providers */
  baseUrl: z.string().url().optional(),
});

export type ProviderCredential = z.infer<typeof ProviderCredentialSchema>;

/** Provider-specific configuration */
export const ProviderConfigSchema = z.object({
  /** Provider identifier */
  providerId: ProviderTypeSchema,
  /** Display name for UI */
  displayName: z.string().min(1),
  /** Whether this provider is enabled for the tenant */
  enabled: z.boolean().default(true),
  /** Priority order for failover (lower = higher priority) */
  priority: z.number().int().min(0).default(0),
  /** Credential configuration */
  credentials: ProviderCredentialSchema,
  /** Optional model overrides */
  modelOverrides: z.record(z.string()).optional(),
  /** Optional rate limit overrides (requests per minute) */
  rateLimitOverride: z.number().int().min(1).optional(),
  /** Optional timeout override (milliseconds) */
  timeoutOverride: z.number().int().min(1000).optional(),
  /** Failover chain - ordered list of backup provider IDs */
  failoverChain: z.array(ProviderTypeSchema).optional(),
});

export type ProviderConfig = z.infer<typeof ProviderConfigSchema>;

/** Tenant-level provider configuration */
export const TenantProviderConfigSchema = z.object({
  /** Tenant ID */
  tenantId: z.string().uuid(),
  /** Map of provider configurations */
  providers: z.record(ProviderConfigSchema),
  /** Default provider for this tenant */
  defaultProvider: ProviderTypeSchema,
  /** Fallback provider if default fails */
  fallbackProvider: ProviderTypeSchema.optional(),
  /** Whether to enable automatic failover */
  enableAutoFailover: z.boolean().default(true),
  /** Maximum retry attempts per provider */
  maxRetries: z.number().int().min(0).default(2),
  /** Budget limit per month (in USD cents) */
  monthlyBudgetCents: z.number().int().min(0).optional(),
  /** Whether to enable cost optimization recommendations */
  enableCostOptimization: z.boolean().default(false),
});

export type TenantProviderConfig = z.infer<typeof TenantProviderConfigSchema>;

/** Agency-level aggregation for multi-tenant management */
export const AgencyProviderConfigSchema = z.object({
  /** Agency ID */
  agencyId: z.string().uuid(),
  /** Map of tenant IDs to their provider configs */
  tenantConfigs: z.record(TenantProviderConfigSchema),
  /** Agency-level budget limit (in USD cents) */
  agencyMonthlyBudgetCents: z.number().int().min(0).optional(),
  /** Shared credentials pool for cost optimization */
  sharedCredentialPools: z.record(z.array(z.string())).optional(),
});

export type AgencyProviderConfig = z.infer<typeof AgencyProviderConfigSchema>;

/** Validation utilities */
export const ProviderConfigValidation = {
  /** Validate a single provider config */
  validateProvider: (config: unknown): ProviderConfig => {
    return ProviderConfigSchema.parse(config);
  },

  /** Validate tenant provider config */
  validateTenantConfig: (config: unknown): TenantProviderConfig => {
    return TenantProviderConfigSchema.parse(config);
  },

  /** Validate agency provider config */
  validateAgencyConfig: (config: unknown): AgencyProviderConfig => {
    return AgencyProviderConfigSchema.parse(config);
  },

  /** Safe parse with error handling */
  safeParseTenantConfig: (config: unknown) => {
    return TenantProviderConfigSchema.safeParse(config);
  },
};

/** Default configuration templates (Task 3.45) */
export const DefaultProviderTemplates: Record<ProviderType, Omit<ProviderConfig, "credentials">> = {
  openai: {
    providerId: "openai",
    displayName: "OpenAI",
    enabled: true,
    priority: 0,
    modelOverrides: {},
    rateLimitOverride: undefined,
    timeoutOverride: undefined,
    failoverChain: ["anthropic"],
  },
  anthropic: {
    providerId: "anthropic",
    displayName: "Anthropic",
    enabled: true,
    priority: 1,
    modelOverrides: {},
    rateLimitOverride: undefined,
    timeoutOverride: undefined,
    failoverChain: ["openai"],
  },
  google: {
    providerId: "google",
    displayName: "Google Generative AI",
    enabled: true,
    priority: 2,
    modelOverrides: {},
    rateLimitOverride: undefined,
    timeoutOverride: undefined,
    failoverChain: ["anthropic", "openai"],
  },
  bedrock: {
    providerId: "bedrock",
    displayName: "AWS Bedrock",
    enabled: true,
    priority: 3,
    modelOverrides: {},
    rateLimitOverride: undefined,
    timeoutOverride: undefined,
    failoverChain: ["anthropic"],
  },
  deepseek: {
    providerId: "deepseek",
    displayName: "DeepSeek",
    enabled: true,
    priority: 4,
    modelOverrides: {},
    rateLimitOverride: undefined,
    timeoutOverride: undefined,
    failoverChain: ["openai"],
  },
  groq: {
    providerId: "groq",
    displayName: "Groq",
    enabled: true,
    priority: 5,
    modelOverrides: {},
    rateLimitOverride: undefined,
    timeoutOverride: undefined,
    failoverChain: ["openai"],
  },
  mistral: {
    providerId: "mistral",
    displayName: "Mistral AI",
    enabled: true,
    priority: 6,
    modelOverrides: {},
    rateLimitOverride: undefined,
    timeoutOverride: undefined,
    failoverChain: ["anthropic"],
  },
  moonshot: {
    providerId: "moonshot",
    displayName: "Moonshot",
    enabled: true,
    priority: 7,
    modelOverrides: {},
    rateLimitOverride: undefined,
    timeoutOverride: undefined,
    failoverChain: ["openai"],
  },
  togetherai: {
    providerId: "togetherai",
    displayName: "Together AI",
    enabled: true,
    priority: 8,
    modelOverrides: {},
    rateLimitOverride: undefined,
    timeoutOverride: undefined,
    failoverChain: ["openai"],
  },
  "openai-compatible": {
    providerId: "openai-compatible",
    displayName: "OpenAI Compatible",
    enabled: true,
    priority: 9,
    modelOverrides: {},
    rateLimitOverride: undefined,
    timeoutOverride: undefined,
    failoverChain: [],
  },
};

/** Default tenant configuration template */
export const DefaultTenantConfigTemplate: Omit<TenantProviderConfig, "tenantId" | "providers"> = {
  defaultProvider: "openai",
  fallbackProvider: "anthropic",
  enableAutoFailover: true,
  maxRetries: 2,
  monthlyBudgetCents: undefined,
  enableCostOptimization: false,
};
