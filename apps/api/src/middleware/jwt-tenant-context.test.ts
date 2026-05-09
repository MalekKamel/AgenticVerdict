import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import Fastify from "fastify";
import { SignJWT } from "jose";

import { getTenantContext } from "@agenticverdict/core";

import { jwtAuth, resetJwtSecretCacheForTests } from "./auth";
import { bindJwtTenantAsyncContext } from "./jwt-tenant-context";
import { registerTenantAlsRouteWrapping } from "./tenant-route-als";

const JWT_SECRET = "test-jwt-secret-tenant-ctx-mw-32chars";
const TENANT = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";

describe("bindJwtTenantAsyncContext middleware", () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  async function buildApp() {
    const instance = Fastify({ logger: false, genReqId: () => "req-tenant-ctx-1" });
    registerTenantAlsRouteWrapping(instance);
    instance.get(
      "/ctx",
      { preHandler: [jwtAuth({ required: true }), bindJwtTenantAsyncContext()] },
      async (request) => {
        const ctx = getTenantContext();
        return {
          tenantId: ctx?.tenantId,
          requestId: ctx?.requestId,
          configTenantId: ctx?.config.tenantId,
          matchesAuthTenant: ctx?.tenantId === request.auth?.tenantId,
        };
      },
    );
    await instance.ready();
    return instance;
  }

  beforeAll(async () => {
    process.env.JWT_SECRET = JWT_SECRET;
    app = await buildApp();
  });

  beforeEach(() => {
    resetJwtSecretCacheForTests();
  });

  afterAll(async () => {
    await app.close();
  });

  it("binds AsyncLocalStorage tenant context for the route handler", async () => {
    const token = await new SignJWT({
      tenant_id: TENANT,
      tenant_type: "agency" as const,
      tenant_status: "active" as const,
      roles: ["analyst"],
    })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("sub-tenant-ctx")
      .setIssuedAt()
      .setExpirationTime("2h")
      .sign(new TextEncoder().encode(JWT_SECRET));

    const res = await app.inject({
      method: "GET",
      url: "/ctx",
      headers: { authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json() as {
      tenantId: string;
      requestId: string;
      configTenantId: string;
      matchesAuthTenant: boolean;
    };
    expect(body.tenantId).toBe(TENANT);
    expect(body.configTenantId).toBe(TENANT);
    expect(body.matchesAuthTenant).toBe(true);
    expect(body.requestId).toBe("req-tenant-ctx-1");
  });

  it("returns 403 when x-tenant-id header disagrees with JWT tenant_id", async () => {
    const otherTenant = "bbbbbbbb-bbbb-4ccc-dddd-ffffffffffff";
    const token = await new SignJWT({
      tenant_id: TENANT,
      tenant_type: "agency" as const,
      tenant_status: "active" as const,
      roles: ["analyst"],
    })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("sub-tenant-ctx")
      .setIssuedAt()
      .setExpirationTime("2h")
      .sign(new TextEncoder().encode(JWT_SECRET));

    const res = await app.inject({
      method: "GET",
      url: "/ctx",
      headers: {
        authorization: `Bearer ${token}`,
        "x-tenant-id": otherTenant,
      },
    });

    expect(res.statusCode).toBe(403);
    const body = res.json() as { error?: { code?: string } };
    expect(body.error?.code).toBe("tenant_mismatch");
  });

  it("returns 403 when tenant config is missing for the JWT tenant", async () => {
    const unknownTenant = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
    const token = await new SignJWT({
      tenant_id: unknownTenant,
      tenant_type: "agency" as const,
      tenant_status: "active" as const,
      roles: ["analyst"],
    })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("sub-unknown-tenant")
      .setIssuedAt()
      .setExpirationTime("2h")
      .sign(new TextEncoder().encode(JWT_SECRET));

    const res = await app.inject({
      method: "GET",
      url: "/ctx",
      headers: { authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(403);
    const body = res.json() as { error?: { code?: string } };
    expect(body.error?.code).toBe("tenant_config_not_found");
  });
});
