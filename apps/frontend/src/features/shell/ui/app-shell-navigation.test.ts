import { describe, it, expect } from "vitest";
import {
  filterAppShellNavItems,
  getHighPriorityPrefetchPaths,
  APP_SHELL_NAV_ITEMS,
} from "./app-shell-navigation";
import { PERMISSIONS } from "@agenticverdict/types";

describe("app-shell-navigation", () => {
  describe("APP_SHELL_NAV_ITEMS", () => {
    it("should include insights nav item", () => {
      const insightsItem = APP_SHELL_NAV_ITEMS.find((item) => item.id === "insights");
      expect(insightsItem).toBeDefined();
      expect(insightsItem?.href).toBe("/dashboard/insights");
      expect(insightsItem?.requiredPermissions).toEqual([PERMISSIONS.INSIGHTS_READ]);
    });

    it("should include reports nav item", () => {
      const reportsItem = APP_SHELL_NAV_ITEMS.find((item) => item.id === "reports");
      expect(reportsItem).toBeDefined();
      expect(reportsItem?.href).toBe("/dashboard/reports");
      expect(reportsItem?.requiredPermissions).toEqual([PERMISSIONS.REPORTS_READ]);
    });

    it("should order insights after connectors and before agency", () => {
      const ids = APP_SHELL_NAV_ITEMS.map((item) => item.id);
      const connectorsIndex = ids.indexOf("connectors");
      const insightsIndex = ids.indexOf("insights");
      const agencyIndex = ids.indexOf("agency");

      expect(insightsIndex).toBeGreaterThan(connectorsIndex);
      expect(agencyIndex).toBeGreaterThan(insightsIndex);
    });
  });

  describe("filterAppShellNavItems", () => {
    it("should filter insights when user lacks INSIGHTS_READ permission", () => {
      const context = {
        roles: ["member" as const],
        permissions: [],
        isAgencyPartner: false,
      };

      const filtered = filterAppShellNavItems(APP_SHELL_NAV_ITEMS, context);
      const insightsVisible = filtered.some((item) => item.id === "insights");

      expect(insightsVisible).toBe(false);
    });

    it("should show insights when user has INSIGHTS_READ permission", () => {
      const context = {
        roles: ["member" as const],
        permissions: [PERMISSIONS.INSIGHTS_READ],
        isAgencyPartner: false,
      };

      const filtered = filterAppShellNavItems(APP_SHELL_NAV_ITEMS, context);
      const insightsVisible = filtered.some((item) => item.id === "insights");

      expect(insightsVisible).toBe(true);
    });

    it("should filter reports when user lacks REPORTS_READ permission", () => {
      const context = {
        roles: ["member" as const],
        permissions: [],
        isAgencyPartner: false,
      };

      const filtered = filterAppShellNavItems(APP_SHELL_NAV_ITEMS, context);
      const reportsVisible = filtered.some((item) => item.id === "reports");

      expect(reportsVisible).toBe(false);
    });

    it("should show reports when user has REPORTS_READ permission", () => {
      const context = {
        roles: ["member" as const],
        permissions: [PERMISSIONS.REPORTS_READ],
        isAgencyPartner: false,
      };

      const filtered = filterAppShellNavItems(APP_SHELL_NAV_ITEMS, context);
      const reportsVisible = filtered.some((item) => item.id === "reports");

      expect(reportsVisible).toBe(true);
    });
  });

  describe("getHighPriorityPrefetchPaths", () => {
    it("should include insights path in high priority prefetch", () => {
      const paths = getHighPriorityPrefetchPaths(APP_SHELL_NAV_ITEMS);
      expect(paths).toContain("/dashboard/insights");
    });

    it("should NOT include reports path in high priority prefetch", () => {
      const paths = getHighPriorityPrefetchPaths(APP_SHELL_NAV_ITEMS);
      expect(paths).not.toContain("/dashboard/reports");
    });
  });
});
