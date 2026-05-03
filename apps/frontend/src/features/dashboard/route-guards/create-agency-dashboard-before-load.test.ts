import { describe, it, expect, vi, beforeEach } from "vitest";
import { redirect } from "@tanstack/react-router";
import { createAgencyDashboardBeforeLoad } from "./create-agency-dashboard-before-load";

vi.mock("@/features/auth/route-guards/create-protected-before-load", () => ({
  createProtectedBeforeLoad: vi.fn(() => vi.fn()),
}));

vi.mock("@tanstack/react-router", () => ({
  redirect: vi.fn(),
}));

const mockFetchProtectedRouteSession = vi.fn();

vi.mock("@/features/auth/model/protected-route-session", () => ({
  fetchProtectedRouteSession: (...args: unknown[]) => mockFetchProtectedRouteSession(...args),
}));

function verifiedAgencySession(
  overrides: Partial<{ tenantType: string; tenantStatus: string }> = {},
) {
  return {
    authState: {
      kind: "authenticated_verified" as const,
      user: {
        id: "u1",
        email: "user@example.com",
        firstName: "User",
        lastName: "Example",
        emailVerified: true,
        tenantId: "11111111-1111-4111-8111-111111111111",
        tenantType: overrides.tenantType ?? "agency_partner",
        tenantStatus: overrides.tenantStatus ?? "active",
        roles: [] as string[],
        permissions: [] as string[],
      },
    },
  };
}

describe("createAgencyDashboardBeforeLoad", () => {
  const mockRedirect = vi.mocked(redirect);

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchProtectedRouteSession.mockResolvedValue(verifiedAgencySession());
  });

  it("should redirect to dashboard when tenantType is not agency_partner", async () => {
    mockFetchProtectedRouteSession.mockResolvedValue(
      verifiedAgencySession({ tenantType: "direct_business", tenantStatus: "active" }),
    );

    const guard = createAgencyDashboardBeforeLoad();
    const ctx = { params: { locale: "en" } };

    await expect(guard(ctx as unknown as Parameters<typeof guard>[0])).rejects.toThrow();
    expect(mockRedirect).toHaveBeenCalledWith({
      to: "/$locale/dashboard",
      params: { locale: "en" },
      replace: true,
    });
  });

  it("should redirect to dashboard when tenantStatus is not active", async () => {
    mockFetchProtectedRouteSession.mockResolvedValue(
      verifiedAgencySession({ tenantStatus: "suspended" }),
    );

    const guard = createAgencyDashboardBeforeLoad();
    const ctx = { params: { locale: "en" } };

    await expect(guard(ctx as unknown as Parameters<typeof guard>[0])).rejects.toThrow();
    expect(mockRedirect).toHaveBeenCalledWith({
      to: "/$locale/dashboard",
      params: { locale: "en" },
      replace: true,
    });
  });

  it("should redirect to dashboard when tenantStatus is onboarding", async () => {
    mockFetchProtectedRouteSession.mockResolvedValue(
      verifiedAgencySession({ tenantStatus: "onboarding" }),
    );

    const guard = createAgencyDashboardBeforeLoad();
    const ctx = { params: { locale: "en" } };

    await expect(guard(ctx as unknown as Parameters<typeof guard>[0])).rejects.toThrow();
    expect(mockRedirect).toHaveBeenCalledWith({
      to: "/$locale/dashboard",
      params: { locale: "en" },
      replace: true,
    });
  });

  it("should not redirect when tenantType is agency_partner and status is active", async () => {
    const guard = createAgencyDashboardBeforeLoad();
    const ctx = { params: { locale: "en" } };

    await expect(guard(ctx as unknown as Parameters<typeof guard>[0])).resolves.not.toThrow();
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it("should have correct guard factory kind", () => {
    const guard = createAgencyDashboardBeforeLoad();
    expect((guard as unknown as { __routeGuardFactoryKind?: string }).__routeGuardFactoryKind).toBe(
      "protected",
    );
  });
});
