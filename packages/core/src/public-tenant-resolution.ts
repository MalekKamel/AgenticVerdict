import { TenantSecurityError } from "./tenant-security-error";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isTenantUuid(value: string | null | undefined): value is string {
  return typeof value === "string" && UUID_RE.test(value.trim());
}

function firstHeaderValue(raw: string | string[] | undefined): string | undefined {
  if (Array.isArray(raw)) {
    return raw[0];
  }
  return raw;
}

export function parseOptionalTenantId(
  value: string | null | undefined,
  sourceLabel: string,
): string | undefined {
  if (value == null) {
    return undefined;
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return undefined;
  }
  if (!isTenantUuid(trimmed)) {
    throw new TenantSecurityError("INVALID_TENANT_ID", `${sourceLabel} must be a valid UUID`, 400);
  }
  return trimmed;
}

export function readOptionalTenantIdHeader(
  headers: Record<string, string | string[] | undefined>,
): string | undefined {
  return parseOptionalTenantId(firstHeaderValue(headers["x-tenant-id"]), "x-tenant-id header");
}

export function resolveRequiredTenantIdFromHints(hints: {
  headerTenantId?: string;
  inputTenantId?: string;
}): string {
  if (hints.headerTenantId && hints.inputTenantId && hints.headerTenantId !== hints.inputTenantId) {
    throw new TenantSecurityError(
      "TENANT_MISMATCH",
      "tenantId in request body does not match x-tenant-id header",
      400,
    );
  }
  const resolved = hints.inputTenantId ?? hints.headerTenantId;
  if (!resolved) {
    throw new TenantSecurityError(
      "TENANT_CONTEXT_REQUIRED",
      "A valid tenant id is required in the request body (tenantId) or x-tenant-id header",
      400,
    );
  }
  return resolved;
}

export function assertOptionalTenantHintsMatchResolvedTenant(hints: {
  headerTenantId?: string;
  inputTenantId?: string;
  resolvedTenantId: string;
}): void {
  if (hints.inputTenantId && hints.headerTenantId && hints.inputTenantId !== hints.headerTenantId) {
    throw new TenantSecurityError(
      "TENANT_MISMATCH",
      "tenantId in request body does not match x-tenant-id header",
      400,
    );
  }
  const hint = hints.inputTenantId ?? hints.headerTenantId;
  if (hint && hint !== hints.resolvedTenantId) {
    throw new TenantSecurityError(
      "TENANT_MISMATCH",
      "Tenant hint does not match the account for this reset token",
      400,
    );
  }
}
