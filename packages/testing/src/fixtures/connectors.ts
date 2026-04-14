import type { ConnectorAdapter } from "@agenticverdict/data-connectors";
import type { ConnectorType } from "@agenticverdict/types";
import { vi } from "vitest";

/**
 * Vitest-based {@link ConnectorAdapter} double for unit tests (no network).
 * Not re-exported from the package root (avoids loading Vitest when consumers import `@agenticverdict/testing`).
 * Import from `@agenticverdict/testing/fixtures/connectors` instead.
 * Prefer {@link createSyntheticAdapter} in `@agenticverdict/data-connectors` when you need
 * in-package tests without adding a Vitest dependency to the consumer.
 */
export function mockConnector(
  overrides: Partial<ConnectorAdapter> & { connector?: ConnectorType } = {},
): ConnectorAdapter {
  const { connector: connectorOverride, ...rest } = overrides;
  const connector: ConnectorType = connectorOverride ?? "ga4";

  const base: ConnectorAdapter = {
    connector,
    authenticate: vi.fn().mockResolvedValue(undefined),
    fetchMetrics: vi.fn().mockResolvedValue({ ok: true }),
    normalizeData: vi.fn((raw: unknown, dateRange) => ({
      connector,
      dateRange,
      records: [],
    })),
    isHealthy: vi.fn().mockResolvedValue(true),
  };

  return { ...base, ...rest };
}
