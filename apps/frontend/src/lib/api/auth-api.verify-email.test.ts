import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { authApi } from "./auth-api";

const tenantId = "11111111-1111-4111-8111-111111111111";

describe("auth-api verify email mock flow", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_PUBLIC_AUTH_API_MODE", "mock");
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it("accepts verification for newly registered non-demo emails", async () => {
    const email = `qa-user-${Date.now()}@example.com`;

    const register = await authApi.register({
      email,
      password: "SecurePassword123!",
      firstName: "QA",
      lastName: "User",
      tenantId,
    });
    expect(register.success).toBe(true);

    const verify = await authApi.verifyEmail({
      email,
      code: "123456",
      tenantId,
    });
    expect(verify.success).toBe(true);
  });

  it("supports direct verify-email deep links before register state exists", async () => {
    const email = `deeplink-${Date.now()}@example.com`;

    const verify = await authApi.verifyEmail({
      email,
      code: "123456",
      tenantId,
    });

    expect(verify.success).toBe(true);
  });

  it("refreshes expired deep-link verification state for demo code", async () => {
    vi.useFakeTimers();
    const start = new Date("2026-04-25T20:00:00.000Z");
    vi.setSystemTime(start);
    const email = "demo@example.com";

    const initialInvalidAttempt = await authApi.verifyEmail({
      email,
      code: "000000",
      tenantId,
    });
    expect(initialInvalidAttempt.success).toBe(false);

    vi.setSystemTime(new Date(start.getTime() + 16 * 60 * 1000));

    const secondVerify = await authApi.verifyEmail({
      email,
      code: "123456",
      tenantId,
    });
    expect(secondVerify.success).toBe(true);
  });

  it("returns invalid-code details with attempts remaining", async () => {
    const email = `invalid-${Date.now()}@example.com`;

    const verify = await authApi.verifyEmail({
      email,
      code: "000000",
      tenantId,
    });

    expect(verify.success).toBe(false);
    if (!verify.success) {
      expect(verify.error.code).toBe("BAD_REQUEST");
      expect(verify.error.message).toBe("auth.verifyEmail.errors.invalidCode");
      expect(verify.error.details?.attemptsRemaining).toBe(4);
    }
  });
});
