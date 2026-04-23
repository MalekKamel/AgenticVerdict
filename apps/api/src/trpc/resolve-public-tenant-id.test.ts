import { TRPCError } from "@trpc/server";
import { describe, expect, it } from "vitest";

import { TenantSecurityError } from "@agenticverdict/core";

import {
  assertOptionalPublicTenantMatchesTenant,
  resolvePublicTenantId,
  trpcErrorFromTenantSecurity,
} from "./resolve-public-tenant-id";

const TENANT = "11111111-1111-4111-8111-111111111111";
const OTHER = "22222222-2222-4222-8222-222222222222";

function makeReq(headers: Record<string, string | undefined>): {
  headers: Record<string, string | string[] | undefined>;
} {
  return { headers };
}

describe("resolvePublicTenantId", () => {
  it("returns tenantId from body when header absent", () => {
    expect(resolvePublicTenantId(makeReq({}) as never, { tenantId: TENANT })).toBe(TENANT);
  });

  it("returns tenantId from header when body absent", () => {
    expect(resolvePublicTenantId(makeReq({ "x-tenant-id": TENANT }) as never, {})).toBe(TENANT);
  });

  it("returns shared value when body and header match", () => {
    expect(
      resolvePublicTenantId(makeReq({ "x-tenant-id": TENANT }) as never, { tenantId: TENANT }),
    ).toBe(TENANT);
  });

  it("throws TRPCError with TENANT_MISMATCH when body and header differ", () => {
    expect(() =>
      resolvePublicTenantId(makeReq({ "x-tenant-id": TENANT }) as never, { tenantId: OTHER }),
    ).toThrow(TRPCError);
    try {
      resolvePublicTenantId(makeReq({ "x-tenant-id": TENANT }) as never, { tenantId: OTHER });
    } catch (e) {
      expect(e).toBeInstanceOf(TRPCError);
      const cause = (e as TRPCError).cause as TenantSecurityError;
      expect(cause.code).toBe("TENANT_MISMATCH");
    }
  });

  it("throws TRPCError with TENANT_CONTEXT_REQUIRED when neither hint is valid", () => {
    expect(() => resolvePublicTenantId(makeReq({}) as never, {})).toThrow(TRPCError);
    try {
      resolvePublicTenantId(makeReq({}) as never, {});
    } catch (e) {
      const cause = (e as TRPCError).cause as TenantSecurityError;
      expect(cause.code).toBe("TENANT_CONTEXT_REQUIRED");
    }
  });

  it("maps TenantSecurityError to TRPCError with cause for formatter", () => {
    const inner = new TenantSecurityError("TENANT_CONTEXT_REQUIRED", "missing", 400);
    const err = trpcErrorFromTenantSecurity(inner);
    expect(err.cause).toBe(inner);
    expect(err.code).toBe("BAD_REQUEST");
  });
});

describe("assertOptionalPublicTenantMatchesTenant", () => {
  it("allows absent hints", () => {
    expect(() =>
      assertOptionalPublicTenantMatchesTenant(makeReq({}) as never, {}, TENANT),
    ).not.toThrow();
  });

  it("allows matching hint", () => {
    expect(() =>
      assertOptionalPublicTenantMatchesTenant(
        makeReq({ "x-tenant-id": TENANT }) as never,
        {},
        TENANT,
      ),
    ).not.toThrow();
  });

  it("rejects hint that does not match tenant", () => {
    expect(() =>
      assertOptionalPublicTenantMatchesTenant(
        makeReq({ "x-tenant-id": OTHER }) as never,
        {},
        TENANT,
      ),
    ).toThrow(TRPCError);
  });
});
