/**
 * AI Provider Zod Schemas
 *
 * Validation schemas for all AI provider operations including:
 * - Provider configuration
 * - Business domain management
 * - Template operations
 * - Usage tracking
 * - Budget alerts
 */

import { z } from "zod";
import { CostTier } from "../types/ai-models";

// ============================================================================
// Provider Configuration Schemas
// ============================================================================

/**
 * Provider ID validation
 */
export const providerIdSchema = z
  .string()
  .min(1, "Provider ID is required")
  .max(64, "Provider ID must be less than 64 characters")
  .regex(/^[a-z0-9-]+$/, "Provider ID must contain only lowercase letters, numbers, and hyphens");

/**
 * Model ID validation
 */
export const modelIdSchema = z
  .string()
  .min(1, "Model ID is required")
  .max(128, "Model ID must be less than 128 characters");

/**
 * Cost tier enum schema
 */
export const costTierSchema = z.nativeEnum(CostTier);

/**
 * AI Model configuration
 */
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

/**
 * Create provider configuration input
 */
export const createProviderConfigSchema = z.object({
  providerId: providerIdSchema,
  modelId: modelIdSchema,
  costTier: costTierSchema,
  customPricing: z
    .object({
      inputCostPer1k: z.number().nonnegative(),
      outputCostPer1k: z.number().nonnegative(),
    })
    .optional(),
  baseUrl: z.string().url().optional(),
  isEnabled: z.boolean().default(true),
  priority: z.number().int().min(0).default(0),
  rateLimit: z.number().int().positive().optional(),
  timeout: z.number().int().positive().optional(),
});

/**
 * Update provider configuration input
 */
export const updateProviderConfigSchema = createProviderConfigSchema.partial();

/**
 * Provider credentials input
 */
export const providerCredentialsSchema = z.object({
  providerId: providerIdSchema,
  apiKey: z.string().min(1, "API key is required"),
  baseUrl: z.string().url().optional(),
  // AWS-specific fields
  awsAccessKeyId: z.string().optional(),
  awsSecretAccessKey: z.string().optional(),
  awsRegion: z.string().length(2).optional(),
});

/**
 * Provider health check response
 */
export const providerHealthSchema = z.object({
  providerId: providerIdSchema,
  status: z.enum(["healthy", "unhealthy", "unknown"]),
  latencyMs: z.number().nonnegative().optional(),
  lastChecked: z.string().datetime(),
  errorMessage: z.string().optional(),
});

// ============================================================================
// Business Domain Schemas
// ============================================================================

/**
 * Business domain ID
 */
export const domainIdSchema = z
  .string()
  .min(1, "Domain ID is required")
  .uuid("Invalid UUID format");

/**
 * Create business domain input
 */
export const createDomainSchema = z.object({
  name: z
    .string()
    .min(1, "Domain name is required")
    .max(128, "Domain name must be less than 128 characters")
    .regex(
      /^[a-zA-Z0-9\s-_]+$/,
      "Domain name can only contain letters, numbers, spaces, hyphens, and underscores",
    ),
  description: z.string().max(512).optional(),
  parentId: domainIdSchema.optional(),
  order: z.number().int().min(0).default(0),
});

/**
 * Update business domain input
 */
export const updateDomainSchema = createDomainSchema.partial();

/**
 * Assign connector to domain input
 */
export const assignConnectorToDomainSchema = z.object({
  domainId: domainIdSchema,
  connectorId: z.string().uuid("Invalid connector UUID"),
});

/**
 * Domain hierarchy node interface (forward declaration for recursive schema)
 */
export interface DomainHierarchyNode {
  id: string;
  name: string;
  description?: string;
  parentId?: string | null;
  connectorIds: string[];
  childDomains?: DomainHierarchyNode[];
  usesTenantDefault: boolean;
  providerConfig?: {
    providerId: string;
    modelId: string;
    costTier: CostTier;
  };
}

/**
 * Domain hierarchy node
 */
