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

// AI configuration
export const tenantAIConfigSchema = z.object({
  provider: z.enum(["anthropic", "openai"]),
  model: z.string(),
  qualityLevel: z.enum(["standard", "premium"]),
  customizationLevel: z.enum(["balanced", "creative", "precise"]),
});
export type TenantAIConfig = z.infer<typeof tenantAIConfigSchema>;

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
  aiConfig: tenantAIConfigSchema,
  suspendedAt: z.string().datetime().nullable().optional(),
  suspendedReason: z.string().nullable().optional(),
  archivedAt: z.string().datetime().nullable().optional(),
  deletedAt: z.string().datetime().nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
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
  partnerSince: z.string().datetime().nullable().optional(),
  certifiedAt: z.string().datetime().nullable().optional(),
  settings: z.record(z.unknown()),
  createdAt: z.string().datetime(),
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
