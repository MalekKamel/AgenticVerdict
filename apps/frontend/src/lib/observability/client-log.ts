/**
 * Centralized browser logging for client-side failures (routes, tRPC, uncaught handlers).
 * Never log passwords, tokens, or full request bodies — only correlation and classification fields.
 */

import { authStore } from "@/stores/auth-store";
import { trpcClientErrorToAppError } from "@/lib/api/trpc-error-mapping";
import { forwardTelemetry } from "@/lib/observability/telemetry-ingest";
import { getEffectiveTenantId } from "@/lib/tenant/tenant-resolution";
import { isTRPCClientError } from "@trpc/client";

export interface WebClientLogContext {
  source: "route" | "trpc" | "global" | "unknown";
  /** Optional route id or path label for support correlation */
  routeLabel?: string;
}

/**
 * Structured console logging for debugging and future RUM forwarding (Phase 3–4).
 */
export function logWebClientError(error: unknown, context: WebClientLogContext): void {
  const tenantId = getEffectiveTenantId({ authTenantId: authStore.state.tenantId });
  const mapped = trpcClientErrorToAppError(error);

  const payload: Record<string, unknown> = {
    source: context.source,
    routeLabel: context.routeLabel,
    tenantId: tenantId ?? null,
    trpcCode: isTRPCClientError(error) ? (error.data?.code ?? null) : null,
    httpStatus: isTRPCClientError(error) ? (error.data?.httpStatus ?? null) : null,
    canonicalCode: mapped?.code ?? null,
    canonicalCategory: mapped?.category ?? null,
    canonicalSurface: mapped?.surface ?? null,
    retryable: mapped?.retryable ?? null,
    correlationId: mapped?.correlationId ?? null,
    name: error instanceof Error ? error.name : typeof error,
  };

  if (process.env.NODE_ENV !== "production" && error instanceof Error && error.message) {
    payload.message = error.message;
  }

  console.error("[web-client]", payload);

  forwardTelemetry({
    kind: "client_error",
    ts: new Date().toISOString(),
    tenantId: tenantId ?? null,
    payload,
  });
}
