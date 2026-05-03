export { router, type AppRouter } from "./router";

export { useRouter, useNavigate, useSearch, useParams, usePathname } from "./hooks";

export { ROUTE_PATHS, type RoutePath, type RoutePaths } from "./utils/route-paths";

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
