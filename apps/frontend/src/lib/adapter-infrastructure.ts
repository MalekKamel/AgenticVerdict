import {
  createDefaultAdapterInfrastructure,
  isMockEnabledForConnector,
  connectorAdapterTypes,
  type AdapterInfrastructureBundle,
} from "@agenticverdict/data-connectors";

const globalKey = "__agenticverdict_adapterInfrastructure__" as const;

/**
 * Process-local singleton for health probes and future adapter wiring (Execution Phase 1 — Task 1.6).
 */
export function getSharedAdapterInfrastructure(): AdapterInfrastructureBundle {
  const g = globalThis as unknown as Record<string, AdapterInfrastructureBundle | undefined>;
  if (!g[globalKey]) {
    g[globalKey] = createDefaultAdapterInfrastructure();
    if (process.env.NODE_ENV === "development") {
      const enabled = connectorAdapterTypes.filter((platform) =>
        isMockEnabledForConnector(platform),
      );
      if (enabled.length > 0) {
        console.warn(`[Mock Adapters] Enabled for: ${enabled.join(", ")}`);
      }
    }
  }
  return g[globalKey];
}
