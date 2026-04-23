import { describe, expect, it } from "vitest";

import {
  assertOptionalTenantHintsMatchResolvedTenant,
  isTenantUuid,
  parseOptionalTenantId,
  readOptionalTenantIdHeader,
  resolveRequiredTenantIdFromHints,
} from "./public-tenant-resolution";
import { TenantSecurityError } from "./tenant-security-error";

const TENANT = "11111111-1111-4111-8111-111111111111";
const OTHER = "22222222-2222-4222-8222-222222222222";

describe("public-tenant-resolution", () => {
  it("validates tenant UUID strings", () => {
    expect(isTenantUuid(TENANT)).toBe(true);
    expect(isTenantUuid("not-a-uuid")).toBe(false);
  });

  it("parses optional tenant id", () => {
    expect(parseOptionalTenantId(` ${TENANT} `, "tenantId")).toBe(TENANT);
    expect(parseOptionalTenantId("", "tenantId")).toBeUndefined();
  });

  it("rejects invalid optional tenant id", () => {
    expect(() => parseOptionalTenantId("abc", "tenantId")).toThrow(TenantSecurityError);
  });

  it("reads x-tenant-id header when valid", () => {
    expect(readOptionalTenantIdHeader({ "x-tenant-id": TENANT })).toBe(TENANT);
  });

  it("resolves required tenant id from input/header hints", () => {
    expect(resolveRequiredTenantIdFromHints({ inputTenantId: TENANT })).toBe(TENANT);
    expect(resolveRequiredTenantIdFromHints({ headerTenantId: TENANT })).toBe(TENANT);
  });

  it("rejects missing tenant id for required resolution", () => {
    expect(() => resolveRequiredTenantIdFromHints({})).toThrow(TenantSecurityError);
  });

  it("rejects mismatched tenant hints", () => {
    expect(() =>
      resolveRequiredTenantIdFromHints({ inputTenantId: TENANT, headerTenantId: OTHER }),
    ).toThrow(TenantSecurityError);
  });

  it("asserts optional hints against resolved tenant", () => {
    expect(() =>
      assertOptionalTenantHintsMatchResolvedTenant({
        inputTenantId: TENANT,
        resolvedTenantId: TENANT,
      }),
    ).not.toThrow();
    expect(() =>
      assertOptionalTenantHintsMatchResolvedTenant({
        inputTenantId: OTHER,
        resolvedTenantId: TENANT,
      }),
    ).toThrow(TenantSecurityError);
  });
});
