import { z } from "zod";

export const costTierSchema = z.enum(["premium", "standard", "economy"]);
export type CostTier = z.infer<typeof costTierSchema>;

/** Cost tier enum values for use as runtime values */
export const COST_TIER = {
  PREMIUM: "premium" as const,
  STANDARD: "standard" as const,
  ECONOMY: "economy" as const,
} as const;

/**
 * Canonical AI provider type enumeration.
 * Includes all supported providers across config, agent-runtime, and API layers.
 */
export const AI_PROVIDER_TYPES = [
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
] as const;
export type AiProviderType = (typeof AI_PROVIDER_TYPES)[number];
export const aiProviderTypeSchema = z.enum(AI_PROVIDER_TYPES);

export const providerIdSchema = z
  .string()
  .min(1, "Provider ID is required")
  .max(64, "Provider ID must be less than 64 characters")
  .regex(/^[a-z0-9-]+$/, "Provider ID must contain only lowercase letters, numbers, and hyphens");

export const modelIdSchema = z
  .string()
  .min(1, "Model ID is required")
  .max(128, "Model ID must be less than 128 characters");

export interface AiModel {
  id: string;
  name: string;
  version: string;
  contextWindow: number;
  inputCostPer1k: number;
  outputCostPer1k: number;
  supportsStreaming: boolean;
  supportsFunctionCalling: boolean;
  isMultimodal: boolean;
  capabilities: string[];
}

