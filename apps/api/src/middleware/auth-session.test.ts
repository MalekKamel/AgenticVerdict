import { describe, expect, it, beforeEach } from "vitest";
import { SignJWT } from "jose";

import { verifyBearerSessionFromRequest, resetJwtSecretCacheForTests } from "./auth";
import { SESSION_COOKIE_NAME } from "../lib/auth-session-cookie";

const JWT_SECRET = "test-jwt-secret-for-session-ck-32ch";
const TENANT = "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb";

describe("verifyBearerSessionFromRequest (bearer + session cookie)", () => {
  beforeEach(() => {
    resetJwtSecretCacheForTests();
    process.env.JWT_SECRET = JWT_SECRET;
  });

  it("accepts JWT from av_session cookie when Authorization is absent", async () => {
    const token = await new SignJWT({
      tenant_id: TENANT,
      tenant_type: "agency" as const,
      tenant_status: "active" as const,
      roles: [] as string[],
    })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("user-1")
      .setIssuedAt()
      .setExpirationTime("2h")
      .sign(new TextEncoder().encode(JWT_SECRET));

    const req = {
      headers: {
        cookie: `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`,
      },
    } as import("fastify").FastifyRequest;

    const session = await verifyBearerSessionFromRequest(req);
    expect(session?.auth.userId).toBe("user-1");
    expect(session?.auth.tenantId).toBe(TENANT);
  });
});
