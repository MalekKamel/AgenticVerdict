import { afterEach, describe, expect, it, vi } from "vitest";

import { isOnboardingWizardEnabled } from "./onboarding-readiness";

describe("onboarding-readiness", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("is disabled unless VITE_PUBLIC_ENABLE_ONBOARDING_WIZARD is true", () => {
    vi.stubEnv("VITE_PUBLIC_ENABLE_ONBOARDING_WIZARD", undefined);
    expect(isOnboardingWizardEnabled()).toBe(false);
    vi.stubEnv("VITE_PUBLIC_ENABLE_ONBOARDING_WIZARD", "true");
    expect(isOnboardingWizardEnabled()).toBe(true);
  });
});
