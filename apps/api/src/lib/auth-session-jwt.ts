import { SignJWT } from "jose";
import type { TenantType, TenantStatus } from "@agenticverdict/types";

const REMEMBER_MAX_SECONDS = 30 * 24 * 60 * 60;
const DEFAULT_MAX_SECONDS = 24 * 60 * 60;

export async function signSessionAccessToken(params: {
  userId: string;
  tenantId: string;
  tenantType: TenantType;
  tenantStatus: TenantStatus;
  rememberMe: boolean;
  secret: string;
  roles?: string[];
  permissions?: string[];
}): Promise<{ token: string; maxAgeSeconds: number; sessionExpiresAtIso: string }> {
  const maxAgeSeconds = params.rememberMe ? REMEMBER_MAX_SECONDS : DEFAULT_MAX_SECONDS;
  const secretBytes = new TextEncoder().encode(params.secret);
  const ttl = params.rememberMe ? "30d" : "24h";
  const token = await new SignJWT({
    tenant_id: params.tenantId,
    tenant_type: params.tenantType,
    tenant_status: params.tenantStatus,
    roles: params.roles ?? [],
    permissions: params.permissions ?? [],
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(params.userId)
    .setIssuedAt()
    .setExpirationTime(ttl)
    .sign(secretBytes);

  const expiresMs = Date.now() + maxAgeSeconds * 1000;
  return {
    token,
    maxAgeSeconds,
    sessionExpiresAtIso: new Date(expiresMs).toISOString(),
  };
}
