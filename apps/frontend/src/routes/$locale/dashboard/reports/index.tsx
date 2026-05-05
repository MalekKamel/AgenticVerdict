import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

import { createDashboardParentBeforeLoad } from "@/features/dashboard/route-guards/create-dashboard-parent-before-load";
import { AppRouteError } from "@/components/errors/AppRouteError";

export const Route = createFileRoute("/$locale/dashboard/reports/")({
  beforeLoad: createDashboardParentBeforeLoad(),
  component: lazyRouteComponent(() => import("@/features/reports/pages/ReportListPage")),
  errorComponent: AppRouteError,
});
