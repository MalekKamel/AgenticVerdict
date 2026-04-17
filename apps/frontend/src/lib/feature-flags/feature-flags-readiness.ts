/**
 * Gates `/dashboard/feature-flags` until explicitly enabled; list data uses `admin.featureFlags.list`.
 */

export function isFeatureFlagsAdminUiEnabled(): boolean {
  return import.meta.env.VITE_PUBLIC_ENABLE_FEATURE_FLAGS_ADMIN_UI === "true";
}
