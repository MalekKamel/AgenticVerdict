import { describe, expect, it } from "vitest";

import { parseDashboardParentSearch, sanitizeDashboardReturnTarget } from "./dashboard-search";

describe("sanitizeDashboardReturnTarget", () => {
  it("returns undefined for external URLs", () => {
    expect(sanitizeDashboardReturnTarget("https://evil.example")).toBeUndefined();
  });

  it("allows dashboard subtree paths", () => {
    expect(sanitizeDashboardReturnTarget("/dashboard/marketing")).toBe("/dashboard/marketing");
  });

  it("rejects auth paths even if prefixed oddly", () => {
    expect(sanitizeDashboardReturnTarget("/auth/login")).toBeUndefined();
  });
});

describe("parseDashboardParentSearch", () => {
  it("sanitizes returnTo from raw search", () => {
    expect(parseDashboardParentSearch({ returnTo: "/dashboard/agency" })).toEqual({
      returnTo: "/dashboard/agency",
    });
  });

  it("drops unsafe returnTo values", () => {
    expect(parseDashboardParentSearch({ returnTo: "https://evil.example" })).toEqual({
      returnTo: undefined,
    });
  });
});
