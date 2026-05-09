/**
 * Error translator for Insights feature
 *
 * Translates canonical error codes to i18n keys for user-friendly messages
 */

import { normalizeFrontendError } from "@agenticverdict/core";

const INSIGHT_ERROR_KEYS: Record<string, string> = {
  INSIGHT_NOT_FOUND: "errors.insightNotFound",
  INSIGHT_CREATE_FAILED: "errors.createFailed",
  INSIGHT_UPDATE_FAILED: "errors.updateFailed",
  INSIGHT_DELETE_FAILED: "errors.deleteFailed",
  INSIGHT_RUN_FAILED: "errors.runFailed",
  INSIGHT_INVALID_CONFIG: "errors.invalidConfig",
  INSIGHT_CONNECTOR_REQUIRED: "errors.connectorRequired",
  INSIGHT_METRICS_REQUIRED: "errors.metricsRequired",
  INSIGHT_PERMISSION_DENIED: "errors.permissionDenied",
  INSIGHT_TENANT_MISMATCH: "errors.tenantMismatch",
  INSIGHT_VALIDATION_FAILED: "errors.validationFailed",
  INSIGHT_AI_GENERATION_FAILED: "errors.aiGenerationFailed",
  INSIGHT_REPORT_NOT_FOUND: "errors.reportNotFound",
  INSIGHT_REPORT_DOWNLOAD_FAILED: "errors.reportDownloadFailed",
  INSIGHT_REPORT_SHARE_FAILED: "errors.reportShareFailed",
  INSIGHT_RATE_LIMITED: "errors.rateLimited",
  CONNECTOR_NOT_FOUND: "errors.connectorNotFound",
  CONNECTOR_UNHEALTHY: "errors.connectorUnhealthy",
  INSIGHT_DUPLICATE_NAME: "errors.duplicateName",
  INSIGHT_DISABLED: "errors.insightDisabled",
  MODEL_NOT_SUPPORTED: "errors.modelNotSupported",
  PROVIDER_NOT_AVAILABLE: "errors.providerNotAvailable",
};

/**
 * Translate an error to an i18n key and code
 */
export function translateInsightError(error: unknown): { messageKey: string; code: string } {
  const normalized = normalizeFrontendError(error);
  const code = normalized.code || "INTERNAL_ERROR";
  const messageKey = INSIGHT_ERROR_KEYS[code] || "errors.unknown";

  return { messageKey, code };
}

/**
 * Get a user-friendly error message with error code for support
 * Note: For display, use the messageKey with useTranslations("insights")
 */
export function getInsightErrorMessage(error: unknown): string {
  const { messageKey, code } = translateInsightError(error);
  return `${messageKey} (Code: ${code})`;
}
