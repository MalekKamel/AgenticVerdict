import { redirect } from "@tanstack/react-router";

import { resolveRouteAccessDecision } from "@/features/auth/model/auth-access-policy";
import { fetchProtectedRouteSession } from "@/features/auth/model/protected-route-session";

import { resolvePublicAuthRedirectTarget } from "./redirect-target";
import { createRouteGuardDiagnosticsLogger } from "./route-guard-diagnostics";
import type { GuardDiagnosticsLogger, RouteGuardBeforeLoadFn } from "./guard-types";

type PublicAuthBeforeLoadContext = {
  params: { locale: string };
  search: { redirect?: string };
};

type CreatePublicAuthBeforeLoadOptions = {
  logDecision?: GuardDiagnosticsLogger;
};

export function createPublicAuthBeforeLoad(
  options: CreatePublicAuthBeforeLoadOptions = {},
): RouteGuardBeforeLoadFn {
  const logDecision = options.logDecision ?? createRouteGuardDiagnosticsLogger();
  const beforeLoad: RouteGuardBeforeLoadFn = async (context: unknown) => {
    const { params, search } = context as PublicAuthBeforeLoadContext;
    if (import.meta.env.MODE === "spa") {
      return;
    }

    const result = await fetchProtectedRouteSession();
    const target = resolvePublicAuthRedirectTarget(search.redirect);
    const decision = resolveRouteAccessDecision({
      routeKind: "public_auth",
      authState: result.authState,
      locale: params.locale,
      redirectTarget: target,
    });
    logDecision({
      routeKind: "public_auth",
      authState: result.authState,
      decision,
    });

    if (decision.type !== "redirect") {
      return;
    }

    throw redirect({ href: decision.to });
  };

  beforeLoad.__routeGuardFactoryKind = "public_auth";
  return beforeLoad;
}
