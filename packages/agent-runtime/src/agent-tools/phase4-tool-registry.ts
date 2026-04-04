import type { Database } from "@agenticverdict/database";

import { ToolRegistry } from "../tools";
import { createAnalysisTools } from "./analysis-tools";
import { createCompanyContextTools, type CompanyContextToolDeps } from "./company-context-tools";
import { createDatabaseQueryTools } from "./database-query-tools";
import {
  createDrizzleMarketingMetricsStore,
  type MarketingMetricsStore,
} from "./marketing-metrics-store";
import { createPlatformFetchTools, type PlatformFetchToolDeps } from "./platform-fetch-tools";
import { createReportPrepTools } from "./report-prep-tools";

export interface Phase4AgentToolingDeps {
  /** Tenant-scoped metrics access (typically {@link createDrizzleMarketingMetricsStore}). */
  metricsStore: MarketingMetricsStore;
  platform: PlatformFetchToolDeps;
  companyContext?: CompanyContextToolDeps;
}

/**
 * Registers Category 2 tools (tasks 2.1–2.5) on an existing registry.
 */
export function registerPhase4AgentTools(
  registry: ToolRegistry,
  deps: Phase4AgentToolingDeps,
): void {
  for (const t of createPlatformFetchTools(deps.platform)) {
    registry.register(t);
  }
  for (const t of createDatabaseQueryTools({ metricsStore: deps.metricsStore })) {
    registry.register(t);
  }
  for (const t of createReportPrepTools()) {
    registry.register(t);
  }
  for (const t of createAnalysisTools()) {
    registry.register(t);
  }
  for (const t of createCompanyContextTools(deps.companyContext)) {
    registry.register(t);
  }
}

/**
 * Convenience factory for a fresh registry with all Phase 4 tools registered.
 */
export function createPhase4ToolRegistry(deps: Phase4AgentToolingDeps): ToolRegistry {
  const registry = new ToolRegistry();
  registerPhase4AgentTools(registry, deps);
  return registry;
}

/**
 * Convenience when the caller holds a shared Drizzle {@link Database} pool; builds the default metrics store.
 */
export function createPhase4ToolRegistryWithDatabase(
  database: Database,
  deps: Pick<Phase4AgentToolingDeps, "platform" | "companyContext">,
): ToolRegistry {
  return createPhase4ToolRegistry({
    metricsStore: createDrizzleMarketingMetricsStore(database),
    platform: deps.platform,
    companyContext: deps.companyContext,
  });
}
