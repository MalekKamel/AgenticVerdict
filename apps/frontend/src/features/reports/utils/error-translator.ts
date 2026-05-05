/**
 * Error translator for Reports feature
 *
 * Translates canonical error codes to user-friendly messages
 */

import { normalizeFrontendError } from "@agenticverdict/core";

const REPORT_ERROR_MESSAGES: Record<string, string> = {
  REPORT_NOT_FOUND: "Report not found",
  REPORT_CREATE_FAILED: "Failed to create report",
  REPORT_UPDATE_FAILED: "Failed to update report",
  REPORT_DELETE_FAILED: "Failed to delete report",
  REPORT_DOWNLOAD_FAILED: "Failed to download report",
  REPORT_SHARE_FAILED: "Failed to share report",
  REPORT_PERMISSION_DENIED: "You don't have permission to perform this action",
  REPORT_TENANT_MISMATCH: "Tenant mismatch detected",
  REPORT_VALIDATION_FAILED: "Validation failed",
  REPORT_GENERATION_FAILED: "Failed to generate report",
  REPORT_RATE_LIMITED: "Too many requests. Please try again later.",
};

/**
 * Translate an error to a user-friendly message
 */
export function translateReportError(error: unknown): { message: string; code: string } {
  const normalized = normalizeFrontendError(error);
  const code = normalized.code || "INTERNAL_ERROR";
  const message =
    REPORT_ERROR_MESSAGES[code] || normalized.messageKey || "An unexpected error occurred";

  return { message, code };
}

/**
 * Get a user-friendly error message with error code for support
 */
export function getReportErrorMessage(error: unknown): string {
  const { message, code } = translateReportError(error);
  return `${message} (Code: ${code})`;
}
