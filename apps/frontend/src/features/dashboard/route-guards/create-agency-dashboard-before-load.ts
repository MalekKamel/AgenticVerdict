import { redirect } from "@tanstack/react-router";

import { createDashboardParentBeforeLoad } from "./create-dashboard-parent-before-load";
import { fetchProtectedRouteSession } from "@/lib/auth/protected-route-session";
import type { RouteGuardBeforeLoadFn } from "@/lib/auth/route-guards/guard-types";

export function createAgencyDashboardBeforeLoad(): RouteGuardBeforeLoadFn {
  const base = createDashboardParentBeforeLoad();
  const beforeLoad: RouteGuardBeforeLoadFn = async (ctx: unknown) => {
    const { params } = ctx as { params: { locale: string } };

    await base(ctx);

    /** SPA builds defer tenant gates to {@link AgencyDashboardPage} (same pattern as session probing). */
    if (import.meta.env.MODE === "spa") {
      return;
    }

    const { authState } = await fetchProtectedRouteSession();

    if (authState.kind !== "authenticated_verified") {
      return;
    }

    const user = authState.user;

    if (user.tenantType !== "agency_partner") {
      throw redirect({
        to: "/$locale/dashboard",
        params: { locale: params.locale },
        replace: true,
      });
    }

    if (user.tenantStatus !== "active") {
      throw redirect({
        to: "/$locale/dashboard",
        params: { locale: params.locale },
        replace: true,
      });
    }
  };
  beforeLoad.__routeGuardFactoryKind = "protected";
  return beforeLoad;
}
