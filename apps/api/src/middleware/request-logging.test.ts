import { describe, expect, it } from "vitest";
import type { FastifyRequest } from "fastify";
import type { TenantContext } from "@agenticverdict/core";

import { getHttpAccessLogTenantId } from "./request-logging";

const T = "11111111-1111-4111-8111-111111111111";

function req(
  partial: Partial<FastifyRequest> & { headers?: Record<string, string> },
): FastifyRequest {
  return partial as FastifyRequest;
}

function fakeTenant(tenantId: string): TenantContext {
  return {
    tenantId,
    tenantType: "direct_business",
    tenantStatus: "active",
    requestId: "r1",
    config: { tenantId: tenantId } as TenantContext["config"],
  };
}

describe("getHttpAccessLogTenantId", () => {
  it("prefers auth tenant", () => {
    expect(
      getHttpAccessLogTenantId(
        req({
          auth: {
            userId: "u",
            tenantId: T,
            tenantType: "direct_business",
            tenantStatus: "active",
            roles: [],
            permissions: [],
          },
          headers: { "x-tenant-id": "00000000-0000-4000-8000-000000000000" },
        }),
      ),
    ).toBe(T);
  });

  it("uses tenantContext when no auth", () => {
    expect(
      getHttpAccessLogTenantId(
        req({
          tenantContext: fakeTenant(T),
        }),
      ),
    ).toBe(T);
  });

  it("accepts a valid x-tenant-id hint", () => {
    expect(
      getHttpAccessLogTenantId(
        req({
          headers: { "x-tenant-id": T },
        }),
      ),
    ).toBe(T);
  });

  it("ignores non-uuid x-tenant-id", () => {
    expect(
      getHttpAccessLogTenantId(
        req({
          headers: { "x-tenant-id": "not-a-uuid" },
        }),
      ),
    ).toBeUndefined();
  });
});
