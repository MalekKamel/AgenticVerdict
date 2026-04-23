import type { GuardDecisionContext, GuardDiagnosticsLogger } from "./guard-types";

export function createRouteGuardDiagnosticsLogger(): GuardDiagnosticsLogger {
  return (context: GuardDecisionContext) => {
    // Non-sensitive diagnostics only: route kind, state kind, and final decision type.
    console.debug("[auth.route_guard]", {
      routeKind: context.routeKind,
      authStateKind: context.authState.kind,
      decisionType: context.decision.type,
    });
  };
}
