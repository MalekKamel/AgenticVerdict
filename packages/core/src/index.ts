export { assertResourceTenantId, tenantContextMatches } from "./tenant-data-access";
export {
  toHttpErrorResponse,
  toTrpcErrorCode,
  toQueueFailure,
  toTrpcErrorMeta,
  toWorkerFailure,
  type CanonicalBoundaryPayload,
  type HttpErrorResponse,
  type QueueFailurePayload,
  type TrpcErrorMeta,
} from "./error-translators";
export {
  AppFault,
  ERROR_CODES,
  ERROR_CODE_SET,
  ERROR_CATEGORY_VALUES,
  ERROR_SURFACE_VALUES,
  getMessageKeyForErrorCode,
  assertRegisteredErrorCode,
  isAppFault,
  toAppFault,
  type AppFaultDetails,
  type AppFaultInit,
  type ErrorCategory,
  type ErrorCode,
  type ErrorSurface,
  type FaultNormalizationContext,
} from "./errors";
export {
  bindTenantContext,
  continueWithTenantContext,
  runWithCapturedTenantContext,
} from "./tenant-propagation";
export type { TenantConfigLoader, ResolveTenantContextOptions } from "./tenant-request-context";
export { resolveTenantContextFromHttp } from "./tenant-request-context";
export {
  extractTenantSlugFromHost,
  resolveTenantIdentity,
  type TenantResolutionOptions,
  type TenantResolutionSources,
} from "./tenant-resolution";
export {
  assertOptionalTenantHintsMatchResolvedTenant,
  isTenantUuid,
  parseOptionalTenantId,
  readOptionalTenantIdHeader,
  resolveRequiredTenantIdFromHints,
} from "./public-tenant-resolution";
export type { TenantSecurityCode } from "./tenant-security-error";
export { TenantSecurityError } from "./tenant-security-error";
export {
  bindTenantContextAsyncContinuation,
  createTenantContext,
  buildTenantContextForJob,
  getTenantContext,
  requireTenantContext,
  runWithTenantContext,
  getTenantCapabilities,
  validateTenantContext,
  TenantSuspendedError,
  TenantDeletedError,
  TenantTypeMismatchError,
  type TenantContext,
} from "./tenant-context";
export { resolveTenantIdByPriority } from "./tenant/resolve-tenant-id-by-priority";
export { getEffectiveTenantId, type EffectiveTenantSources } from "./tenant/tenant-resolution";
export {
  publishTenantIdForTrpcHeaders,
  getTenantIdForTrpcRequest,
  resetTenantBridgeForTests,
  setAuthStoreForTests,
} from "./tenant/trpc-tenant-bridge";
export { mergePreSessionTenantInput } from "./tenant/merge-pre-session-tenant-input";
export * from "./storage";
export {
  normalizeFrontendError,
  type NormalizedUiError,
} from "./error-system/normalized-error-adapter";
export * from "./schemas/ai-provider";
