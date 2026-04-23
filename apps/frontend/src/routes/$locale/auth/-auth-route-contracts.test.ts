import { beforeEach, describe, expect, it, vi } from "vitest";

import { fetchProtectedRouteSession } from "@/lib/auth/protected-route-session";
import { Route as DashboardRoute } from "../dashboard";
import { Route as OnboardingRoute } from "../onboarding";
import { Route as ForgotPasswordRoute } from "./forgot-password";
import { Route as LoginRoute } from "./login";
import { Route as RegisterRoute } from "./register";
import { Route as VerifyEmailRoute } from "./verify-email";

vi.mock("@/lib/auth/protected-route-session", () => ({
  fetchProtectedRouteSession: vi.fn(),
}));

const mockedProtectedRouteSession = vi.mocked(fetchProtectedRouteSession);

function assertBeforeLoad(
  beforeLoad: unknown,
): asserts beforeLoad is (context: Record<string, unknown>) => Promise<void> {
  expect(typeof beforeLoad).toBe("function");
}

async function expectRedirectLocation(
  runBeforeLoad: Promise<void>,
  expectedLocation: string,
): Promise<void> {
  await expect(runBeforeLoad).rejects.toSatisfy((response: unknown) => {
    if (!(response instanceof Response)) {
      return false;
    }
    return response.headers.get("location") === expectedLocation;
  });
}

