import { dashboardLayoutStateSchema, type DashboardLayoutState } from "./contracts";
import { dashboardLayoutPersistenceKey } from "./dashboard-query-keys";

const defaultOrder = dashboardLayoutStateSchema.parse({
  order: ["kpi_grid", "insights", "connectors", "quick_actions"],
});

export function readDashboardLayout(input: {
  tenantId: string;
  userId: string;
}): DashboardLayoutState {
  if (typeof window === "undefined") {
    return defaultOrder;
  }
  try {
    const raw = window.localStorage.getItem(dashboardLayoutPersistenceKey(input));
    if (!raw) {
      return defaultOrder;
    }
    const parsed = dashboardLayoutStateSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : defaultOrder;
  } catch {
    return defaultOrder;
  }
}

export function writeDashboardLayout(
  input: { tenantId: string; userId: string },
  state: DashboardLayoutState,
): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(
    dashboardLayoutPersistenceKey(input),
    JSON.stringify(dashboardLayoutStateSchema.parse(state)),
  );
}
