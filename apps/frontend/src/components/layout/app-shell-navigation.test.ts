import { describe, expect, it } from "vitest";

import {
  APP_SHELL_NAV_ITEMS,
  filterAppShellNavItems,
  getHighPriorityPrefetchPaths,
  isSafeShellPath,
  resolveShellNavigationTarget,
} from "./app-shell-navigation";

describe("filterAppShellNavItems", () => {
  it("keeps public items for member role", () => {
    const filtered = filterAppShellNavItems(APP_SHELL_NAV_ITEMS, { roles: ["member"] });

    expect(filtered.some((item) => item.id === "home")).toBe(true);
    expect(filtered.some((item) => item.id === "dashboard")).toBe(true);
  });

  it("does not expose admin-only items to member role", () => {
    const filtered = filterAppShellNavItems(APP_SHELL_NAV_ITEMS, { roles: ["member"] });
    const hasFeatureFlagsItem = filtered.some((item) => item.id === "featureFlags");

    expect(hasFeatureFlagsItem).toBe(false);
  });

  it("prefetches only high-priority safe paths", () => {
    const prefetchPaths = getHighPriorityPrefetchPaths(APP_SHELL_NAV_ITEMS);

    expect(prefetchPaths).toContain("/dashboard");
    expect(prefetchPaths).toContain("/onboarding");
    expect(prefetchPaths).not.toContain("/");
  });

  it("validates shell-safe navigation paths", () => {
    expect(isSafeShellPath("/dashboard")).toBe(true);
    expect(isSafeShellPath("dashboard")).toBe(false);
    expect(isSafeShellPath("//evil.example")).toBe(false);
  });

  it("falls back to dashboard when target is unsafe", () => {
    const resolved = resolveShellNavigationTarget(
      {
        id: "dashboard",
        href: "https://example.com",
        labelKey: "dashboard",
      },
      APP_SHELL_NAV_ITEMS,
    );

    expect(resolved).toBe("/dashboard");
  });
});
