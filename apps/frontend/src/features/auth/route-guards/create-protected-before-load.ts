import { redirect } from "@tanstack/react-router";

import { resolveRouteAccessDecision } from "@/features/auth/model/auth-access-policy";
import { fetchProtectedRouteSession } from "@/features/auth/model/protected-route-session";

import { buildProtectedRedirectTarget } from "./redirect-target";
import { createRouteGuardDiagnosticsLogger } from "./route-guard-diagnostics";
import type { GuardDiagnosticsLogger, RouteGuardBeforeLoadFn } from "./guard-types";

type ProtectedBeforeLoadContext = {
  params: { locale: string };
  location: {
    pathname: string;
    search: Record<string, unknown>;
  };
};

type CreateProtectedBeforeLoadOptions = {
  logDecision?: GuardDiagnosticsLogger;
};

export function createProtectedBeforeLoad(
  options: CreateProtectedBeforeLoadOptions = {},
): RouteGuardBeforeLoadFn {
  const logDecision = options.logDecision ?? createRouteGuardDiagnosticsLogger();
  const beforeLoad: RouteGuardBeforeLoadFn = async (context: unknown) => {
    const { params, location } = context as ProtectedBeforeLoadContext;
    if (import.meta.env.MODE === "spa") {
      return;
    }

    const result = await fetchProtectedRouteSession();
    const redirectTarget = buildProtectedRedirectTarget(location);
    const decision = resolveRouteAccessDecision({
      routeKind: "protected",
      authState: result.authState,
      locale: params.locale,
      redirectTarget,
    });
    logDecision({
      routeKind: "protected",
      authState: result.authState,
      decision,
    });

    if (decision.type === "allow" || decision.type === "defer") {
      return;
    }

    throw redirect({ href: decision.to });
  };

  beforeLoad.__routeGuardFactoryKind = "protected";
  return beforeLoad;
}
