import { Store, useStore } from "@tanstack/react-store";

import type { DashboardDatePreset, DashboardViewMode } from "./contracts";

export type DashboardContextMode = "tenant" | "agency_overview" | "agency_client";

export type DashboardStoreState = {
  datePreset: DashboardDatePreset;
  comparisonEnabled: boolean;
  viewMode: DashboardViewMode;
  contextMode: DashboardContextMode;
  /** When contextMode is agency_client, selected permitted client id */
  activeClientId: string | undefined;
  lastSuccessfulDataAtMs: number | null;
  manualRefreshToken: number;
};

const defaultState: DashboardStoreState = {
  datePreset: "last_7_days",
  comparisonEnabled: false,
  viewMode: "standard",
  contextMode: "tenant",
  activeClientId: undefined,
  lastSuccessfulDataAtMs: null,
  manualRefreshToken: 0,
};

export const dashboardStore = new Store<DashboardStoreState>(defaultState);

export function resetDashboardStore(): void {
  dashboardStore.setState(() => ({ ...defaultState }));
}

export function setDashboardDatePreset(preset: DashboardDatePreset): void {
  dashboardStore.setState((s) => ({ ...s, datePreset: preset }));
}

export function setDashboardComparisonEnabled(enabled: boolean): void {
  dashboardStore.setState((s) => ({ ...s, comparisonEnabled: enabled }));
}

export function setDashboardViewMode(mode: DashboardViewMode): void {
  dashboardStore.setState((s) => ({ ...s, viewMode: mode }));
}

export function setDashboardContext(args: {
  contextMode: DashboardContextMode;
  activeClientId?: string;
}): void {
  dashboardStore.setState((s) => ({
    ...s,
    contextMode: args.contextMode,
    activeClientId:
      args.contextMode === "agency_client" ? (args.activeClientId ?? s.activeClientId) : undefined,
  }));
}

export function bumpManualDashboardRefresh(): void {
  dashboardStore.setState((s) => ({
    ...s,
    manualRefreshToken: s.manualRefreshToken + 1,
  }));
}

export function markDashboardDataFresh(timestampMs: number): void {
  dashboardStore.setState((s) => ({ ...s, lastSuccessfulDataAtMs: timestampMs }));
}

export function useDashboardStore<T>(selector: (s: DashboardStoreState) => T): T {
  return useStore(dashboardStore, selector);
}
