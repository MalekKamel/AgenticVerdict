import { TRPCError } from "@trpc/server";
import type { FastifyRequest } from "fastify";

import {
  TenantSecurityError,
  assertOptionalTenantHintsMatchResolvedTenant,
  parseOptionalTenantId,
  readOptionalTenantIdHeader,
  resolveRequiredTenantIdFromHints,
  toTrpcErrorCode,
} from "@agenticverdict/core";

/** Maps {@link TenantSecurityError} to tRPC while preserving `cause` for the server error formatter. */
export function trpcErrorFromTenantSecurity(err: TenantSecurityError): TRPCError {
  return new TRPCError({
    code: toTrpcErrorCode(err),
    message: err.message,
    cause: err,
  });
}

/**
 * Single resolver for pre-session `auth.*` tenant hints: optional `tenantId` in validated input
 * plus optional `x-tenant-id` (SSOT C-HTTP-1 — C-HTTP-3).
 */
export function resolvePublicTenantId(
  req: FastifyRequest,
  input: { tenantId?: string | undefined } | undefined,
): string {
  const fromHeader = readOptionalTenantIdHeader(req.headers);
  const fromInput = parseOptionalTenantId(input?.tenantId, "tenantId");
  try {
    return resolveRequiredTenantIdFromHints({
      headerTenantId: fromHeader,
      inputTenantId: fromInput,
    });
  } catch (err) {
    if (err instanceof TenantSecurityError) {
      throw trpcErrorFromTenantSecurity(err);
    }
    throw err;
  }
}

/**
 * When optional tenant hints are present for password-reset confirmation, they must agree with
 * each other and with the tenant that owns the user row (SSOT C-HTTP-2).
 */
export function assertOptionalPublicTenantMatchesTenant(
  req: FastifyRequest,
  input: { tenantId?: string | undefined },
  tenantId: string,
): void {
  const fromHeader = readOptionalTenantIdHeader(req.headers);
  const fromInput = parseOptionalTenantId(input.tenantId, "tenantId");
  try {
    assertOptionalTenantHintsMatchResolvedTenant({
      headerTenantId: fromHeader,
      inputTenantId: fromInput,
      resolvedTenantId: tenantId,
    });
  } catch (err) {
    if (err instanceof TenantSecurityError) {
      throw trpcErrorFromTenantSecurity(err);
    }
    throw err;
  }
}
