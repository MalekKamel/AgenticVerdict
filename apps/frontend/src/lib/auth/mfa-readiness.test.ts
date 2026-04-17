import { describe, expect, it, vi } from "vitest";

import { isMfaUiEnabled } from "./mfa-readiness";

describe("mfa-readiness", () => {
  it("isMfaUiEnabled is false unless VITE_PUBLIC_ENABLE_MFA_UI is true", () => {
    vi.stubEnv("VITE_PUBLIC_ENABLE_MFA_UI", "");
    expect(isMfaUiEnabled()).toBe(false);
    vi.stubEnv("VITE_PUBLIC_ENABLE_MFA_UI", "true");
    expect(isMfaUiEnabled()).toBe(true);
    vi.unstubAllEnvs();
  });
});