export const domainHierarchyNodeSchema: z.ZodType<DomainHierarchyNode> = z.lazy(() =>
  z.object({
    id: domainIdSchema,
    name: z.string(),
    description: z.string().optional(),
    parentId: domainIdSchema.optional().nullable(),
    connectorIds: z.array(z.string().uuid()),
    childDomains: z.array(domainHierarchyNodeSchema).optional(),
    usesTenantDefault: z.boolean(),
    providerConfig: z
      .object({
        providerId: providerIdSchema,
        modelId: modelIdSchema,
        costTier: costTierSchema,
      })
      .optional(),
  }),
);

// ============================================================================
// AI Template Schemas
// ============================================================================

/**
 * Template type enum
 */
export const templateTypeSchema = z.enum(["prompt", "configuration", "workflow"]);

/**
 * Template variable definition
 */
export const templateVariableSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, "Invalid variable name format"),
  type: z.enum(["string", "number", "boolean", "object", "array"]),
  required: z.boolean().default(false),
  defaultValue: z.unknown().optional(),
  description: z.string().max(256).optional(),
  pattern: z.string().optional(),
});

/**
 * Create AI template input
 */
export const createTemplateSchema = z.object({
  name: z.string().min(1).max(128),
  description: z.string().max(512).optional(),
  type: templateTypeSchema,
  content: z.string().min(1),
  variables: z.array(templateVariableSchema).default([]),
  providerId: providerIdSchema.optional(),
  modelId: modelIdSchema.optional(),
  domainId: domainIdSchema.optional(),
});

/**
 * Update AI template input
 */
export const updateTemplateSchema = createTemplateSchema.partial();

/**
 * Deploy template input
 */
export const deployTemplateSchema = z.object({
  templateId: z.string().uuid(),
  targetScope: z.enum(["tenant", "domain", "connector"]),
  targetId: z.string().uuid().optional(),
  variables: z.record(z.string(), z.unknown()).optional(),
});

// ============================================================================
// Usage Tracking Schemas
// ============================================================================

/**
 * Usage report input
 */
export const usageReportSchema = z.object({
  providerId: providerIdSchema,
  modelId: modelIdSchema,
  domainId: domainIdSchema.optional(),
  connectorId: z.string().uuid().optional(),
  promptTokens: z.number().int().nonnegative(),
  completionTokens: z.number().int().nonnegative(),
  totalTokens: z.number().int().nonnegative(),
  costCents: z.number().int().nonnegative(),
  requestId: z.string().uuid(),
  latencyMs: z.number().int().nonnegative(),
  success: z.boolean(),
  errorCode: z.string().max(64).optional(),
  errorMessage: z.string().max(512).optional(),
  wasFailover: z.boolean().default(false),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Usage query filters
 */
export const usageQueryFiltersSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  providerId: providerIdSchema.optional(),
  domainId: domainIdSchema.optional(),
  modelId: modelIdSchema.optional(),
  timeGranularity: z.enum(["hourly", "daily", "weekly", "monthly"]).default("daily"),
});

/**
 * Usage summary response
 */
export const usageSummarySchema = z.object({
  tenantId: z.string().uuid(),
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
  totalPromptTokens: z.number().int().nonnegative(),
  totalCompletionTokens: z.number().int().nonnegative(),
  totalTokens: z.number().int().nonnegative(),
  totalCostCents: z.number().int().nonnegative(),
  totalRequests: z.number().int().nonnegative(),
  successfulRequests: z.number().int().nonnegative(),
  failedRequests: z.number().int().nonnegative(),
  avgLatencyMs: z.number().nonnegative(),
  byProvider: z.array(
    z.object({
      providerId: providerIdSchema,
      providerName: z.string(),
      totalTokens: z.number().int().nonnegative(),
      totalCostCents: z.number().int().nonnegative(),
      requestCount: z.number().int().nonnegative(),
    }),
  ),
  byDomain: z.array(
    z.object({
      domainId: domainIdSchema,
      domainName: z.string(),
      totalTokens: z.number().int().nonnegative(),
      totalCostCents: z.number().int().nonnegative(),
      requestCount: z.number().int().nonnegative(),
    }),
  ),
  byModel: z.array(
    z.object({
      modelId: modelIdSchema,
      modelName: z.string(),
      totalTokens: z.number().int().nonnegative(),
      totalCostCents: z.number().int().nonnegative(),
      requestCount: z.number().int().nonnegative(),
    }),
  ),
});

// ============================================================================
// Budget Alert Schemas
// ============================================================================

