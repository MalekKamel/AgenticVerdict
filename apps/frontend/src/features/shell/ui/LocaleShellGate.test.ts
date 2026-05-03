import { describe, expect, it } from "vitest";

import { isAuthShellPath } from "./LocaleShellGate";

describe("isAuthShellPath", () => {
  it("returns true for locale-prefixed auth routes", () => {
    expect(isAuthShellPath("/en/auth/login")).toBe(true);
    expect(isAuthShellPath("/ar/auth/terms")).toBe(true);
    expect(isAuthShellPath("/en/auth/verify-email")).toBe(true);
  });

  it("returns false outside auth", () => {
    expect(isAuthShellPath("/en/dashboard")).toBe(false);
    expect(isAuthShellPath("/en/")).toBe(false);
    expect(isAuthShellPath("/en")).toBe(false);
  });
});
