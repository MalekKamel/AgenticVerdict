import { describe, it, expect } from "vitest";
import { filterAppShellNavItems, APP_SHELL_NAV_ITEMS } from "./app-shell-navigation";

describe("filterAppShellNavItems", () => {
  it("should return all items for admin user without agency partner flag", () => {
    const filtered = filterAppShellNavItems(APP_SHELL_NAV_ITEMS, {
      roles: ["admin", "member"],
      permissions: [],
      isAgencyPartner: false,
    });

    expect(filtered.some((item) => item.id === "home")).toBe(true);
    expect(filtered.some((item) => item.id === "dashboard")).toBe(true);
    expect(filtered.some((item) => item.id === "agency")).toBe(false);
  });

  it("should include agency nav item for agency partner user", () => {
    const filtered = filterAppShellNavItems(APP_SHELL_NAV_ITEMS, {
      roles: ["member"],
      permissions: [],
      isAgencyPartner: true,
    });

    expect(filtered.some((item) => item.id === "agency")).toBe(true);
  });

  it("should exclude agency nav item for non-agency partner user", () => {
    const filtered = filterAppShellNavItems(APP_SHELL_NAV_ITEMS, {
      roles: ["member"],
      permissions: [],
      isAgencyPartner: false,
    });

    expect(filtered.some((item) => item.id === "agency")).toBe(false);
  });

  it("should exclude agency nav item when isAgencyPartner is undefined", () => {
    const filtered = filterAppShellNavItems(APP_SHELL_NAV_ITEMS, {
      roles: ["member"],
      permissions: [],
    });

    expect(filtered.some((item) => item.id === "agency")).toBe(false);
  });

  it("should exclude feature flags for non-admin users", () => {
    const filtered = filterAppShellNavItems(APP_SHELL_NAV_ITEMS, {
      roles: ["member"],
      permissions: [],
      isAgencyPartner: false,
    });

    expect(filtered.some((item) => item.id === "featureFlags")).toBe(false);
  });

  it("should include feature flags for admin users", () => {
    const filtered = filterAppShellNavItems(APP_SHELL_NAV_ITEMS, {
      roles: ["admin", "member"],
      permissions: [],
      isAgencyPartner: false,
    });

    expect(filtered.some((item) => item.id === "featureFlags")).toBe(true);
  });

  it("should respect permission requirements", () => {
    const filtered = filterAppShellNavItems(APP_SHELL_NAV_ITEMS, {
      roles: ["admin", "member"],
      permissions: [],
      isAgencyPartner: false,
    });

    expect(filtered.some((item) => item.id === "connectors")).toBe(false);
  });

  it("should include connectors when user has required permissions", () => {
    const filtered = filterAppShellNavItems(APP_SHELL_NAV_ITEMS, {
      roles: ["admin", "member"],
      permissions: ["connectors:read"],
      isAgencyPartner: false,
    });

    expect(filtered.some((item) => item.id === "connectors")).toBe(true);
  });
});
