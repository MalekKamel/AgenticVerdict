export { createProtectedBeforeLoad } from "./create-protected-before-load";
export { createPublicAuthBeforeLoad } from "./create-public-auth-before-load";
export { buildProtectedRedirectTarget, resolvePublicAuthRedirectTarget } from "./redirect-target";
export { createRouteGuardDiagnosticsLogger } from "./route-guard-diagnostics";
export type {
  GuardDecisionContext,
  GuardDiagnosticsLogger,
  GuardLocation,
  RouteGuardBeforeLoadFn,
  RouteGuardFactoryKind,
} from "./guard-types";
