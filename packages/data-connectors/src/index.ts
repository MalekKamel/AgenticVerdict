/**
 * Data connector contracts (`ConnectorAdapter`), resilience helpers (`BaseConnectorAdapter`), in-process
 * {@link createAdapterRegistry}, and mocks. Vendor SDK integrations evolve by connector; this package
 * is the integration boundary between apps and external marketing APIs.
 */
export {
  BaseConnectorAdapter,
  type BaseConnectorAdapterOptions,
  type ConnectorAdapter,
} from "./adapter";
export {
  AdapterMethodMetrics,
  healthScoreFromMetrics,
  type AdapterOperationEvent,
  type ConnectorAdapterMetricSnapshot,
} from "./adapter-metrics";
export {
  createDefaultAdapterInfrastructure,
  type AdapterInfrastructureBundle,
} from "./adapter-infrastructure";
export {
  CircuitBreaker,
  type CircuitBreakerObservabilityLabels,
  type CircuitBreakerOptions,
  type CircuitState,
} from "./circuit-breaker";
export { buildAdapterCacheKey, type AdapterCacheKeyInput } from "./cache/cache-keys";
export { MemoryPlatformCache } from "./cache/memory-cache";
export { defaultAdapterCacheTtlSeconds } from "./cache/ttl";
export type { CacheOperationMetrics, PlatformCache } from "./cache/types";
export { UpstashPlatformCache } from "./cache/upstash-cache";
export type { ConnectorCredentials } from "./credentials";
export type { DateRangeIso } from "./date-range";
export {
  type DeadLetterQueue,
  type DeadLetterRecord,
  InMemoryDeadLetterQueue,
} from "./dead-letter-queue";
export { isRetryableConnectorError } from "./error-classifier";
export {
  PlatformAuthError,
  PlatformCircuitOpenError,
  PlatformError,
  type PlatformErrorCode,
  PlatformRateLimitError,
} from "./errors";
export {
  collectInfrastructureHealth,
  type ConnectorHealthReport,
  type InfrastructureHealthOptions,
} from "./infrastructure-health";
export {
  Ga4ConnectorAdapter,
  ga4CredentialKeys,
  type Ga4ConnectorAdapterOptions,
} from "./ga4/ga4-adapter";
export { Ga4DailyQuotaTracker, type Ga4DailyQuotaTrackerOptions } from "./ga4/daily-quota";
export {
  GA4_DATA_API_ORIGIN,
  mapGa4DataApiHttpError,
  mergeGa4RunReports,
  normalizeGa4PropertyResourceId,
} from "./ga4/data-client";
export { refreshGoogleAccessToken, validateGoogleAccessToken } from "./ga4/oauth";
export {
  refreshGoogleAccessTokenForConnector,
  validateGoogleAccessTokenForConnector,
} from "./google/oauth";
export type {
  RefreshGoogleAccessTokenInput as GoogleOAuthRefreshInput,
  RefreshGoogleAccessTokenResult as GoogleOAuthRefreshResult,
  ValidateGoogleAccessTokenResult as GoogleOAuthValidateResult,
} from "./google/oauth";
export { mapGoogleJsonApiHttpError, readGoogleApiJsonBody } from "./google/http";
export {
  GscConnectorAdapter,
  gscCredentialKeys,
  type GscConnectorAdapterOptions,
} from "./gsc/gsc-adapter";
export { encodeGscSiteUrl, GSC_URL_INSPECTION_URL, GSC_WEBMASTERS_ORIGIN } from "./gsc/api-client";
export {
  assertGscSearchAnalyticsDateRange,
  GSC_MAX_INCLUSIVE_HISTORY_DAYS,
} from "./gsc/date-range-guard";
export type { GscRawMetricsPayload } from "./gsc/models";
export { normalizeGscRawMetrics } from "./gsc/transformers";
export {
  GbpConnectorAdapter,
  gbpCredentialKeys,
  type GbpConnectorAdapterOptions,
} from "./gbp/gbp-adapter";
export {
  GBP_ACCOUNT_MGMT_ORIGIN,
  GBP_BUSINESS_INFO_ORIGIN,
  GBP_MYBUSINESS_V4_ORIGIN,
  GBP_PERFORMANCE_ORIGIN,
  gbpFetchPerformanceForLocation,
  gbpListAllAccounts,
  gbpListAllLocationsForAccount,
  isoDateToGoogleCalendar,
  locationIdFromResourceName,
} from "./gbp/api-client";
export type { GbpRawMetricsPayload } from "./gbp/models";
export { normalizeGbpRawMetrics } from "./gbp/transformers";
export type { Ga4RawMetricsPayload, Ga4RunReportResponse } from "./ga4/models";
export { normalizeGa4RawMetrics } from "./ga4/transformers";
export {
  countInclusiveUtcDays,
  splitInclusiveDateRange,
  trailingInclusiveWindow,
} from "./ga4/date-range-split";
export {
  MetaConnectorAdapter,
  metaCredentialKeys,
  normalizeMetaAdAccountId,
  type MetaConnectorAdapterOptions,
} from "./meta/meta-adapter";
export {
  META_GRAPH_API_VERSION,
  META_GRAPH_ORIGIN,
  mapMetaGraphHttpError,
} from "./meta/graph-client";
export { exchangeMetaLongLivedToken, validateMetaAccessToken } from "./meta/oauth";
export type {
  MetaAd,
  MetaAdSet,
  MetaCampaign,
  MetaInsightRow,
  MetaListResponse,
  MetaRawMetricsPayload,
} from "./meta/models";
export { normalizeMetaRawMetrics } from "./meta/transformers";
export {
  TikTokConnectorAdapter,
  tiktokCredentialKeys,
  type TikTokConnectorAdapterOptions,
} from "./tiktok/tiktok-adapter";
export {
  tiktokFetchAllListPages,
  tiktokFetchIntegratedCampaignReport,
  tiktokMarketingGet,
  type TikTokApiRequestOptions,
} from "./tiktok/api-client";
export {
  mapTikTokBusinessCode,
  mapTikTokHttpError,
  tiktokOpenApiBaseUrl,
  TIKTOK_OPEN_API_VERSION,
} from "./tiktok/http";
export { normalizeTikTokRawMetrics } from "./tiktok/transformers";
export type {
  TikTokAd,
  TikTokAdGroup,
  TikTokCampaign,
  TikTokIntegratedCampaignRow,
  TikTokRawMetricsPayload,
} from "./tiktok/models";
export { tiktokOauth2AccessToken, validateTikTokAccessToken } from "./tiktok/oauth";
export type { TikTokOAuthAccessTokenInput, TikTokOAuthAccessTokenResult } from "./tiktok/oauth";
export { MockAdapterFactory, type MockAdapterFactoryConfig } from "./mock-adapter-factory";
export { MockConnectorAdapter, type MockConnectorAdapterOptions } from "./mock-adapter";
export {
  config,
  createConnectorAdapter,
  isMockEnabledForConnector,
  connectorAdapterTypes,
  type AdapterFactoryConfig,
} from "./adapter-factory";
export {
  type MockAdapterScenario,
  type MockStaticDataOptions,
  buildScenarioRecords,
  mulberry32,
} from "./mock-static-data";
export {
  DEFAULT_FX_RATES_TO_USD,
  applySpendCurrencyConversion,
  convertAmountToUsd,
  normalizeCardinalityMetricValue,
  normalizedMetricRecordSchema,
  normalizedConnectorSnapshotSchema,
  NORMALIZATION_PIPELINE_VERSION,
  parseNormalizedConnectorSnapshot,
  runNormalizationPipeline,
  standardizeDimensions,
  type NormalizationPipelineOptions,
  type NormalizationPipelineResult,
  type NormalizedConnectorSnapshotParsed,
  type SpendCurrencyConversionOptions,
} from "./normalization";
export type {
  NormalizedMetricRecord,
  NormalizedConnectorSnapshot,
  ConnectorDataNormalizer,
  SnapshotPipelineMetadata,
} from "./normalization";
export {
  computeDataQualityScore,
  countIssuesByCode,
  detectMetricValueOutliers,
  partitionIssuesBySeverity,
  qualityScoreFromFlags,
  summarizeValidationIssues,
  validateCrossFieldCtr,
  validateNormalizedSnapshot,
  validateSpendVersusCpcClicks,
  type DataQualityScoreInput,
  type OutlierDetectionOptions,
} from "./validation";
export type { OutlierFlag, ValidationIssue, ValidationSeverity } from "./validation";
export { defaultConnectorRateProfile, createConnectorTokenBucket } from "./platform-rate-config";
export { RequestPriorityQueue, type PrioritizedTask, type RequestPriority } from "./priority-queue";
export {
  createAdapterRegistry,
  type AdapterFactory,
  type ConnectorAdapterRegistry,
} from "./registry";
export {
  applyBackoffJitter,
  defaultBackoffOptions,
  type ExponentialBackoffOptions,
  type ExponentialBackoffTelemetry,
  withExponentialBackoff,
} from "./rate-limit";
export { createOptionalUpstashRedis } from "./redis-env";
export { TokenBucket } from "./token-bucket";
export {
  createSyntheticAdapter,
  testAdapterTenantId,
  useMockAdapter,
  type SyntheticAdapterOptions,
} from "./test-utils";

export const DATA_CONNECTORS_PACKAGE_VERSION = "0.1.0";
