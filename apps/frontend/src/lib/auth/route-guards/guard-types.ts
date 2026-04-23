import type { defaultStringifySearch } from "@tanstack/react-router";

import type { AuthAccessDecision, AuthRouteKind } from "@/lib/auth/auth-access-policy";
import type { AuthResolutionState } from "@/lib/auth/auth-resolution-state";

export type RouteGuardFactoryKind = "protected" | "public_auth";

export type GuardLocation = {
  pathname: string;
  search: Parameters<typeof defaultStringifySearch>[0];
};

export type GuardDecisionContext = {
  routeKind: AuthRouteKind;
  authState: AuthResolutionState;
  decision: AuthAccessDecision;
};

export type GuardDiagnosticsLogger = (context: GuardDecisionContext) => void;

export type RouteGuardBeforeLoadFn = ((context: unknown) => Promise<void>) & {
  __routeGuardFactoryKind?: RouteGuardFactoryKind;
};
