import { afterAll, beforeAll, describe, expect, it } from "vitest";
import Fastify from "fastify";
import { SignJWT } from "jose";

import { jwtAuth } from "./auth";

const JWT_SECRET = "test-jwt-secret-for-auth-mw-32ch";
const TENANT = "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb";

describe("jwtAuth middleware", () => {
  let app: Awaited<ReturnType<typeof buildApp>>;
  let analystToken: string;

  async function buildApp() {
    const instance = Fastify({ logger: false });
    instance.get(
      "/protected",
      { preHandler: jwtAuth({ required: true, roles: ["admin"] }) },
      async () => ({ ok: true as const }),
    );
    await instance.ready();
    return instance;
  }

  beforeAll(async () => {
    process.env.JWT_SECRET = JWT_SECRET;
    app = await buildApp();
    analystToken = await new SignJWT({ tenant_id: TENANT, roles: ["analyst"] })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("user-analyst-1")
      .setIssuedAt()
      .setExpirationTime("2h")
      .sign(new TextEncoder().encode(JWT_SECRET));
  });

  afterAll(async () => {
    await app.close();
  });

  it("returns 403 when required role is missing", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/protected",
      headers: { authorization: `Bearer ${analystToken}` },
    });
    expect(res.statusCode).toBe(403);
    const body = res.json() as { error: { code: string } };
    expect(body.error.code).toBe("forbidden");
  });
});