describe("auth route contracts", () => {
  beforeEach(() => {
    mockedProtectedRouteSession.mockReset();
  });

  it("validates login route query params", () => {
    const search = LoginRoute.options.validateSearch?.({
      redirect: "/dashboard/reports",
      session: "expired",
      oauth: "google",
      ignored: "value",
    });
    expect(search).toEqual({
      redirect: "/dashboard/reports",
      session: "expired",
      oauth: "google",
    });

    const invalidSearch = LoginRoute.options.validateSearch?.({
      redirect: "https://external.example.com",
      session: "other",
      oauth: "github",
    });
    expect(invalidSearch).toEqual({
      redirect: "https://external.example.com",
      session: undefined,
      oauth: undefined,
    });
  });

  it("validates register route query params", () => {
    const search = RegisterRoute.options.validateSearch?.({
      redirect: "/dashboard",
      type: "business",
      plan: "enterprise",
      invite: "invite-token",
      oauth: "microsoft",
      tenantId: "11111111-1111-4111-8111-111111111111",
    });
    expect(search).toEqual({
      redirect: "/dashboard",
      type: "business",
      plan: "enterprise",
      invite: "invite-token",
      oauth: "microsoft",
      tenantId: "11111111-1111-4111-8111-111111111111",
    });

    const invalidTenantSearch = RegisterRoute.options.validateSearch?.({
      tenantId: "invalid-tenant-id",
    });
    expect(invalidTenantSearch).toEqual({
      redirect: undefined,
      type: undefined,
      plan: undefined,
      invite: undefined,
      oauth: undefined,
      tenantId: undefined,
    });
  });

  it("validates verify-email route query params", () => {
    const search = VerifyEmailRoute.options.validateSearch?.({
      email: "user@example.com",
      redirect: "/dashboard",
      tenantId: "11111111-1111-4111-8111-111111111111",
      ignored: "value",
    });
    expect(search).toEqual({
      email: "user@example.com",
      redirect: "/dashboard",
      tenantId: "11111111-1111-4111-8111-111111111111",
    });
  });

  it("enforces shared route guard factories for guarded routes", () => {
    expect(DashboardRoute.options.beforeLoad).toHaveProperty(
      "__routeGuardFactoryKind",
      "protected",
    );
    expect(OnboardingRoute.options.beforeLoad).toHaveProperty(
      "__routeGuardFactoryKind",
      "protected",
    );
    expect(LoginRoute.options.beforeLoad).toHaveProperty("__routeGuardFactoryKind", "public_auth");
    expect(RegisterRoute.options.beforeLoad).toHaveProperty(
      "__routeGuardFactoryKind",
      "public_auth",
    );
    expect(ForgotPasswordRoute.options.beforeLoad).toHaveProperty(
      "__routeGuardFactoryKind",
      "public_auth",
    );
  });

  it("redirects authenticated users away from auth routes", async () => {
    mockedProtectedRouteSession.mockResolvedValue({
      authState: {
        kind: "authenticated_verified",
        user: {
          id: "user-1",
          email: "user@example.com",
          firstName: "User",
          lastName: "Example",
          emailVerified: true,
          tenantId: "11111111-1111-4111-8111-111111111111",
        },
      },
    });

    const beforeLoad = LoginRoute.options.beforeLoad;
    assertBeforeLoad(beforeLoad);

    await expectRedirectLocation(
      beforeLoad({
        params: { locale: "en" },
        search: { redirect: "/dashboard/reports" },
      }),
      "/en/dashboard/reports",
    );
  });

  it("redirects unauthenticated dashboard access to locale login with encoded redirect", async () => {
    mockedProtectedRouteSession.mockResolvedValue({
      authState: { kind: "anonymous" },
    });

    const beforeLoad = DashboardRoute.options.beforeLoad;
    assertBeforeLoad(beforeLoad);

    await expectRedirectLocation(
      beforeLoad({
        params: { locale: "en" },
        location: {
          pathname: "/en/dashboard/reports",
          search: { tab: "weekly" },
        },
      }),
      "/en/auth/login?redirect=%2Fdashboard%2Freports%3Ftab%3Dweekly",
    );
  });

  it("redirects unauthenticated onboarding access to locale login with encoded redirect", async () => {
    mockedProtectedRouteSession.mockResolvedValue({
      authState: { kind: "anonymous" },
    });

    const beforeLoad = OnboardingRoute.options.beforeLoad;
    assertBeforeLoad(beforeLoad);

    await expectRedirectLocation(
      beforeLoad({
        params: { locale: "en" },
        location: {
          pathname: "/en/onboarding",
          search: { step: "company" },
        },
      }),
      "/en/auth/login?redirect=%2Fonboarding%3Fstep%3Dcompany",
    );
  });

  it("does not redirect when server-side session probe fails", async () => {
    mockedProtectedRouteSession.mockResolvedValue({
      authState: { kind: "unknown", reason: "probe_failed" },
    });

    const dashboardBeforeLoad = DashboardRoute.options.beforeLoad;
    assertBeforeLoad(dashboardBeforeLoad);
    await expect(
      dashboardBeforeLoad({
        params: { locale: "en" },
        location: { pathname: "/en/dashboard", search: {} },
      }),
    ).resolves.toBeUndefined();

    const loginBeforeLoad = LoginRoute.options.beforeLoad;
    assertBeforeLoad(loginBeforeLoad);
    await expect(
      loginBeforeLoad({
        params: { locale: "en" },
        search: { redirect: "/dashboard" },
      }),
    ).resolves.toBeUndefined();
  });

  it("redirects authenticated but unverified users to verify-email with email context", async () => {
    mockedProtectedRouteSession.mockResolvedValue({
      authState: {
        kind: "authenticated_unverified",
        user: {
          id: "user-2",
          email: "verify@example.com",
          firstName: "Verify",
          lastName: "User",
          emailVerified: false,
          tenantId: "11111111-1111-4111-8111-111111111111",
        },
      },
    });

    const beforeLoad = DashboardRoute.options.beforeLoad;
    assertBeforeLoad(beforeLoad);

    await expectRedirectLocation(
      beforeLoad({
        params: { locale: "en" },
        location: {
          pathname: "/en/dashboard",
          search: {},
        },
      }),
      "/en/auth/verify-email?redirect=%2Fdashboard&email=verify%40example.com&tenantId=11111111-1111-4111-8111-111111111111",
    );
  });

  it("redirects unverified onboarding users to verify-email with onboarding return target", async () => {
    mockedProtectedRouteSession.mockResolvedValue({
      authState: {
        kind: "authenticated_unverified",
        user: {
          id: "user-2",
          email: "verify@example.com",
          firstName: "Verify",
          lastName: "User",
          emailVerified: false,
          tenantId: "11111111-1111-4111-8111-111111111111",
        },
      },
    });

    const beforeLoad = OnboardingRoute.options.beforeLoad;
    assertBeforeLoad(beforeLoad);

    await expectRedirectLocation(
      beforeLoad({
        params: { locale: "en" },
        location: {
          pathname: "/en/onboarding",
          search: {},
        },
      }),
      "/en/auth/verify-email?redirect=%2Fonboarding&email=verify%40example.com&tenantId=11111111-1111-4111-8111-111111111111",
    );
  });

  it("allows verified users to access protected onboarding and dashboard routes", async () => {
    mockedProtectedRouteSession.mockResolvedValue({
      authState: {
        kind: "authenticated_verified",
        user: {
          id: "user-1",
          email: "user@example.com",
          firstName: "User",
          lastName: "Example",
          emailVerified: true,
          tenantId: "11111111-1111-4111-8111-111111111111",
        },
      },
    });

    const dashboardBeforeLoad = DashboardRoute.options.beforeLoad;
    assertBeforeLoad(dashboardBeforeLoad);
    await expect(
      dashboardBeforeLoad({
        params: { locale: "en" },
        location: { pathname: "/en/dashboard", search: {} },
      }),
    ).resolves.toBeUndefined();

    const onboardingBeforeLoad = OnboardingRoute.options.beforeLoad;
    assertBeforeLoad(onboardingBeforeLoad);
    await expect(
      onboardingBeforeLoad({
        params: { locale: "en" },
        location: { pathname: "/en/onboarding", search: {} },
      }),
    ).resolves.toBeUndefined();
  });
});
