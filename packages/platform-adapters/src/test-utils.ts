import type { PlatformType } from "@agenticverdict/types";

import type { PlatformAdapter } from "./adapter";
import type { PlatformCredentials } from "./credentials";
import type { DateRangeIso } from "./date-range";
import type { NormalizedPlatformSnapshot } from "./normalization";

import { MockPlatformAdapter } from "./mock-adapter";

export interface SyntheticAdapterOptions {
  fetchImpl?: (dateRange: DateRangeIso) => Promise<unknown>;
  normalizeImpl?: (raw: unknown, dateRange: DateRangeIso) => NormalizedPlatformSnapshot;
  healthy?: boolean;
}

/**
 * Minimal {@link PlatformAdapter} for tests without extending {@link BasePlatformAdapter}.
 */
export function createSyntheticAdapter(
  platform: PlatformType,
  options: SyntheticAdapterOptions = {},
): PlatformAdapter {
  let creds: PlatformCredentials | null = null;
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
      platform,
      dateRange,
      records: [],
    }));

  return {
    platform,
    async authenticate(credentials: PlatformCredentials) {
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
 * Registers a {@link MockPlatformAdapter} under `platform` for the lifetime of a test.
 */
export function useMockAdapter<TContext>(
  registry: { register(platform: PlatformType, factory: (ctx: TContext) => PlatformAdapter): void },
  platform: PlatformType,
  mockOptions?: ConstructorParameters<typeof MockPlatformAdapter>[1],
): void {
  registry.register(platform, () => new MockPlatformAdapter(platform, mockOptions));
}
