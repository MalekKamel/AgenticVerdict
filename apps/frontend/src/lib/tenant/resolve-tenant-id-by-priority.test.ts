import { describe, expect, it } from "vitest";

import { isTenantUuid, resolveTenantIdByPriority } from "./resolve-tenant-id-by-priority";

describe("resolve-tenant-id-by-priority", () => {
  it("returns first valid tenant UUID in candidate order", () => {
    expect(
      resolveTenantIdByPriority(
        "not-a-uuid",
        "11111111-1111-4111-8111-111111111111",
        "22222222-2222-4222-8222-222222222222",
      ),
    ).toBe("11111111-1111-4111-8111-111111111111");
  });

  it("returns undefined when no valid UUID candidates exist", () => {
    expect(resolveTenantIdByPriority(undefined, "", "invalid")).toBeUndefined();
  });

  it("validates UUID format", () => {
    expect(isTenantUuid("11111111-1111-4111-8111-111111111111")).toBe(true);
    expect(isTenantUuid("abc")).toBe(false);
  });
});
