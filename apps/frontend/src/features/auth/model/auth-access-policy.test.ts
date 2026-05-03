import { describe, expect, it } from "vitest";

import { resolveRouteAccessDecision } from "./auth-access-policy";

describe("resolveRouteAccessDecision", () => {
  it("defers redirects when auth state is unknown", () => {
    expect(
      resolveRouteAccessDecision({
        routeKind: "protected",
        authState: { kind: "unknown", reason: "probe_failed" },
        locale: "en",
        redirectTarget: "/dashboard",
      }),
    ).toEqual({ type: "defer", reason: "unknown_state" });
  });

  it("redirects anonymous users on protected routes to login", () => {
    expect(
      resolveRouteAccessDecision({
        routeKind: "protected",
        authState: { kind: "anonymous" },
        locale: "en",
        redirectTarget: "/dashboard/reports",
      }),
    ).toEqual({
      type: "redirect",
      to: "/en/auth/login?redirect=%2Fdashboard%2Freports",
    });
  });

  it("redirects authenticated users away from public auth pages", () => {
    expect(
      resolveRouteAccessDecision({
        routeKind: "public_auth",
        authState: {
          kind: "authenticated_verified",
          user: {
            id: "u1",
            email: "user@example.com",
            firstName: "User",
            lastName: "Example",
            emailVerified: true,
            tenantId: "11111111-1111-4111-8111-111111111111",
          },
        },
        locale: "en",
        redirectTarget: "/dashboard",
      }),
    ).toEqual({
      type: "redirect",
      to: "/en/dashboard",
    });
  });

  it("does not duplicate locale when redirect target already includes the locale segment", () => {
    expect(
      resolveRouteAccessDecision({
        routeKind: "public_auth",
        authState: {
          kind: "authenticated_verified",
          user: {
            id: "u1",
            email: "user@example.com",
            firstName: "User",
            lastName: "Example",
            emailVerified: true,
            tenantId: "11111111-1111-4111-8111-111111111111",
          },
        },
        locale: "en",
        redirectTarget: "/en/dashboard/agency",
      }),
    ).toEqual({
      type: "redirect",
      to: "/en/dashboard/agency",
    });
  });

  it("redirects unverified users on protected routes to verify email", () => {
    expect(
      resolveRouteAccessDecision({
        routeKind: "protected",
        authState: {
          kind: "authenticated_unverified",
          user: {
            id: "u2",
            email: "verify@example.com",
            firstName: "Verify",
            lastName: "User",
            emailVerified: false,
            tenantId: "11111111-1111-4111-8111-111111111111",
          },
        },
        locale: "en",
        redirectTarget: "/dashboard",
      }),
    ).toEqual({
      type: "redirect",
      to: "/en/auth/verify-email?redirect=%2Fdashboard&email=verify%40example.com&tenantId=11111111-1111-4111-8111-111111111111",
    });
  });
});
