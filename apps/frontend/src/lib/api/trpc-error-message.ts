/**
 * Maps tRPC / network errors to user-safe translation keys.
 */

import { normalizeFrontendError } from "@agenticverdict/core";

/**
 * Returns a user-safe message key for route/error boundaries.
 */
export function getTrpcSafeUserMessageKey(error: unknown): string {
  const normalized = normalizeFrontendError(error);
  return normalized.messageKey || "errors.common.unknownError";
}

/**
 * Backward-compatible helper returning a translation key string.
 * Callers should translate this key at the render edge.
 */
export function getTrpcSafeUserMessage(error: unknown): string {
  return getTrpcSafeUserMessageKey(error);
}
