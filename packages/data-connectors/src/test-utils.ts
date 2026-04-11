import type { ConnectorType } from "@agenticverdict/types";

import type { ConnectorAdapter } from "./adapter";
import type { ConnectorCredentials } from "./credentials";
import type { DateRangeIso } from "./date-range";
import type { NormalizedConnectorSnapshot } from "./normalization";

import { MockConnectorAdapter } from "./mock-adapter";

/** Stable tenant id for adapter unit tests and registry mocks. */
export const testAdapterTenantId = "00000000-0000-4000-8000-000000000001";

export interface SyntheticAdapterOptions {
  fetchImpl?: (dateRange: DateRangeIso) => Promise<unknown>;
  normalizeImpl?: (raw: unknown, dateRange: DateRangeIso) => NormalizedConnectorSnapshot;
  healthy?: boolean;
}

/**
 * Minimal {@link ConnectorAdapter} for tests without extending {@link BaseConnectorAdapter}.
 */
export function createSyntheticAdapter(
  connector: ConnectorType,
  options: SyntheticAdapterOptions = {},
): ConnectorAdapter {
  let creds: ConnectorCredentials | null = null;
  const fetchImpl =
    options.fetchImpl ??
    (async () => {
      if (!creds) {
        throw new Error("not authenticated");
      }
      return { ok: true };
    });
  const normalizeImpl =
    options.normalizeImpl ??
    ((raw: unknown, dateRange: DateRangeIso) => ({
      connector,
      dateRange,
      records: [],
    }));

  return {
    connector,
    async authenticate(credentials: ConnectorCredentials) {
      creds = credentials;
    },
    fetchMetrics: (range) => fetchImpl(range),
    normalizeData: (raw, range) => normalizeImpl(raw, range),
    async isHealthy() {
      return options.healthy ?? true;
    },
  };
}

/**
 * Registers a {@link MockConnectorAdapter} under `connector` for the lifetime of a test.
 */
export function useMockAdapter<TContext>(
  registry: {
    register(connector: ConnectorType, factory: (ctx: TContext) => ConnectorAdapter): void;
  },
  connector: ConnectorType,
  mockOptions?: ConstructorParameters<typeof MockConnectorAdapter>[1],
): void {
  registry.register(
    connector,
    () => new MockConnectorAdapter(connector, { tenantId: testAdapterTenantId, ...mockOptions }),
  );
}
