import type { AppRouter } from "@agenticverdict/api/trpc";
import type { TRPCClientError } from "@trpc/client";

import { normalizeFrontendError, type NormalizedUiError } from "@agenticverdict/core";

export type DashboardTypedError = NormalizedUiError;

export function isDashboardTypedError(value: unknown): value is DashboardTypedError {
  if (!value || typeof value !== "object") {
    return false;
  }
  const v = value as { code?: unknown; messageKey?: unknown; retryable?: unknown };
  return typeof v.code === "string" && typeof v.messageKey === "string";
}

export function mapUnknownToDashboardError(error: unknown): DashboardTypedError {
  const normalized = normalizeFrontendError(error);
  return {
    ...normalized,
    messageKey:
      normalized.messageKey === "errors.common.unknownError"
        ? "dashboard.errors.generic"
        : normalized.messageKey,
  };
}

export function mapTrpcClientErrorToDashboardError(
  error: TRPCClientError<AppRouter>,
): DashboardTypedError {
  const normalized = normalizeFrontendError(error);
  if (normalized.code === "AUTH_FORBIDDEN" || normalized.code === "AUTH_UNAUTHORIZED") {
    return { ...normalized, messageKey: "dashboard.errors.tenantMismatch" };
  }
  if (normalized.code === "TENANT_CONTEXT_REQUIRED") {
    return { ...normalized, messageKey: "dashboard.errors.tenantRequired" };
  }
  return { ...normalized, messageKey: "dashboard.errors.network" };
}

export function tenantContextDashboardError(
  code: "TENANT_CONTEXT_MISSING" | "TENANT_CONTEXT_MISMATCH",
): DashboardTypedError {
  return {
    code,
    category: "tenant",
    surface: "frontend",
    messageKey:
      code === "TENANT_CONTEXT_MISSING"
        ? "dashboard.errors.tenantRequired"
        : "dashboard.errors.tenantMismatch",
    retryable: false,
    severity: "warning",
  };
}
