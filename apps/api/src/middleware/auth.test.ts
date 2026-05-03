import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import Fastify from "fastify";
import { SignJWT } from "jose";

import { jwtAuth, resetJwtSecretCacheForTests } from "./auth";

const JWT_SECRET = "test-jwt-secret-for-auth-mw-32ch";
const TENANT = "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb";
const FILE_JWT_SECRET = "file-based-jwt-secret-32chars!!";

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

  beforeEach(() => {
    resetJwtSecretCacheForTests();
    delete process.env.JWT_SECRET_FILE;
    process.env.JWT_SECRET = JWT_SECRET;
  });

  beforeAll(async () => {
    process.env.JWT_SECRET = JWT_SECRET;
    app = await buildApp();
    analystToken = await new SignJWT({
      tenant_id: TENANT,
      tenant_type: "agency" as const,
      tenant_status: "active" as const,
      roles: ["analyst"],
    })
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

  describe("JWT_SECRET_FILE", () => {
    let secretPath: string;
    let secretDir: string;

    beforeEach(() => {
      resetJwtSecretCacheForTests();
      secretDir = mkdtempSync(join(tmpdir(), "av-jwt-"));
      secretPath = join(secretDir, "jwt");
      writeFileSync(secretPath, `${FILE_JWT_SECRET}\n`, { encoding: "utf8", mode: 0o600 });
      delete process.env.JWT_SECRET;
      process.env.JWT_SECRET_FILE = secretPath;
    });

    afterEach(() => {
      resetJwtSecretCacheForTests();
      delete process.env.JWT_SECRET_FILE;
      process.env.JWT_SECRET = JWT_SECRET;
      try {
        rmSync(secretDir, { recursive: true, force: true });
      } catch {
        /* temp dir cleanup best-effort */
      }
    });

    it("accepts HS256 tokens signed with secret read from JWT_SECRET_FILE (trimmed)", async () => {
      const localApp = await buildApp();
      const adminTok = await new SignJWT({
        tenant_id: TENANT,
        tenant_type: "agency" as const,
        tenant_status: "active" as const,
        roles: ["admin"],
      })
        .setProtectedHeader({ alg: "HS256" })
        .setSubject("user-admin-file")
        .setIssuedAt()
        .setExpirationTime("2h")
        .sign(new TextEncoder().encode(FILE_JWT_SECRET));
      const res = await localApp.inject({
        method: "GET",
        url: "/protected",
        headers: { authorization: `Bearer ${adminTok}` },
      });
      expect(res.statusCode).toBe(200);
      await localApp.close();
    });

    it("prefers JWT_SECRET_FILE over JWT_SECRET when both are set", async () => {
      process.env.JWT_SECRET = "wrong-jwt-secret-env-not-used-32ch";
      const localApp = await buildApp();
      const adminTok = await new SignJWT({
        tenant_id: TENANT,
        tenant_type: "agency" as const,
        tenant_status: "active" as const,
        roles: ["admin"],
      })
        .setProtectedHeader({ alg: "HS256" })
        .setSubject("user-admin-pref")
        .setIssuedAt()
        .setExpirationTime("2h")
        .sign(new TextEncoder().encode(FILE_JWT_SECRET));
      const res = await localApp.inject({
        method: "GET",
        url: "/protected",
        headers: { authorization: `Bearer ${adminTok}` },
      });
      expect(res.statusCode).toBe(200);
      await localApp.close();
    });

    it("returns 500 when JWT_SECRET_FILE content is shorter than 8 characters", async () => {
      resetJwtSecretCacheForTests();
      writeFileSync(secretPath, "short", { encoding: "utf8" });
      const localApp = await buildApp();
      const adminTok = await new SignJWT({
        tenant_id: TENANT,
        tenant_type: "agency" as const,
        tenant_status: "active" as const,
        roles: ["admin"],
      })
        .setProtectedHeader({ alg: "HS256" })
        .setSubject("user-admin-short")
        .setIssuedAt()
        .setExpirationTime("2h")
        .sign(new TextEncoder().encode(FILE_JWT_SECRET));
      const res = await localApp.inject({
        method: "GET",
        url: "/protected",
        headers: { authorization: `Bearer ${adminTok}` },
      });
      expect(res.statusCode).toBe(500);
      await localApp.close();
    });
  });
});
