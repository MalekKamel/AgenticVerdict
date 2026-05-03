import type { GuardDecisionContext, GuardDiagnosticsLogger } from "./guard-types";

export function createRouteGuardDiagnosticsLogger(): GuardDiagnosticsLogger {
  return (context: GuardDecisionContext) => {
    console.debug("[auth.route_guard]", {
      routeKind: context.routeKind,
      authStateKind: context.authState.kind,
      decisionType: context.decision.type,
    });
  };
}
