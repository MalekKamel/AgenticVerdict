import { beforeEach, describe, expect, it, vi } from "vitest";

import { createProtectedBeforeLoad } from "./create-protected-before-load";
import { createPublicAuthBeforeLoad } from "./create-public-auth-before-load";

const fetchProtectedRouteSessionMock = vi.fn();
const resolveRouteAccessDecisionMock = vi.fn();

vi.mock("@/lib/auth/protected-route-session", () => ({
  fetchProtectedRouteSession: () => fetchProtectedRouteSessionMock(),
}));

vi.mock("@/lib/auth/auth-access-policy", () => ({
  resolveRouteAccessDecision: (input: unknown) => resolveRouteAccessDecisionMock(input),
}));

describe("route guard beforeLoad factories", () => {
  beforeEach(() => {
    fetchProtectedRouteSessionMock.mockReset();
    resolveRouteAccessDecisionMock.mockReset();
  });

  it("protected factory delegates to resolver and redirects using resolver output", async () => {
    fetchProtectedRouteSessionMock.mockResolvedValue({ authState: { kind: "anonymous" } });
    resolveRouteAccessDecisionMock.mockReturnValue({
      type: "redirect",
      to: "/en/auth/login?redirect=%2Fdashboard",
    });
    const logDecision = vi.fn();

    const beforeLoad = createProtectedBeforeLoad({ logDecision });

    await expect(
      beforeLoad({
        params: { locale: "en" },
        location: { pathname: "/en/dashboard", search: {} },
      }),
    ).rejects.toSatisfy((response: unknown) => {
      return (
        response instanceof Response &&
        response.headers.get("location") === "/en/auth/login?redirect=%2Fdashboard"
      );
    });

    expect(resolveRouteAccessDecisionMock).toHaveBeenCalledWith({
      routeKind: "protected",
      authState: { kind: "anonymous" },
      locale: "en",
      redirectTarget: "/dashboard",
    });
    expect(logDecision).toHaveBeenCalledWith(
      expect.objectContaining({
        routeKind: "protected",
        authState: { kind: "anonymous" },
        decision: { type: "redirect", to: "/en/auth/login?redirect=%2Fdashboard" },
      }),
    );
    expect(beforeLoad.__routeGuardFactoryKind).toBe("protected");
  });

  it("protected factory preserves unknown-state defer behavior", async () => {
    fetchProtectedRouteSessionMock.mockResolvedValue({
      authState: { kind: "unknown", reason: "probe_failed" },
    });
    resolveRouteAccessDecisionMock.mockReturnValue({ type: "defer", reason: "unknown_state" });

    const beforeLoad = createProtectedBeforeLoad();
    await expect(
      beforeLoad({
        params: { locale: "en" },
        location: { pathname: "/en/dashboard", search: {} },
      }),
    ).resolves.toBeUndefined();
  });

  it("public auth factory sanitizes malformed and loop-prone redirect targets", async () => {
    fetchProtectedRouteSessionMock.mockResolvedValue({
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
    resolveRouteAccessDecisionMock.mockReturnValue({ type: "redirect", to: "/en/dashboard" });

    const beforeLoad = createPublicAuthBeforeLoad();

    await expect(
      beforeLoad({
        params: { locale: "en" },
        search: { redirect: "https://evil.example" },
      }),
    ).rejects.toSatisfy(
      (response: unknown) =>
        response instanceof Response && response.headers.get("location") === "/en/dashboard",
    );

    expect(resolveRouteAccessDecisionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        routeKind: "public_auth",
        locale: "en",
        redirectTarget: "/dashboard",
      }),
    );

    await expect(
      beforeLoad({
        params: { locale: "en" },
        search: { redirect: "/auth/login" },
      }),
    ).rejects.toSatisfy(
      (response: unknown) =>
        response instanceof Response && response.headers.get("location") === "/en/dashboard",
    );

    expect(resolveRouteAccessDecisionMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        redirectTarget: "/dashboard",
      }),
    );
    expect(beforeLoad.__routeGuardFactoryKind).toBe("public_auth");
  });

  it("public auth factory allows non-redirect decisions from resolver", async () => {
    fetchProtectedRouteSessionMock.mockResolvedValue({ authState: { kind: "anonymous" } });
    resolveRouteAccessDecisionMock.mockReturnValue({ type: "allow" });

    const beforeLoad = createPublicAuthBeforeLoad();
    await expect(
      beforeLoad({
        params: { locale: "en" },
        search: { redirect: "/dashboard" },
      }),
    ).resolves.toBeUndefined();
  });
});
