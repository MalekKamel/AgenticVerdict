/**
 * Centralized React Query / tRPC retry rules for transient failures.
 * Aligns with connector `PlatformError` retry semantics: no retry on client/validation errors.
 */

import { isTRPCClientError } from "@trpc/client";

const NON_RETRYABLE_TRPC_CODES = new Set<string>([
  "BAD_REQUEST",
  "UNAUTHORIZED",
  "FORBIDDEN",
  "NOT_FOUND",
  "CONFLICT",
  "PRECONDITION_FAILED",
  "PAYLOAD_TOO_LARGE",
  "METHOD_NOT_SUPPORTED",
  "UNPROCESSABLE_CONTENT",
  "PARSE_ERROR",
  "CLIENT_CLOSED_REQUEST",
]);

const DEFAULT_QUERY_RETRIES = 3;
const DEFAULT_MUTATION_RETRIES = 1;

function httpStatusAllowsRetry(status: number | undefined): boolean {
  if (status === undefined) {
    return true;
  }
  if (status >= 400 && status < 500) {
    return status === 408 || status === 429;
  }
  return status >= 500 || status === 408;
}

/**
 * Returns true when the query should be retried (network / transient server / rate-limit burst).
 */
export function shouldRetryTrpcQuery(failureCount: number, error: unknown): boolean {
  if (failureCount >= DEFAULT_QUERY_RETRIES) {
    return false;
  }

  if (!isTRPCClientError(error)) {
    return true;
  }

  const code = error.data?.code;
  if (code && NON_RETRYABLE_TRPC_CODES.has(String(code))) {
    return false;
  }

  const status = error.data?.httpStatus;
  return httpStatusAllowsRetry(status);
}

/**
 * Mutations retry at most once on clearly transient failures.
 */
export function shouldRetryTrpcMutation(failureCount: number, error: unknown): boolean {
  if (failureCount >= DEFAULT_MUTATION_RETRIES) {
    return false;
  }

  if (!isTRPCClientError(error)) {
    return true;
  }

  const code = error.data?.code;
  if (code && NON_RETRYABLE_TRPC_CODES.has(String(code))) {
    return false;
  }

  const status = error.data?.httpStatus;
  if (status === 429) {
    return false;
  }
  return httpStatusAllowsRetry(status);
}
