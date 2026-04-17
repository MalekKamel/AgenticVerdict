import { describe, expect, it } from "vitest";

import { getEffectiveTenantId, isTenantUuid } from "./tenant-resolution";

describe("tenant-resolution", () => {
  it("validates UUID format for tenant ids", () => {
    expect(isTenantUuid("11111111-1111-4111-8111-111111111111")).toBe(true);
    expect(isTenantUuid("not-a-uuid")).toBe(false);
    expect(isTenantUuid(null)).toBe(false);
  });

  it("prefers auth tenant when it is a valid UUID", () => {
    expect(
      getEffectiveTenantId({
        authTenantId: "aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee",
      }),
    ).toBe("aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee");
  });

  it("uses slug-resolved tenant when auth tenant is absent", () => {
    expect(
      getEffectiveTenantId({
        slugResolvedTenantId: "11111111-1111-4111-8111-111111111111",
      }),
    ).toBe("11111111-1111-4111-8111-111111111111");
  });

  it("prefers auth tenant over slug-resolved tenant", () => {
    expect(
      getEffectiveTenantId({
        authTenantId: "aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee",
        slugResolvedTenantId: "11111111-1111-4111-8111-111111111111",
      }),
    ).toBe("aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee");
  });
});
