export { router, type AppRouter } from "./router";

export { useNavigate, useParams, usePathname, useRouter, useSearch } from "./hooks";

export {
  ROUTE_PATHS,
  type RoutePath,
  type RoutePaths,
  buildSharedReportUrl,
} from "./utils/route-paths";

export { withLocalePrefix, stripLocalePrefix } from "./utils/navigation";

export type {
  ConnectorListSearch,
  AuthRedirectSearch,
  DashboardDomainParams,
  ConnectorIdParams,
  AgencyClientIdParams,
  HealthPlatformParams,
} from "./types";

export { createMockRouter, mockUseRouter } from "./testing";
