const root = ["dashboard"] as const;

export type DashboardQueryScope = {
  tenantId: string;
  clientId?: string;
};

export function dashboardHomeSummaryKey(scope: DashboardQueryScope) {
  return [...root, "home", scope.tenantId, scope.clientId ?? "tenant"] as const;
}

export function dashboardKpisKey(scope: DashboardQueryScope) {
  return [...root, "kpis", scope.tenantId, scope.clientId ?? "tenant"] as const;
}

export function dashboardInsightsKey(scope: DashboardQueryScope) {
  return [...root, "insights", scope.tenantId, scope.clientId ?? "tenant"] as const;
}

export function dashboardConnectorsKey(scope: DashboardQueryScope) {
  return [...root, "connectors", scope.tenantId, scope.clientId ?? "tenant"] as const;
}

export function dashboardDomainSummaryKey(scope: DashboardQueryScope & { domain: string }) {
  return [...root, "domain", scope.domain, scope.tenantId, scope.clientId ?? "tenant"] as const;
}

export function dashboardAgencyOverviewKey(scope: { tenantId: string }) {
  return [...root, "agency", scope.tenantId] as const;
}

export function dashboardLayoutPersistenceKey(input: { tenantId: string; userId: string }): string {
  return `dashboard:layout:v1:${input.tenantId}:${input.userId}`;
}
