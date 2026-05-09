import { z } from "zod";

// Tenant type enum
export const tenantTypeSchema = z.enum(["direct_business", "agency_partner", "agency_managed"]);
export type TenantType = z.infer<typeof tenantTypeSchema>;

// Tenant status enum
export const tenantStatusSchema = z.enum([
  "onboarding",
  "active",
  "suspended",
  "restricted",
  "archived",
  "deleted",
]);
export type TenantStatus = z.infer<typeof tenantStatusSchema>;

// Agency partner tier
export const agencyPartnerTierSchema = z.enum(["registered", "certified", "elite"]);
export type AgencyPartnerTier = z.infer<typeof agencyPartnerTierSchema>;

// Localization config
export const tenantLocalizationSchema = z.object({
  language: z.string().length(2),
  region: z.string().length(2),
  timezone: z.string(),
  currency: z.string().length(3),
});
export type TenantLocalization = z.infer<typeof tenantLocalizationSchema>;

// Feature flags
export const tenantFeaturesSchema = z.object({
  enableInsights: z.boolean(),
  enableVerdict: z.boolean(),
  enableReports: z.boolean(),
  maxInsights: z.number().int().positive(),
  maxUsers: z.number().int().positive(),
  whiteLabelEnabled: z.boolean(),
});
export type TenantFeatures = z.infer<typeof tenantFeaturesSchema>;

// Provider ID - must match registered providers in ProviderRegistry
export const providerIdSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9-]+$/, "Provider ID must contain only lowercase letters, numbers, and hyphens");

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
  monthlyLimit: z.number().positive().optional(),
  alertThreshold: z.number().min(0).max(100).default(80),
  hardLimit: z.boolean().default(false),
  alertRecipients: z.array(z.string().email()).optional(),
});

// Failover configuration
export const failoverConfigSchema = z.object({
  fallbackProviders: z.array(providerIdSchema).min(0).max(5).default([]),
  enabled: z.boolean().default(true),
  providerTimeout: z.number().positive().max(30000).default(10000),
  maxRetriesPerProvider: z.number().min(0).max(5).default(1),
});

// Circuit breaker configuration
export const circuitBreakerConfigSchema = z.object({
  enabled: z.boolean().default(true),
  failureThreshold: z.number().positive().default(5),
  failureWindow: z.number().positive().default(30),
  recoveryTimeout: z.number().positive().default(60),
  halfOpenMaxRequests: z.number().positive().default(3),
});

// Rich AI configuration (replaces simple stub)
export const tenantAIConfigSchema = z.object({
  primaryProvider: providerIdSchema.default("anthropic"),
  defaultModel: providerModelConfigSchema.optional(),
  roleBasedModels: roleBasedModelConfigSchema.optional(),
  budget: budgetConfigSchema.optional(),
  failover: failoverConfigSchema.optional(),
  circuitBreaker: circuitBreakerConfigSchema.optional(),
  providerSettings: z.record(providerIdSchema, z.record(z.string(), z.unknown())).optional(),
  defaultDetailLevel: z.string().optional(),
  defaultFrequency: z.string().optional(),
  defaultFormat: z.string().optional(),
  updatedAt: z.iso.datetime().optional(),
  updatedBy: z.string().uuid().optional(),
});

// Type exports
export type ProviderModelConfig = z.infer<typeof providerModelConfigSchema>;
export type RoleBasedModelConfig = z.infer<typeof roleBasedModelConfigSchema>;
export type BudgetConfig = z.infer<typeof budgetConfigSchema>;
export type FailoverConfig = z.infer<typeof failoverConfigSchema>;
export type CircuitBreakerConfig = z.infer<typeof circuitBreakerConfigSchema>;
export type TenantAIConfig = z.infer<typeof tenantAIConfigSchema>;

// Legacy simple AI configuration (deprecated, kept for backward compat with tenantSchema)
export const simpleTenantAIConfigSchema = z.object({
  provider: z.enum(["anthropic", "openai"]),
  model: z.string(),
  qualityLevel: z.enum(["standard", "premium"]),
  customizationLevel: z.enum(["balanced", "creative", "precise"]),
});
export type SimpleTenantAIConfig = z.infer<typeof simpleTenantAIConfigSchema>;

// Complete tenant schema
export const tenantSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2).max(256),
  slug: z.string().min(1).max(128),
  type: tenantTypeSchema,
  status: tenantStatusSchema,
  parentTenantId: z.string().uuid().nullable().optional(),
  agencyPartnerId: z.string().uuid().nullable().optional(),
  localization: tenantLocalizationSchema,
  features: tenantFeaturesSchema,
  aiConfig: simpleTenantAIConfigSchema,
  suspendedAt: z.iso.datetime().nullable().optional(),
  suspendedReason: z.string().nullable().optional(),
  archivedAt: z.iso.datetime().nullable().optional(),
  deletedAt: z.iso.datetime().nullable().optional(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type Tenant = z.infer<typeof tenantSchema>;

// Agency partner schema
export const agencyPartnerSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(100),
  tier: agencyPartnerTierSchema,
  commissionRate: z.number().positive().max(100),
  maxClients: z.number().int().positive(),
  whiteLabelEnabled: z.boolean(),
  partnerSince: z.iso.datetime().nullable().optional(),
  certifiedAt: z.iso.datetime().nullable().optional(),
  settings: z.record(z.string(), z.unknown()),
  createdAt: z.iso.datetime(),
});
export type AgencyPartner = z.infer<typeof agencyPartnerSchema>;

// Tenant capabilities (computed)
export const tenantCapabilitiesSchema = z.object({
  canAccessAgencyDashboard: z.boolean(),
  canManageClientTenants: z.boolean(),
  canCreateInsights: z.boolean(),
  canManageConnectors: z.boolean(),
  canViewReports: z.boolean(),
  canWhiteLabelReports: z.boolean(),
  canSwitchClientContext: z.boolean(),
});
export type TenantCapabilities = z.infer<typeof tenantCapabilitiesSchema>;

export interface FailoverChainConfig {
  providers: string[];
  skipUnhealthy?: boolean;
}

export interface FailoverEvent {
  tenantId: string;
  fromProvider: string;
  toProvider: string;
  error: Error;
  timestamp: Date;
  attemptNumber: number;
}

export interface FailoverCircuitBreakerOptions {
  enabled: boolean;
  failureThreshold: number;
  failureWindow: number;
  recoveryTimeout: number;
  halfOpenMaxRequests: number;
  tenantId?: string;
}
