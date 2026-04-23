import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { authApi } from "./auth-api";

describe("auth-api mock session bridge", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_PUBLIC_AUTH_API_MODE", "mock");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("getSession reflects login then clears on logout", async () => {
    const login = await authApi.login({
      email: "user@example.com",
      password: "Secret123!",
      rememberMe: false,
    });
    expect(login.success).toBe(true);

    const session = await authApi.getSession();
    expect(session.success && session.data.user?.email).toBe("user@example.com");

    await authApi.logout();
    const after = await authApi.getSession();
    expect(after.success && after.data.user).toBeNull();
  });
});
