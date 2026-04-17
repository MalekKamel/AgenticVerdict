/**
 * Maps tRPC client errors to `AppError` shapes for structured handling.
 * Server-side `PlatformError` from `apps/api` surfaces through tRPC as coded `TRPCClientError`s
 * (not as live `PlatformError` class instances in the browser).
 */

import { isTRPCClientError } from "@trpc/client";

import type { AppError } from "@/lib/types/errors";
import { createAuthError, createRateLimitError, createServerError } from "@/lib/types/errors";

const TRPC_AUTH_CODES = new Set(["UNAUTHORIZED", "FORBIDDEN"]);

/**
 * Best-effort mapping for logging, analytics, and route boundaries (English fallback strings).
 */
export function trpcClientErrorToAppError(error: unknown): AppError | null {
  if (!isTRPCClientError(error)) {
    return null;
  }

  const code = error.data?.code ? String(error.data.code) : "";
  const status = error.data?.httpStatus;

  if (TRPC_AUTH_CODES.has(code)) {
    return createAuthError(code === "FORBIDDEN" ? "AUTH_FORBIDDEN" : "AUTH_UNAUTHORIZED", {
      message: error.message,
    });
  }

  if (code === "TOO_MANY_REQUESTS" || status === 429) {
    return createRateLimitError("RATE_LIMIT_EXCEEDED", 60, {
      message: error.message,
    });
  }

  if (code === "TIMEOUT" || status === 408 || status === 504) {
    return createServerError("SERVER_GATEWAY_TIMEOUT", status ?? 504, { message: error.message });
  }

  if (status === 502) {
    return createServerError("SERVER_BAD_GATEWAY", 502, { message: error.message });
  }

  if (status === 503) {
    return createServerError("SERVER_SERVICE_UNAVAILABLE", 503, { message: error.message });
  }

  if (status !== undefined && status >= 500) {
    return createServerError("SERVER_INTERNAL_ERROR", status, { message: error.message });
  }

  if (code === "INTERNAL_SERVER_ERROR" || status === 500) {
    return createServerError("SERVER_INTERNAL_ERROR", 500, { message: error.message });
  }

  return createServerError("SERVER_INTERNAL_ERROR", status ?? 500, {
    message: error.message,
    details: { trpcCode: code || undefined },
  });
}
