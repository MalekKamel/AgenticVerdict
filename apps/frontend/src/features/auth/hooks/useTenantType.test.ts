import { describe, it, expect } from "vitest";
import { computeCapabilities } from "./useTenantType";

describe("computeCapabilities", () => {
  describe("agency_partner tenant type", () => {
    it("should return full capabilities when status is active", () => {
      const capabilities = computeCapabilities("agency_partner", "active");

      expect(capabilities.canAccessAgencyDashboard).toBe(true);
      expect(capabilities.canManageClientTenants).toBe(true);
      expect(capabilities.canCreateInsights).toBe(true);
      expect(capabilities.canManageConnectors).toBe(true);
      expect(capabilities.canViewReports).toBe(true);
      expect(capabilities.canWhiteLabelReports).toBe(true);
      expect(capabilities.canSwitchClientContext).toBe(true);
    });

    it("should return false for all capabilities when status is onboarding", () => {
      const capabilities = computeCapabilities("agency_partner", "onboarding");

      expect(capabilities.canAccessAgencyDashboard).toBe(false);
      expect(capabilities.canManageClientTenants).toBe(false);
      expect(capabilities.canCreateInsights).toBe(false);
      expect(capabilities.canManageConnectors).toBe(false);
      expect(capabilities.canViewReports).toBe(false);
      expect(capabilities.canWhiteLabelReports).toBe(false);
      expect(capabilities.canSwitchClientContext).toBe(false);
    });

    it("should return false for all capabilities when status is suspended", () => {
      const capabilities = computeCapabilities("agency_partner", "suspended");

      expect(capabilities.canAccessAgencyDashboard).toBe(false);
      expect(capabilities.canManageClientTenants).toBe(false);
      expect(capabilities.canCreateInsights).toBe(false);
    });

    it("should return false for all capabilities when status is restricted", () => {
      const capabilities = computeCapabilities("agency_partner", "restricted");

      expect(capabilities.canAccessAgencyDashboard).toBe(false);
      expect(capabilities.canManageClientTenants).toBe(false);
    });

    it("should return false for all capabilities when status is archived", () => {
      const capabilities = computeCapabilities("agency_partner", "archived");

      expect(capabilities.canAccessAgencyDashboard).toBe(false);
      expect(capabilities.canManageClientTenants).toBe(false);
    });
  });

  describe("direct_business tenant type", () => {
    it("should return limited capabilities when status is active", () => {
      const capabilities = computeCapabilities("direct_business", "active");

      expect(capabilities.canAccessAgencyDashboard).toBe(false);
      expect(capabilities.canManageClientTenants).toBe(false);
      expect(capabilities.canCreateInsights).toBe(true);
      expect(capabilities.canManageConnectors).toBe(true);
      expect(capabilities.canViewReports).toBe(true);
      expect(capabilities.canWhiteLabelReports).toBe(false);
      expect(capabilities.canSwitchClientContext).toBe(false);
    });

    it("should return false for all capabilities when status is not active", () => {
      const capabilities = computeCapabilities("direct_business", "suspended");

      expect(capabilities.canAccessAgencyDashboard).toBe(false);
      expect(capabilities.canManageClientTenants).toBe(false);
      expect(capabilities.canCreateInsights).toBe(false);
      expect(capabilities.canManageConnectors).toBe(false);
      expect(capabilities.canViewReports).toBe(false);
      expect(capabilities.canWhiteLabelReports).toBe(false);
      expect(capabilities.canSwitchClientContext).toBe(false);
    });
  });

  describe("agency_managed tenant type", () => {
    it("should return limited capabilities when status is active", () => {
      const capabilities = computeCapabilities("agency_managed", "active");

      expect(capabilities.canAccessAgencyDashboard).toBe(false);
      expect(capabilities.canManageClientTenants).toBe(false);
      expect(capabilities.canCreateInsights).toBe(true);
      expect(capabilities.canManageConnectors).toBe(true);
      expect(capabilities.canViewReports).toBe(true);
      expect(capabilities.canWhiteLabelReports).toBe(false);
      expect(capabilities.canSwitchClientContext).toBe(false);
    });

    it("should return false for all capabilities when status is not active", () => {
      const capabilities = computeCapabilities("agency_managed", "onboarding");

      expect(capabilities.canAccessAgencyDashboard).toBe(false);
      expect(capabilities.canCreateInsights).toBe(false);
      expect(capabilities.canManageConnectors).toBe(false);
    });
  });

  describe("null or undefined values", () => {
    it("should return false for all capabilities when tenantType is null", () => {
      const capabilities = computeCapabilities(null, "active");

      expect(capabilities.canAccessAgencyDashboard).toBe(false);
      expect(capabilities.canManageClientTenants).toBe(false);
      expect(capabilities.canCreateInsights).toBe(false);
    });

    it("should return false for all capabilities when tenantStatus is null", () => {
      const capabilities = computeCapabilities("agency_partner", null);

      expect(capabilities.canAccessAgencyDashboard).toBe(false);
      expect(capabilities.canManageClientTenants).toBe(false);
      expect(capabilities.canCreateInsights).toBe(false);
    });

    it("should return false for all capabilities when both are null", () => {
      const capabilities = computeCapabilities(null, null);

      expect(capabilities.canAccessAgencyDashboard).toBe(false);
      expect(capabilities.canManageClientTenants).toBe(false);
      expect(capabilities.canCreateInsights).toBe(false);
      expect(capabilities.canManageConnectors).toBe(false);
      expect(capabilities.canViewReports).toBe(false);
      expect(capabilities.canWhiteLabelReports).toBe(false);
      expect(capabilities.canSwitchClientContext).toBe(false);
    });
  });
});
