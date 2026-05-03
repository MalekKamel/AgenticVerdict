import type { FileRoutesByTo } from "@/routeTree.gen";

export type RoutePaths = keyof FileRoutesByTo;

export const ROUTE_PATHS = {
  HOME: "/$locale" as const,
  ONBOARDING: "/$locale/onboarding" as const,

  AUTH_LOGIN: "/$locale/auth/login" as const,
  AUTH_REGISTER: "/$locale/auth/register" as const,
  AUTH_FORGOT_PASSWORD: "/$locale/auth/forgot-password" as const,
  AUTH_RESET_PASSWORD: "/$locale/auth/reset-password" as const,
  AUTH_VERIFY_EMAIL: "/$locale/auth/verify-email" as const,
  AUTH_TERMS: "/$locale/auth/terms" as const,
  AUTH_PRIVACY: "/$locale/auth/privacy" as const,
  AUTH_HELP: "/$locale/auth/help" as const,

  DASHBOARD: "/$locale/dashboard" as const,
  DASHBOARD_HOME: "/$locale/dashboard" as const,
  DASHBOARD_CONNECTORS: "/$locale/dashboard/connectors" as const,
  DASHBOARD_CONNECTORS_ADD: "/$locale/dashboard/connectors/add" as const,
  DASHBOARD_CONNECTORS_DETAIL: "/$locale/dashboard/connectors/$id" as const,
  DASHBOARD_CONNECTORS_CONFIGURE: "/$locale/dashboard/connectors/$id/configure" as const,
  DASHBOARD_CONNECTORS_REMOVE: "/$locale/dashboard/connectors/$id/remove" as const,
  DASHBOARD_DOMAIN: "/$locale/dashboard/$domain" as const,
  DASHBOARD_AGENCY: "/$locale/dashboard/agency" as const,
  DASHBOARD_AGENCY_CLIENT: "/$locale/dashboard/agency/$clientId" as const,
  DASHBOARD_CUSTOMIZE: "/$locale/dashboard/customize" as const,
  DASHBOARD_FEATURE_FLAGS: "/$locale/dashboard/feature-flags" as const,

  API_HEALTH: "/api/health" as const,
  API_HEALTH_ADAPTERS: "/api/health/adapters" as const,
  API_HEALTH_PLATFORMS: "/api/health/platforms/$platform" as const,
  API_READY: "/api/ready" as const,
} as const;

export type RoutePath = (typeof ROUTE_PATHS)[keyof typeof ROUTE_PATHS];
