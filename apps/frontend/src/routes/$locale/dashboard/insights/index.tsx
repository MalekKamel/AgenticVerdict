import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

import { createDashboardParentBeforeLoad } from "@/features/dashboard/route-guards/create-dashboard-parent-before-load";
import { AppRouteError } from "@/components/errors/AppRouteError";

export const Route = createFileRoute("/$locale/dashboard/insights/")({
  beforeLoad: createDashboardParentBeforeLoad(),
  component: lazyRouteComponent(() => import("@/features/insights/pages/InsightListPage")),
  errorComponent: AppRouteError,
});
