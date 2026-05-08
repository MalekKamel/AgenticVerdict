import { z } from "zod";

/**
 * Cost tier enum for provider pricing levels
 */
export const costTierSchema = z.enum(["premium", "standard", "economy"]);

export type CostTier = z.infer<typeof costTierSchema>;

/**
 * AI Provider type
 */
export const aiProviderTypeSchema = z.enum(["anthropic", "openai"]);

export type AiProviderType = z.infer<typeof aiProviderTypeSchema>;

/**
 * Business Domain for organizing connectors and providers
 */
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
    scope?: "tenant" | "domain" | "connector";
    providerName?: string;
    enabled?: boolean;
  } | null;
  usesTenantDefault: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Business Domain with Providers
 */
export interface BusinessDomainWithProviders extends BusinessDomain {
  providers?: Array<{
    id: string;
    providerId: string;
    modelId: string;
    costTier: CostTier;
    isEnabled: boolean;
    scope: "tenant" | "domain" | "connector";
    isOverride: boolean;
  }>;
}

/**
 * AI Provider Detail
 */
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
  status: "active" | "inactive" | "error";
  healthStatus?: "healthy" | "unhealthy" | "unknown";
  scope: "tenant" | "domain" | "connector";
  isOverride?: boolean;
  isDefault?: boolean;
  description?: string;
  priority: number;
}

/**
 * AI Template
 */
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

/**
 * Connector type (simplified for frontend)
 */
export interface Connector {
  id: string;
  platform: "meta" | "ga4" | "gsc" | "gbp" | "tiktok";
  name: string;
  type?: string;
  status: "healthy" | "warning" | "error" | "inactive" | "syncing";
  domainId: string | null;
  lastSyncedAt?: string | Date | null;
}
