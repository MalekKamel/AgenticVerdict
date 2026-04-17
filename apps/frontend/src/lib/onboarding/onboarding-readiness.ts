export function isOnboardingWizardEnabled(): boolean {
  return import.meta.env.VITE_PUBLIC_ENABLE_ONBOARDING_WIZARD === "true";
}
