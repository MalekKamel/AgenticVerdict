import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
import { createDashboardParentBeforeLoad } from "@/features/dashboard/route-guards/create-dashboard-parent-before-load";

export const Route = createFileRoute("/$locale/dashboard/reports/$reportId")({
  beforeLoad: createDashboardParentBeforeLoad(),
  component: lazyRouteComponent(() => import("@/features/reports/pages/ReportViewerPage")),
});
