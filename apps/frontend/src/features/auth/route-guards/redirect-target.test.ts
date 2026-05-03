import { describe, expect, it } from "vitest";

import { buildProtectedRedirectTarget, resolvePublicAuthRedirectTarget } from "./redirect-target";

describe("route guard redirect target helpers", () => {
  it("builds protected redirect target from locale-stripped pathname and search", () => {
    expect(
      buildProtectedRedirectTarget({
        pathname: "/en/dashboard/reports",
        search: { tab: "weekly", filter: "top" },
      }),
    ).toBe("/dashboard/reports?tab=weekly&filter=top");
  });

  it("falls back to root when pathname only contains locale", () => {
    expect(
      buildProtectedRedirectTarget({
        pathname: "/en",
        search: {},
      }),
    ).toBe("/");
  });

  it("sanitizes public auth redirect target for unsafe or loop-prone values", () => {
    expect(resolvePublicAuthRedirectTarget(undefined)).toBe("/dashboard");
    expect(resolvePublicAuthRedirectTarget("https://evil.example")).toBe("/dashboard");
    expect(resolvePublicAuthRedirectTarget("//evil.example")).toBe("/dashboard");
    expect(resolvePublicAuthRedirectTarget("/auth/login")).toBe("/dashboard");
    expect(resolvePublicAuthRedirectTarget("/dashboard/reports")).toBe("/dashboard/reports");
  });
});