export interface BusinessDomain {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  parentId?: string | null;
  childDomains?: BusinessDomain[];
  connectorIds?: string[];
  connectorCount?: number;
  providerConfig?: {
    providerId: string;
    modelId: string;
    costTier: string;
    scope?: ConfigScope;
    providerName?: string;
    enabled?: boolean;
  } | null;
  usesTenantDefault: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface BusinessDomainWithProviders extends BusinessDomain {
  providers?: Array<{
    id: string;
    providerId: string;
    modelId: string;
    costTier: CostTier;
    isEnabled: boolean;
    scope: ConfigScope;
    isOverride: boolean;
  }>;
}

export interface AiProviderDetail {
  id: string;
  name?: string;
  providerId: string;
  providerType?: string;
  type?: string;
  models?: Array<{
    id: string;
    name: string;
    version: string;
    contextWindow: number;
    inputCostPer1k: number;
    outputCostPer1k: number;
    supportsStreaming: boolean;
    supportsFunctionCalling: boolean;
    isMultimodal: boolean;
    capabilities: string[];
  }>;
  costTier: string;
  enabled?: boolean;
  isEnabled?: boolean;
  status: AiProviderStatus;
  healthStatus?: "healthy" | "unhealthy" | "unknown";
  scope: "tenant" | "domain" | "connector";
  isOverride?: boolean;
  isDefault?: boolean;
  description?: string;
  priority: number;
}

export interface AiProviderDetailItem {
  id: string;
  name: string;
  providerId: string;
  type: "llm" | "embedding" | "multimodal";
  models: AiModel[];
  costTier: CostTier;
  baseUrl?: string;
  isEnabled: boolean;
  healthStatus: "healthy" | "unhealthy" | "unknown";
  lastHealthCheck?: Date;
  scope: "tenant" | "domain" | "connector";
  parentId?: string;
  isOverride: boolean;
  priority: number;
  rateLimit?: number;
  timeout?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AiTemplate {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  version: string;
  type: "prompt" | "configuration" | "workflow";
  status: "active" | "draft" | "archived" | "published";
  providerType?: string;
  providerId: string | null;
  modelId: string | null;
  content: string;
  variables: Array<{
    name: string;
    type: string;
    required: boolean;
    defaultValue?: unknown;
    description?: string;
    pattern?: string;
  }> | null;
  isPublished?: boolean;
  domainScope?: string;
  parentVersionId?: string | null;
  createdById: string | null;
  createdAt: Date;
  updatedAt: Date;
  lastDeployedAt: Date | null;
}

export interface Connector {
  id: string;
  platform: "meta" | "ga4" | "gsc" | "gbp" | "tiktok";
  name: string;
  type?: string;
  status: "healthy" | "warning" | "error" | "inactive" | "syncing";
  domainId: string | null;
  lastSyncedAt?: string | Date | null;
}

export interface AiProviderConfig {
  providerId: string;
  modelId: string;
  costTier: CostTier;
  customPricing?: { inputCostPer1k: number; outputCostPer1k: number };
  credentialsId: string;
  scope: "tenant" | "domain" | "connector";
  isEnabled: boolean;
}

export interface ResolvedConfig {
  providerId: string;
  modelId: string;
  costTier: CostTier;
  pricing: { inputCostPer1k: number; outputCostPer1k: number };
  sourceLevel: "tenant" | "domain" | "connector";
  sourceId: string;
  isInherited: boolean;
  inheritanceChain: string[];
  cacheMetadata?: { fromCache: boolean; cacheLevel?: "L1" | "L2"; cacheKey?: string };
}

export const customPricingSchema = z.object({
  inputCostPer1k: z.number(),
  outputCostPer1k: z.number(),
});
export type CustomPricing = z.infer<typeof customPricingSchema>;

export const providerMetadataSchema = z.record(z.string(), z.unknown()).optional();
export type ProviderMetadata = z.infer<typeof providerMetadataSchema>;

export const providerCapabilitiesSchema = z.array(z.string()).optional();
export type ProviderCapabilities = z.infer<typeof providerCapabilitiesSchema>;

export const providerFailoverConfigSchema = z.object({
  primaryProviderId: z.string(),
  fallbackProviders: z.array(z.string()),
  isEnabled: z.boolean().default(true),
  providerTimeout: z.number().int().positive(),
  maxRetries: z.number().int().min(0).max(5),
});
export type ProviderFailoverConfig = z.infer<typeof providerFailoverConfigSchema>;

export const aiModelConfigSchema = z.object({
  id: modelIdSchema,
  name: z.string().min(1).max(128),
  version: z.string().min(1).max(32),
  contextWindow: z.number().positive(),
  inputCostPer1k: z.number().nonnegative(),
  outputCostPer1k: z.number().nonnegative(),
  supportsStreaming: z.boolean(),
  supportsFunctionCalling: z.boolean(),
  isMultimodal: z.boolean(),
  capabilities: z.array(z.string()).optional(),
});

export const createProviderConfigSchema = z.object({
  providerId: providerIdSchema,
  modelId: modelIdSchema,
  costTier: costTierSchema,
  customPricing: z
    .object({ inputCostPer1k: z.number().nonnegative(), outputCostPer1k: z.number().nonnegative() })
    .optional(),
  baseUrl: z.string().url().optional(),
  isEnabled: z.boolean().default(true),
  priority: z.number().int().min(0).default(0),
  rateLimit: z.number().int().positive().optional(),
  timeout: z.number().int().positive().optional(),
});

export const updateProviderConfigSchema = createProviderConfigSchema.partial();

export const providerCredentialsSchema = z.object({
  providerId: providerIdSchema,
  apiKey: z.string().min(1, "API key is required"),
  baseUrl: z.string().url().optional(),
  awsAccessKeyId: z.string().optional(),
  awsSecretAccessKey: z.string().optional(),
  awsRegion: z.string().length(2).optional(),
});

export const providerHealthSchema = z.object({
  providerId: providerIdSchema,
  status: z.enum(["healthy", "unhealthy", "unknown"]),
  latencyMs: z.number().nonnegative().optional(),
  lastChecked: z.iso.datetime(),
  errorMessage: z.string().optional(),
});

export const CONFIG_SCOPES = ["tenant", "domain", "connector"] as const;
export type ConfigScope = (typeof CONFIG_SCOPES)[number];

export const configScopeSchema = z.enum(CONFIG_SCOPES);

export const AI_PROVIDER_STATUSES = ["active", "inactive", "error"] as const;
export type AiProviderStatus = (typeof AI_PROVIDER_STATUSES)[number];

export const aiProviderStatusSchema = z.enum(AI_PROVIDER_STATUSES);

export const resolvedConfigSchema = z.object({
  providerId: providerIdSchema,
  modelId: modelIdSchema,
  costTier: costTierSchema,
  pricing: z.object({
    inputCostPer1k: z.number().nonnegative(),
    outputCostPer1k: z.number().nonnegative(),
  }),
  sourceLevel: configScopeSchema,
  sourceId: z.string().uuid(),
  isInherited: z.boolean(),
  inheritanceChain: z.array(z.string().uuid()),
  cacheMetadata: z
    .object({
      fromCache: z.boolean(),
      cacheLevel: z.enum(["L1", "L2"]).optional(),
      cacheKey: z.string().optional(),
    })
    .optional(),
});

export const resolveConfigInputSchema = z.object({
  scope: configScopeSchema,
  sourceId: z.string().uuid(),
  bypassCache: z.boolean().default(false),
});

export type CreateProviderConfig = z.infer<typeof createProviderConfigSchema>;
export type UpdateProviderConfig = z.infer<typeof updateProviderConfigSchema>;
export type ProviderCredentials = z.infer<typeof providerCredentialsSchema>;
export type ProviderHealth = z.infer<typeof providerHealthSchema>;
export type ResolvedConfigType = z.infer<typeof resolvedConfigSchema>;
export type ResolveConfigInput = z.infer<typeof resolveConfigInputSchema>;

// ============================================================================
// AI Provider Router Schemas (moved from apps/api/src/trpc/routers/ai-providers.ts)
// ============================================================================

export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});
export type PaginationInput = z.infer<typeof paginationSchema>;

