/**
 * Maps tRPC client errors to `AppError` shapes for structured handling.
 * Server-side `PlatformError` from `apps/api` surfaces through tRPC as coded `TRPCClientError`s
 * (not as live `PlatformError` class instances in the browser).
 */

import { isTRPCClientError } from "@trpc/client";

import {
  normalizeFrontendError,
  type NormalizedUiError,
} from "@/lib/errors/normalized-error-adapter";

const TRPC_AUTH_CODES = new Set(["UNAUTHORIZED", "FORBIDDEN"]);

/**
 * Best-effort mapping for logging, analytics, and route boundaries (English fallback strings).
 */
export function trpcClientErrorToAppError(error: unknown): NormalizedUiError | null {
  if (!isTRPCClientError(error)) {
    return null;
  }
  const normalized = normalizeFrontendError(error);
  if (TRPC_AUTH_CODES.has(String(error.data?.code))) {
    return { ...normalized, category: "authentication" };
  }
  return normalized;
}
