import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/$locale/shared/reports/$reportId")({
  component: lazyRouteComponent(() => import("@/features/reports/pages/SharedReportPage")),
});
