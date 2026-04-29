import { redirect } from "@tanstack/react-router";

import { dashboardDomainSlugSchema } from "@/features/dashboard/model/contracts";

import { createDashboardParentBeforeLoad } from "./create-dashboard-parent-before-load";
import type { RouteGuardBeforeLoadFn } from "@/lib/auth/route-guards/guard-types";

export function createDomainDashboardBeforeLoad(): RouteGuardBeforeLoadFn {
  const base = createDashboardParentBeforeLoad();
  const beforeLoad: RouteGuardBeforeLoadFn = async (ctx: unknown) => {
    const { params } = ctx as { params: { locale: string; domain: string } };
    const parsed = dashboardDomainSlugSchema.safeParse(params.domain);
    if (!parsed.success) {
      throw redirect({
        to: "/$locale/dashboard",
        params: { locale: params.locale },
        replace: true,
      });
    }
    await base(ctx);
  };
  beforeLoad.__routeGuardFactoryKind = "protected";
  return beforeLoad;
}
