/**
 * AI Provider Management Type Definitions
 *
 * Core types for AI provider configuration, business domains,
 * templates, usage tracking, and budget management.
 */

/**
 * Cost tier enum for provider pricing levels
 */
export enum CostTier {
  PREMIUM = "premium",
  STANDARD = "standard",
  ECONOMY = "economy",
}

/**
 * AI Provider detail item
 * Represents a configured AI provider with all metadata
 */
export interface AiProviderDetailItem {
  /** Unique provider identifier */
  id: string;

  /** Provider name (e.g., "Anthropic Claude", "OpenAI GPT-4") */
  name: string;

  /** Provider slug/key (e.g., "anthropic", "openai") */
  providerId: string;

  /** Provider type */
  type: "llm" | "embedding" | "multimodal";

  /** Supported models */
  models: AiModel[];

  /** Cost tier for pricing */
  costTier: CostTier;

  /** Base URL for API (optional for custom providers) */
  baseUrl?: string;

  /** Whether provider is enabled */
  isEnabled: boolean;

  /** Provider health status */
  healthStatus: "healthy" | "unhealthy" | "unknown";

  /** Last health check timestamp */
  lastHealthCheck?: Date;

  /** Configuration scope */
  scope: "tenant" | "domain" | "connector";

  /** Parent ID if scoped to domain or connector */
  parentId?: string;

  /** Whether this is an override of parent configuration */
  isOverride: boolean;

  /** Priority for failover ordering */
  priority: number;

  /** Rate limit (requests per minute) */
  rateLimit?: number;

  /** Timeout in milliseconds */
  timeout?: number;

  /** Created timestamp */
  createdAt: Date;

  /** Updated timestamp */
  updatedAt: Date;
}

/**
 * AI Model definition
 */
export interface AiModel {
  /** Model identifier */
  id: string;

  /** Model name */
  name: string;

  /** Model version */
  version: string;

  /** Context window size (tokens) */
  contextWindow: number;

  /** Input cost per 1K tokens (USD cents) */
  inputCostPer1k: number;

  /** Output cost per 1K tokens (USD cents) */
  outputCostPer1k: number;

  /** Whether model supports streaming */
  supportsStreaming: boolean;

  /** Whether model supports function calling */
  supportsFunctionCalling: boolean;

  /** Whether model is multimodal */
  isMultimodal: boolean;

  /** Model capabilities */
  capabilities: string[];
}

/**
 * Business domain for organizing connectors and providers
 */
export interface BusinessDomain {
  /** Unique domain identifier */
  id: string;

  /** Tenant ID */
  tenantId: string;

  /** Domain name */
  name: string;

  /** Domain description */
  description?: string;

  /** Parent domain ID for hierarchy */
  parentId?: string;

  /** Child domains */
  childDomains?: BusinessDomain[];

  /** Assigned connector IDs */
  connectorIds: string[];

  /** Domain-specific provider configuration */
  providerConfig?: AiProviderConfig;

  /** Whether domain uses tenant default provider */
  usesTenantDefault: boolean;

  /** Domain order/sort position */
  order: number;

  /** Created timestamp */
  createdAt: Date;

  /** Updated timestamp */
  updatedAt: Date;
}

/**
 * AI Provider configuration
 */
export interface AiProviderConfig {
  /** Provider ID */
  providerId: string;

  /** Model ID */
  modelId: string;

  /** Cost tier */
  costTier: CostTier;

  /** Custom pricing (optional override) */
  customPricing?: {
    inputCostPer1k: number;
    outputCostPer1k: number;
  };

  /** API credentials ID (reference to encrypted credentials) */
  credentialsId: string;

  /** Configuration scope */
  scope: "tenant" | "domain" | "connector";

  /** Whether enabled */
  isEnabled: boolean;
}

/**
 * AI Usage report
 * Tracks usage metrics for billing and analytics
 */
export interface AiUsageReport {
  /** Unique report identifier */
  id: string;

  /** Tenant ID */
  tenantId: string;

  /** Provider ID */
  providerId: string;

  /** Model ID */
  modelId: string;

  /** Domain ID (optional) */
  domainId?: string;

  /** Connector ID (optional) */
  connectorId?: string;

  /** Prompt/input tokens */
  promptTokens: number;

  /** Completion/output tokens */
  completionTokens: number;

  /** Total tokens */
  totalTokens: number;

  /** Cost in USD cents */
  costCents: number;

  /** Request timestamp */
  timestamp: Date;

  /** Request ID for tracing */
  requestId: string;

  /** Response latency in milliseconds */
  latencyMs: number;

  /** Whether request succeeded */
  success: boolean;

  /** Error code if failed */
  errorCode?: string;

  /** Error message if failed */
  errorMessage?: string;

  /** Whether this used failover provider */
  wasFailover: boolean;

  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Aggregated usage summary
 */
export interface AiUsageSummary {
  /** Tenant ID */
  tenantId: string;

  /** Time period start */
  periodStart: Date;

  /** Time period end */
  periodEnd: Date;

  /** Total prompt tokens */
  totalPromptTokens: number;