/**
 * Alert type enum
 */
export const alertTypeSchema = z.enum(["threshold", "percentage", "rate"]);

/**
 * Alert threshold type
 */
export const alertThresholdTypeSchema = z.enum(["cost", "tokens", "requests"]);

/**
 * Alert time window
 */
export const alertTimeWindowSchema = z.enum(["hourly", "daily", "weekly", "monthly"]);

/**
 * Alert status
 */
export const alertStatusSchema = z.enum(["active", "paused", "triggered"]);

/**
 * Notification type
 */
export const notificationTypeSchema = z.enum(["email", "webhook", "slack"]);

/**
 * Notification channel
 */
export const notificationChannelSchema = z.object({
  id: z.string().uuid().optional(),
  type: notificationTypeSchema,
  target: z.string(),
  isEnabled: z.boolean().default(true),
});

/**
 * Create budget alert input
 */
export const createBudgetAlertSchema = z.object({
  name: z.string().min(1).max(128),
  description: z.string().max(512).optional(),
  type: alertTypeSchema,
  threshold: z.number().positive(),
  thresholdType: alertThresholdTypeSchema,
  timeWindow: alertTimeWindowSchema,
  notifications: z.array(notificationChannelSchema).min(1),
});

/**
 * Update budget alert input
 */
export const updateBudgetAlertSchema = createBudgetAlertSchema.partial();

/**
 * Alert trigger input (internal use)
 */
export const alertTriggerSchema = z.object({
  alertId: z.string().uuid(),
  currentValue: z.number(),
  thresholdValue: z.number(),
  triggeredAt: z.string().datetime(),
});

// ============================================================================
// Configuration Hierarchy Schemas
// ============================================================================

/**
 * Configuration scope
 */
export const configScopeSchema = z.enum(["tenant", "domain", "connector"]);

/**
 * Resolved configuration response
 */
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

/**
 * Configuration resolution input
 */
export const resolveConfigInputSchema = z.object({
  scope: configScopeSchema,
  sourceId: z.string().uuid(),
  bypassCache: z.boolean().default(false),
});

// ============================================================================
// Combined Operation Schemas
// ============================================================================

/**
 * Generic pagination input
 */
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

/**
 * Generic response with pagination
 */
export function paginatedResponseSchema<T extends z.ZodType>(itemSchema: T) {
  return z.object({
    items: z.array(itemSchema),
    pagination: z.object({
      page: z.number().int(),
      limit: z.number().int(),
      totalItems: z.number().int(),
      totalPages: z.number().int(),
      hasMore: z.boolean(),
    }),
  });
}

/**
 * Success response wrapper
 */
export function successResponseSchema<T extends z.ZodType>(dataSchema: T) {
  return z.object({
    success: z.literal(true),
    data: dataSchema,
    timestamp: z.string().datetime(),
  });
}

/**
 * Error response schema
 */
export const errorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.string(), z.unknown()).optional(),
  }),
  timestamp: z.string().datetime(),
});

// Type exports
export type CreateProviderConfig = z.infer<typeof createProviderConfigSchema>;
export type UpdateProviderConfig = z.infer<typeof updateProviderConfigSchema>;
export type ProviderCredentials = z.infer<typeof providerCredentialsSchema>;
export type ProviderHealth = z.infer<typeof providerHealthSchema>;
export type CreateDomain = z.infer<typeof createDomainSchema>;
export type UpdateDomain = z.infer<typeof updateDomainSchema>;
export type CreateTemplate = z.infer<typeof createTemplateSchema>;
export type UpdateTemplate = z.infer<typeof updateTemplateSchema>;
export type DeployTemplate = z.infer<typeof deployTemplateSchema>;
export type UsageReport = z.infer<typeof usageReportSchema>;
export type UsageQueryFilters = z.infer<typeof usageQueryFiltersSchema>;
export type UsageSummary = z.infer<typeof usageSummarySchema>;
export type CreateBudgetAlert = z.infer<typeof createBudgetAlertSchema>;
export type UpdateBudgetAlert = z.infer<typeof updateBudgetAlertSchema>;
export type ResolvedConfig = z.infer<typeof resolvedConfigSchema>;
export type ResolveConfigInput = z.infer<typeof resolveConfigInputSchema>;
