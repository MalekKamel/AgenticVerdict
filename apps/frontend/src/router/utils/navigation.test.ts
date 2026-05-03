import { describe, it, expect } from "vitest";

import { withLocalePrefix, stripLocalePrefix } from "./navigation";

describe("withLocalePrefix", () => {
  it("should add locale prefix to root path", () => {
    expect(withLocalePrefix("en", "/")).toBe("/en");
  });

  it("should add locale prefix to paths without locale", () => {
    expect(withLocalePrefix("en", "/dashboard")).toBe("/en/dashboard");
    expect(withLocalePrefix("en", "dashboard")).toBe("/en/dashboard");
  });

  it("should not add locale prefix if already present", () => {
    expect(withLocalePrefix("en", "/en")).toBe("/en");
    expect(withLocalePrefix("en", "/en/dashboard")).toBe("/en/dashboard");
  });

  it("should handle different locales correctly", () => {
    expect(withLocalePrefix("fr", "/dashboard")).toBe("/fr/dashboard");
    expect(withLocalePrefix("es", "/auth/login")).toBe("/es/auth/login");
  });

  it("should replace existing locale prefix with new locale", () => {
    expect(withLocalePrefix("en", "/fr/dashboard")).toBe("/en/dashboard");
    expect(withLocalePrefix("fr", "/fr/auth")).toBe("/fr/auth");
  });
});

describe("stripLocalePrefix", () => {
  it("should strip locale prefix from path", () => {
    expect(stripLocalePrefix("/en/dashboard", "en")).toBe("/dashboard");
    expect(stripLocalePrefix("/fr/auth/login", "fr")).toBe("/auth/login");
  });

  it("should return root when path is exactly locale prefix", () => {
    expect(stripLocalePrefix("/en", "en")).toBe("/");
    expect(stripLocalePrefix("/en/", "en")).toBe("/");
  });

  it("should return path unchanged if no locale prefix", () => {
    expect(stripLocalePrefix("/dashboard", "en")).toBe("/dashboard");
    expect(stripLocalePrefix("/auth/login", "en")).toBe("/auth/login");
  });

  it("should handle trailing slash correctly", () => {
    expect(stripLocalePrefix("/en/", "en")).toBe("/");
    expect(stripLocalePrefix("/en/dashboard/", "en")).toBe("/dashboard/");
  });
});