  /** Total completion tokens */
  totalCompletionTokens: number;

  /** Total tokens */
  totalTokens: number;

  /** Total cost in USD cents */
  totalCostCents: number;

  /** Total requests */
  totalRequests: number;

  /** Successful requests */
  successfulRequests: number;

  /** Failed requests */
  failedRequests: number;

  /** Average latency in milliseconds */
  avgLatencyMs: number;

  /** Usage breakdown by provider */
  byProvider: ProviderUsageBreakdown[];

  /** Usage breakdown by domain */
  byDomain: DomainUsageBreakdown[];

  /** Usage breakdown by model */
  byModel: ModelUsageBreakdown[];
}

/**
 * Provider-specific usage breakdown
 */
export interface ProviderUsageBreakdown {
  /** Provider ID */
  providerId: string;

  /** Provider name */
  providerName: string;

  /** Total tokens */
  totalTokens: number;

  /** Total cost in USD cents */
  totalCostCents: number;

  /** Request count */
  requestCount: number;
}

/**
 * Domain-specific usage breakdown
 */
export interface DomainUsageBreakdown {
  /** Domain ID */
  domainId: string;

  /** Domain name */
  domainName: string;

  /** Total tokens */
  totalTokens: number;

  /** Total cost in USD cents */
  totalCostCents: number;

  /** Request count */
  requestCount: number;
}

/**
 * Model-specific usage breakdown
 */
export interface ModelUsageBreakdown {
  /** Model ID */
  modelId: string;

  /** Model name */
  modelName: string;

  /** Total tokens */
  totalTokens: number;

  /** Total cost in USD cents */
  totalCostCents: number;

  /** Request count */
  requestCount: number;
}

/**
 * AI Template for reusable configurations
 */
export interface AiTemplate {
  /** Unique template identifier */
  id: string;

  /** Tenant ID */
  tenantId: string;

  /** Template name */
  name: string;

  /** Template description */
  description?: string;

  /** Template version */
  version: string;

  /** Template type */
  type: "prompt" | "configuration" | "workflow";

  /** Template content */
  content: string;

  /** Variables/parameters definition */
  variables: TemplateVariable[];

  /** Associated provider ID */
  providerId?: string;

  /** Associated model ID */
  modelId?: string;

  /** Domain ID if domain-specific */
  domainId?: string;

  /** Whether template is published */
  isPublished: boolean;

  /** Parent template ID for versioning */
  parentVersionId?: string;

  /** Created by user ID */
  createdById: string;

  /** Created timestamp */
  createdAt: Date;

  /** Updated timestamp */
  updatedAt: Date;
}

/**
 * Template variable definition
 */
export interface TemplateVariable {
  /** Variable name */
  name: string;

  /** Variable type */
  type: "string" | "number" | "boolean" | "object" | "array";

  /** Whether required */
  required: boolean;

  /** Default value */
  defaultValue?: unknown;

  /** Description */
  description?: string;

  /** Validation pattern (regex) */
  pattern?: string;
}

/**
 * Budget alert configuration
 */
export interface BudgetAlert {
  /** Unique alert identifier */
  id: string;

  /** Tenant ID */
  tenantId: string;

  /** Alert name */
  name: string;

  /** Alert description */
  description?: string;

  /** Alert type */
  type: "threshold" | "percentage" | "rate";

  /** Threshold value */
  threshold: number;

  /** Threshold type */
  thresholdType: "cost" | "tokens" | "requests";

  /** Time window for evaluation */
  timeWindow: "hourly" | "daily" | "weekly" | "monthly";

  /** Alert status */
  status: "active" | "paused" | "triggered";

  /** Notification channels */
  notifications: AlertNotification[];

  /** Last triggered timestamp */
  lastTriggeredAt?: Date;

  /** Trigger count */
  triggerCount: number;

  /** Created by user ID */
  createdById: string;

  /** Created timestamp */
  createdAt: Date;

  /** Updated timestamp */
  updatedAt: Date;
}

/**
 * Alert notification channel
 */
export interface AlertNotification {
  /** Notification ID */
  id: string;

  /** Notification type */
  type: "email" | "webhook" | "slack";

  /** Target address/URL */
  target: string;

  /** Whether enabled */
  isEnabled: boolean;
}

/**
 * Config hierarchy resolution result
 */
export interface ResolvedConfig {
  /** Resolved provider ID */
  providerId: string;

  /** Resolved model ID */
  modelId: string;

  /** Cost tier */
  costTier: CostTier;

  /** Effective pricing */
  pricing: {
    inputCostPer1k: number;
    outputCostPer1k: number;
  };

  /** Configuration source level */
  sourceLevel: "tenant" | "domain" | "connector";

  /** Source ID */
  sourceId: string;

  /** Whether this was inherited */
  isInherited: boolean;

  /** Inheritance chain */
  inheritanceChain: string[];

  /** Cache metadata */
  cacheMetadata?: {
    /** Whether served from cache */
    fromCache: boolean;

    /** Cache level */
    cacheLevel?: "L1" | "L2";

    /** Cache key */
    cacheKey?: string;
  };
}
