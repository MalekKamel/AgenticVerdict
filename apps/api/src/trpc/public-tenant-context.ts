import { getDefaultConfigManager } from "@agenticverdict/config";
import { resolveTenantContextFromHttp, runWithTenantContext } from "@agenticverdict/core";
import type { FastifyRequest } from "fastify";

import { resolvePublicTenantId, trpcErrorFromTenantSecurity } from "./resolve-public-tenant-id";

const configManager = getDefaultConfigManager();

/**
 * Runs `fn` in ALS with a loaded `TenantContext` for the resolved public-procedure `tenantId`,
 * enabling `dbScoped` in pre-session auth mutations (Phase 4 — C-ALS-1, §9 Q-2).
 */
export async function runWithPublicAuthTenantRls<T>(
  request: FastifyRequest,
  input: { tenantId?: string | null | undefined },
  fn: () => Promise<T> | T,
): Promise<T> {
  const tenantId = resolvePublicTenantId(request, {
    tenantId: input.tenantId == null ? undefined : input.tenantId,
  });
  return runWithKnownTenantForRls(request, tenantId, fn);
}

/**
 * When `tenantId` is already validated (e.g. user row from opaque token), establish ALS + RLS
 * without requiring a request body or header hint (e.g. `auth.confirmPasswordReset` token-only).
 */
export async function runWithKnownTenantForRls<T>(
  request: FastifyRequest,
  tenantId: string,
  fn: () => Promise<T> | T,
): Promise<T> {
  const resolved = await resolveTenantContextFromHttp(
    configManager,
    { headers: { "x-tenant-id": tenantId } },
    String(request.id),
  );
  if (!resolved.ok) {
    throw trpcErrorFromTenantSecurity(resolved.error);
  }
  return runWithTenantContext(resolved.context, fn);
}
