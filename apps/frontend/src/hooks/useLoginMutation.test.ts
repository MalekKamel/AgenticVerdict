import { describe, expect, it } from "vitest";

import {
  buildVerifyEmailRedirect,
  resolveLoginErrorState,
  resolvePostLoginRedirect,
} from "./useLoginMutation";

describe("resolvePostLoginRedirect", () => {
  it("falls back to dashboard when redirect is missing", () => {
    expect(resolvePostLoginRedirect(null)).toBe("/dashboard");
  });

  it("falls back to dashboard for external or malformed redirects", () => {
    expect(resolvePostLoginRedirect("dashboard")).toBe("/dashboard");
    expect(resolvePostLoginRedirect("https://example.com")).toBe("/dashboard");
    expect(resolvePostLoginRedirect("//evil.example.com")).toBe("/dashboard");
  });

  it("blocks auth-loop redirects", () => {
    expect(resolvePostLoginRedirect("/auth/login")).toBe("/dashboard");
    expect(resolvePostLoginRedirect("/auth/register")).toBe("/dashboard");
  });

  it("allows safe internal redirect targets", () => {
    expect(resolvePostLoginRedirect("/dashboard/reports")).toBe("/dashboard/reports");
    expect(resolvePostLoginRedirect("/settings")).toBe("/settings");
  });
});

describe("resolveLoginErrorState", () => {
  it("detects locked out states", () => {
    expect(resolveLoginErrorState("auth.errors.accountLocked")).toBe("locked_out");
    expect(resolveLoginErrorState("auth.errors.tooManyAttempts")).toBe("locked_out");
  });

  it("detects rate limited state", () => {
    expect(resolveLoginErrorState("auth.errors.rateLimitExceeded")).toBe("rate_limited");
  });

  it("falls back to generic error", () => {
    expect(resolveLoginErrorState("auth.errors.invalidCredentials")).toBe("error");
  });
});

describe("buildVerifyEmailRedirect", () => {
  it("builds a verify-email href with normalized email", () => {
    expect(buildVerifyEmailRedirect("USER@Example.com")).toBe(
      "/auth/verify-email?email=user%40example.com",
    );
  });

  it("includes tenant id and sanitized redirect when provided", () => {
    expect(
      buildVerifyEmailRedirect(
        "user@example.com",
        "11111111-1111-4111-8111-111111111111",
        "/dashboard/reports",
      ),
    ).toBe(
      "/auth/verify-email?email=user%40example.com&tenantId=11111111-1111-4111-8111-111111111111&redirect=%2Fdashboard%2Freports",
    );
  });

  it("sanitizes unsafe redirect target", () => {
    expect(
      buildVerifyEmailRedirect("user@example.com", undefined, "https://evil.example.com"),
    ).toBe("/auth/verify-email?email=user%40example.com&redirect=%2Fdashboard");
  });
});
