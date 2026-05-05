/**
 * Gates `/dashboard/feature-flags` until explicitly enabled; list data uses `admin.featureFlags.list`.
 */

export function isFeatureFlagsAdminUiEnabled(): boolean {
  return import.meta.env.VITE_PUBLIC_ENABLE_FEATURE_FLAGS_ADMIN_UI === "true";
}

/**
 * Gates the insights and reports UI features.
 * Default: disabled (behind feature flag)
 */
export function isInsightsUiEnabled(): boolean {
  return import.meta.env.VITE_PUBLIC_ENABLE_INSIGHTS_UI === "true";
}
