import { redirect } from "@tanstack/react-router";

import { DASHBOARD_AGENCY_PERMITTED_CLIENT_IDS } from "@/features/dashboard/model/dashboard-agency-constants";

import { createDashboardParentBeforeLoad } from "./create-dashboard-parent-before-load";
import type { RouteGuardBeforeLoadFn } from "@/lib/auth/route-guards/guard-types";

export function createAgencyClientDashboardBeforeLoad(): RouteGuardBeforeLoadFn {
  const base = createDashboardParentBeforeLoad();
  const beforeLoad: RouteGuardBeforeLoadFn = async (ctx: unknown) => {
    const { params } = ctx as { params: { locale: string; clientId: string } };
    if (!DASHBOARD_AGENCY_PERMITTED_CLIENT_IDS.has(params.clientId)) {
      throw redirect({
        to: "/$locale/dashboard/agency",
        params: { locale: params.locale },
        replace: true,
      });
    }
    await base(ctx);
  };
  beforeLoad.__routeGuardFactoryKind = "protected";
  return beforeLoad;
}
