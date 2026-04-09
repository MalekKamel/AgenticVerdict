import {
  createPlatformAdapter,
  platformAdapterTypes,
  type MockAdapterScenario,
  type PlatformAdapter,
} from "@agenticverdict/platform-adapters";
import type { PlatformFetchToolDeps } from "@agenticverdict/agent-runtime";
import type { PlatformType } from "@agenticverdict/types";

const PLATFORM_TYPE_SET = new Set<PlatformType>(platformAdapterTypes);
type WorkerTenantContext = {
  tenantId: string;
  config: {
    marketing: {
      channels: Array<{
        platform: PlatformType;
        enabled: boolean;
      }>;
    };
  };
};

export function toPlatformType(value: string): PlatformType | null {
  if (PLATFORM_TYPE_SET.has(value as PlatformType)) {
    return value as PlatformType;
  }
  return null;
}

export function getEnabledTenantPlatforms(tenant: WorkerTenantContext): PlatformType[] {
  return tenant.config.marketing.channels
    .filter((channel) => channel.enabled)
    .map((channel) => channel.platform);
}

export interface WorkerPlatformDepsInput {
  tenant: WorkerTenantContext;
  mockScenario?: MockAdapterScenario;
  mockSeed?: number;
}

export function createWorkerPlatformFetchToolDeps(
  input: WorkerPlatformDepsInput,
): PlatformFetchToolDeps {
  const enabled = new Set(getEnabledTenantPlatforms(input.tenant));
  const adapterCache = new Map<PlatformType, PlatformAdapter>();

  const getAdapter = (platform: PlatformType): PlatformAdapter => {
    if (!enabled.has(platform)) {
      throw new Error(`Platform "${platform}" is not enabled for tenant ${input.tenant.tenantId}`);
    }
    const cached = adapterCache.get(platform);
    if (cached) {
      return cached;
    }
    const adapter = createPlatformAdapter({
      platform,
      tenantId: input.tenant.tenantId,
      mockScenario: input.mockScenario ?? "realistic",
      mockSeed: input.mockSeed,
    });
    adapterCache.set(platform, adapter);
    return adapter;
  };

  return {
    getAdapter,
    authenticateAdapter: async (adapter) => {
      await adapter.authenticate({
        accessToken: "worker-mock-token",
      });
    },
  };
}
