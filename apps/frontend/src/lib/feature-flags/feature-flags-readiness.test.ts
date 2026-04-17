import { afterEach, describe, expect, it, vi } from "vitest";

import { isFeatureFlagsAdminUiEnabled } from "./feature-flags-readiness";

describe("feature-flags-readiness", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("is disabled unless VITE_PUBLIC_ENABLE_FEATURE_FLAGS_ADMIN_UI is true", () => {
    vi.stubEnv("VITE_PUBLIC_ENABLE_FEATURE_FLAGS_ADMIN_UI", undefined);
    expect(isFeatureFlagsAdminUiEnabled()).toBe(false);
    vi.stubEnv("VITE_PUBLIC_ENABLE_FEATURE_FLAGS_ADMIN_UI", "true");
    expect(isFeatureFlagsAdminUiEnabled()).toBe(true);
  });
});
