import { SignJWT } from "jose";

const REMEMBER_MAX_SECONDS = 30 * 24 * 60 * 60;
const DEFAULT_MAX_SECONDS = 24 * 60 * 60;

export async function signSessionAccessToken(params: {
  userId: string;
  tenantId: string;
  rememberMe: boolean;
  secret: string;
}): Promise<{ token: string; maxAgeSeconds: number; sessionExpiresAtIso: string }> {
  const maxAgeSeconds = params.rememberMe ? REMEMBER_MAX_SECONDS : DEFAULT_MAX_SECONDS;
  const secretBytes = new TextEncoder().encode(params.secret);
  const ttl = params.rememberMe ? "30d" : "24h";
  const token = await new SignJWT({ tenant_id: params.tenantId, roles: [] as string[] })
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
