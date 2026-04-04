import { describe, expect, it } from "vitest";

import { suggestSlugFromCompanyName, tenantScopedCacheKey } from "../src/index";

describe("tenantScopedCacheKey", () => {
  it("prefixes tenant and escapes colons in segments", () => {
    expect(tenantScopedCacheKey("t1", "metrics", "a:b")).toBe("t:t1:metrics:a_b");
  });
});

describe("suggestSlugFromCompanyName", () => {
  it("slugifies names", () => {
    expect(suggestSlugFromCompanyName("Northwind Analytics!")).toBe("northwind-analytics");
  });
});
