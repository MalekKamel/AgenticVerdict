/**
 * Maps tRPC / network errors to user-safe strings (no stack or internal codes in production UI).
 */

import { isTRPCClientError } from "@trpc/client";

function isDev(): boolean {
  try {
    return process.env.NODE_ENV !== "production";
  } catch {
    return true;
  }
}

/**
 * Returns a short, user-facing message for route/error boundaries.
 * In development, includes tRPC error code when present for faster debugging.
 */
export function getTrpcSafeUserMessage(error: unknown): string {
  if (isTRPCClientError(error)) {
    const code = error.data?.code;
    const base = error.message || "Request failed";
    if (isDev() && code) {
      return `${base} (${String(code)})`;
    }
    return base;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Something went wrong. Please try again.";
}
