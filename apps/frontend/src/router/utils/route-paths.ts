import type { FileRoutesByTo } from "@/routeTree.gen";

export type RoutePaths = keyof FileRoutesByTo;

export const ROUTE_PATHS = {
  HOME: "/" as const,
  ONBOARDING: "/onboarding" as const,

  AUTH_LOGIN: "/auth/login" as const,
  AUTH_REGISTER: "/auth/register" as const,
  AUTH_FORGOT_PASSWORD: "/auth/forgot-password" as const,
  AUTH_RESET_PASSWORD: "/auth/reset-password" as const,
  AUTH_VERIFY_EMAIL: "/auth/verify-email" as const,
  AUTH_TERMS: "/auth/terms" as const,
  AUTH_PRIVACY: "/auth/privacy" as const,
  AUTH_HELP: "/auth/help" as const,

  DASHBOARD: "/dashboard" as const,
  DASHBOARD_HOME: "/dashboard" as const,
  DASHBOARD_CONNECTORS: "/dashboard/connectors" as const,
  DASHBOARD_CONNECTORS_ADD: "/dashboard/connectors/add" as const,
  DASHBOARD_CONNECTORS_DETAIL: "/dashboard/connectors/$id" as const,
  DASHBOARD_CONNECTORS_CONFIGURE: "/dashboard/connectors/$id/configure" as const,
  DASHBOARD_CONNECTORS_REMOVE: "/dashboard/connectors/$id/remove" as const,
  DASHBOARD_DOMAIN: "/dashboard/$domain" as const,
  DASHBOARD_AGENCY: "/dashboard/agency" as const,
  DASHBOARD_AGENCY_CLIENT: "/dashboard/agency/$clientId" as const,
  DASHBOARD_CUSTOMIZE: "/dashboard/customize" as const,
  DASHBOARD_FEATURE_FLAGS: "/dashboard/feature-flags" as const,
  DASHBOARD_INSIGHTS: "/dashboard/insights" as const,
  DASHBOARD_INSIGHTS_NEW: "/dashboard/insights/new" as const,
  DASHBOARD_INSIGHTS_DETAIL: "/dashboard/insights/$id" as const,
  DASHBOARD_INSIGHTS_EDIT: "/dashboard/insights/$id/edit" as const,
  DASHBOARD_REPORTS: "/dashboard/reports" as const,
  DASHBOARD_REPORTS_DETAIL: "/dashboard/reports/$reportId" as const,
  SHARED_REPORTS: "/shared/reports/$reportId" as const,

  API_HEALTH: "/api/health" as const,
  API_HEALTH_ADAPTERS: "/api/health/adapters" as const,
  API_HEALTH_PLATFORMS: "/api/health/platforms/$platform" as const,
  API_READY: "/api/ready" as const,
} as const;

export type RoutePath = (typeof ROUTE_PATHS)[keyof typeof ROUTE_PATHS];

export function buildSharedReportUrl(options: {
  baseUrl: string;
  reportId: string;
  token: string;
}): string {
  const baseUrl = options.baseUrl || "http://localhost:3000";
  return `${baseUrl}/shared/reports/${options.reportId}?token=${options.token}`;
}
