import {
  createConnectorAdapter,
  connectorAdapterTypes,
  type MockAdapterScenario,
  type ConnectorAdapter,
} from "@agenticverdict/data-connectors";
import type { PlatformFetchToolDeps } from "@agenticverdict/agent-runtime";
import type { ConnectorType } from "@agenticverdict/types";

const PLATFORM_TYPE_SET = new Set<ConnectorType>(connectorAdapterTypes);
type WorkerTenantContext = {
  tenantId: string;
  config: {
    marketing: {
      channels: Array<{
        platform: ConnectorType;
        enabled: boolean;
      }>;
    };
  };
};

export function toConnectorType(value: string): ConnectorType | null {
  if (PLATFORM_TYPE_SET.has(value as ConnectorType)) {
    return value as ConnectorType;
  }
  return null;
}

export function getEnabledTenantConnectors(tenant: WorkerTenantContext): ConnectorType[] {
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
  const enabled = new Set(getEnabledTenantConnectors(input.tenant));
  const adapterCache = new Map<ConnectorType, ConnectorAdapter>();

  const getAdapter = (platform: ConnectorType): ConnectorAdapter => {
    if (!enabled.has(platform)) {
      throw new Error(`Platform "${platform}" is not enabled for tenant ${input.tenant.tenantId}`);
    }
    const cached = adapterCache.get(platform);
    if (cached) {
      return cached;
    }
    const adapter = createConnectorAdapter({
      connector: platform,
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