export const listProvidersInputSchema = paginationSchema.extend({
  scope: configScopeSchema.optional(),
  parentId: z.string().uuid().optional(),
});
export type ListProvidersInput = z.infer<typeof listProvidersInputSchema>;

export const getProviderInputSchema = z.object({
  providerId: z.string().uuid(),
});
export type GetProviderInput = z.infer<typeof getProviderInputSchema>;

export const updateProviderInputSchema = z
  .object({
    providerId: z.string().uuid(),
    modelId: z.string(),
    costTier: costTierSchema,
    customPricing: customPricingSchema.optional(),
    baseUrl: z.string().url().optional(),
    isEnabled: z.boolean().optional(),
    priority: z.number().int().min(0).optional(),
    rateLimit: z.number().int().positive().optional(),
    timeout: z.number().int().positive().optional(),
  })
  .partial()
  .extend({
    providerId: z.string().uuid(),
  });
export type UpdateProviderInput = z.infer<typeof updateProviderInputSchema>;

export const toggleProviderInputSchema = z.object({
  providerId: z.string().uuid(),
  enabled: z.boolean(),
});
export type ToggleProviderInput = z.infer<typeof toggleProviderInputSchema>;

export const testConnectivityInputSchema = z.object({
  providerId: z.string().uuid(),
});
export type TestConnectivityInput = z.infer<typeof testConnectivityInputSchema>;

export const configureFailoverInputSchema = z.object({
  primaryProviderId: z.string().uuid(),
  fallbackProviders: z.array(z.string()),
  isEnabled: z.boolean().optional(),
  providerTimeout: z.number().int().positive().optional(),
  maxRetries: z.number().int().min(0).max(5).optional(),
});
export type ConfigureFailoverInput = z.infer<typeof configureFailoverInputSchema>;

export const getFailoverInputSchema = z.object({
  primaryProviderId: z.string().uuid(),
});
export type GetFailoverInput = z.infer<typeof getFailoverInputSchema>;

export const providerOutputSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  providerId: z.string(),
  providerName: z.string(),
  modelId: z.string(),
  modelName: z.string().nullable(),
  costTier: z.enum(["premium", "standard", "economy"]),
  customPricing: z
    .object({
      inputCostPer1k: z.number(),
      outputCostPer1k: z.number(),
    })
    .nullable(),
  scope: configScopeSchema,
  parentId: z.string().uuid().nullable(),
  isEnabled: z.boolean(),
  status: aiProviderStatusSchema,
  priority: z.number().int(),
  rateLimitOverride: z.number().int().nullable(),
  timeoutOverride: z.number().int().nullable(),
  baseUrl: z.string().nullable(),
  isOverride: z.boolean(),
  lastHealthCheckAt: z.date().nullable(),
  healthErrorMessage: z.string().nullable(),
  credentialsId: z.string().uuid().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type ProviderOutput = z.infer<typeof providerOutputSchema>;

export const failoverConfigOutputSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  primaryProviderId: z.string(),
  fallbackProviders: z.array(z.string()),
  isEnabled: z.boolean(),
  providerTimeout: z.number().int(),
  maxRetries: z.number().int(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type FailoverConfigOutput = z.infer<typeof failoverConfigOutputSchema>;

export const paginatedProvidersOutputSchema = z.object({
  items: z.array(providerOutputSchema),
  pagination: z.object({
    page: z.number().int(),
    limit: z.number().int(),
    totalItems: z.number().int(),
    totalPages: z.number().int(),
    hasMore: z.boolean(),
  }),
});
export type PaginatedProvidersOutput = z.infer<typeof paginatedProvidersOutputSchema>;
