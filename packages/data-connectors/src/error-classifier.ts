import { PlatformError, type PlatformErrorCode } from "./errors";

const NON_RETRYABLE_CODES = new Set<PlatformErrorCode>([
  "auth_failed",
  "invalid_request",
  "not_found",
  "not_registered",
  "missing_tenant_id",
]);

/**
 * Classifies whether an error should trigger exponential backoff retries (Task 1.5 / AC-1.7.6).
 */
export function isRetryableConnectorError(error: unknown): boolean {
  if (error instanceof PlatformError) {
    if (NON_RETRYABLE_CODES.has(error.code)) {
      return false;
    }
    if (error.code === "rate_limited" || error.code === "upstream_error") {
      return true;
    }
    return error.code === "unknown";
  }

  if (error instanceof Error) {
    const message = error.message;
    if (/\b4\d{2}\b/.test(message) && !/429/.test(message)) {
      return false;
    }
    if (/429|rate|throttl|timeout|ETIMEDOUT|ECONNRESET|EAI_AGAIN|503|502|500/i.test(message)) {
      return true;
    }
  }

  return false;
}
