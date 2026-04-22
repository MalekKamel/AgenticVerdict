import { describe, expect, it } from "vitest";

import { resolvePostLoginRedirect } from "./useLoginMutation";

describe("resolvePostLoginRedirect", () => {
  it("falls back to dashboard when redirect is missing", () => {
    expect(resolvePostLoginRedirect(null)).toBe("/dashboard");
  });

  it("falls back to dashboard for external or malformed redirects", () => {
    expect(resolvePostLoginRedirect("dashboard")).toBe("/dashboard");
    expect(resolvePostLoginRedirect("https://example.com")).toBe("/dashboard");
  });

  it("blocks auth-loop redirects", () => {
    expect(resolvePostLoginRedirect("/auth/login")).toBe("/dashboard");
    expect(resolvePostLoginRedirect("/auth/register")).toBe("/dashboard");
  });

  it("allows safe internal redirect targets", () => {
    expect(resolvePostLoginRedirect("/dashboard/reports")).toBe("/dashboard/reports");
    expect(resolvePostLoginRedirect("/settings")).toBe("/settings");
  });
});
