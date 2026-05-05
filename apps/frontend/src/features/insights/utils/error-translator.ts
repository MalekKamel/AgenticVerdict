/**
 * Error translator for Insights feature
 *
 * Translates canonical error codes to user-friendly messages
 */

import { normalizeFrontendError } from "@agenticverdict/core";

const INSIGHT_ERROR_MESSAGES: Record<string, string> = {
  INSIGHT_NOT_FOUND: "Insight not found",
  INSIGHT_CREATE_FAILED: "Failed to create insight",
  INSIGHT_UPDATE_FAILED: "Failed to update insight",
  INSIGHT_DELETE_FAILED: "Failed to delete insight",
  INSIGHT_RUN_FAILED: "Failed to run insight",
  INSIGHT_INVALID_CONFIG: "Invalid insight configuration",
  INSIGHT_CONNECTOR_REQUIRED: "At least one connector is required",
  INSIGHT_METRICS_REQUIRED: "At least one metric per connector is required",
  INSIGHT_PERMISSION_DENIED: "You don't have permission to perform this action",
  INSIGHT_TENANT_MISMATCH: "Tenant mismatch detected",
  INSIGHT_VALIDATION_FAILED: "Validation failed",
  INSIGHT_AI_GENERATION_FAILED: "Failed to generate AI insights",
  INSIGHT_REPORT_NOT_FOUND: "Report not found",
  INSIGHT_REPORT_DOWNLOAD_FAILED: "Failed to download report",
  INSIGHT_REPORT_SHARE_FAILED: "Failed to share report",
  INSIGHT_RATE_LIMITED: "Too many requests. Please try again later.",
};

/**
 * Translate an error to a user-friendly message
 */
export function translateInsightError(error: unknown): { message: string; code: string } {
  const normalized = normalizeFrontendError(error);
  const code = normalized.code || "INTERNAL_ERROR";
  const message =
    INSIGHT_ERROR_MESSAGES[code] || normalized.messageKey || "An unexpected error occurred";

  return { message, code };
}

/**
 * Get a user-friendly error message with error code for support
 */
export function getInsightErrorMessage(error: unknown): string {
  const { message, code } = translateInsightError(error);
  return `${message} (Code: ${code})`;
}
