import {
  createConnectorAdapter,
  type MockAdapterScenario,
  type ConnectorAdapter,
} from "@agenticverdict/data-connectors";
import type { PlatformFetchToolDeps } from "@agenticverdict/agent-runtime";
import type { ConnectorType } from "@agenticverdict/types";
import { CONNECTOR_PLATFORMS } from "@agenticverdict/types";

import { getDecryptedPlatformCredentials } from "./services/credential-store";
import { getWorkerRootLogger } from "./queues/logger";

const logger = getWorkerRootLogger();

const PLATFORM_TYPE_SET = new Set<ConnectorType>(CONNECTOR_PLATFORMS);
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

/**
 * Checks if mock credentials should be used via environment variable.
 */
function shouldUseMockCredentials(): boolean {
  return process.env.USE_MOCK_CREDENTIALS === "1";
}

/**
 * Validates that a credential object has a usable access token.
 */
function isValidCredential(credential: { accessToken?: string } | null): boolean {
  return !!credential && !!credential.accessToken && credential.accessToken.length > 0;
}

/**
 * Creates an authenticateAdapter closure for a specific platform.
 * Fetches real credentials from DB with mock fallback.
 */
function createAuthenticateForPlatform(
  tenantId: string,
  platform: ConnectorType,
): (adapter: ConnectorAdapter) => Promise<void> {
  return async (adapter: ConnectorAdapter): Promise<void> => {
    if (shouldUseMockCredentials()) {
      await adapter.authenticate({ accessToken: "worker-mock-token" });
      return;
    }

    try {
      const credential = await getDecryptedPlatformCredentials(tenantId, platform);
      if (credential && isValidCredential(credential)) {
        await adapter.authenticate({ accessToken: credential.accessToken });
        return;
      }
    } catch (err) {
      logger.warn(
        { platform, tenantId, error: String(err) },
        "Failed to fetch credentials, using mock authentication",
      );
    }

    logger.warn(
      { platform, tenantId },
      "No valid credentials available, falling back to mock authentication — this will return simulated data",
    );
    await adapter.authenticate({ accessToken: "worker-mock-token" });
  };
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
    authenticateAdapter: async (adapter: ConnectorAdapter) => {
      if (shouldUseMockCredentials()) {
        await adapter.authenticate({ accessToken: "worker-mock-token" });
        return;
      }

      const platform = adapter.connector;

      try {
        const credential = await getDecryptedPlatformCredentials(input.tenant.tenantId, platform);
        if (credential && isValidCredential(credential)) {
          await adapter.authenticate({ accessToken: credential.accessToken });
          return;
        }
      } catch (err) {
        logger.warn(
          { platform, tenantId: input.tenant.tenantId, error: String(err) },
          "Failed to fetch credentials, using mock authentication",
        );
      }

      logger.warn(
        { platform, tenantId: input.tenant.tenantId },
        "No valid credentials available, falling back to mock authentication — this will return simulated data",
      );
      await adapter.authenticate({ accessToken: "worker-mock-token" });
    },
  };
}

/**
 * Creates PlatformFetchToolDeps with per-platform credential authentication.
 * Each platform gets its own authenticateAdapter closure that fetches the correct credentials.
 */
export function createWorkerPlatformFetchToolDepsPerPlatform(
  input: WorkerPlatformDepsInput,
  platform: ConnectorType,
): PlatformFetchToolDeps {
  const adapterCache = new Map<ConnectorType, ConnectorAdapter>();

  const getAdapter = (p: ConnectorType): ConnectorAdapter => {
    const cached = adapterCache.get(p);
    if (cached) {
      return cached;
    }
    const adapter = createConnectorAdapter({
      connector: p,
      tenantId: input.tenant.tenantId,
      mockScenario: input.mockScenario ?? "realistic",
      mockSeed: input.mockSeed,
    });
    adapterCache.set(p, adapter);
    return adapter;
  };

  return {
    getAdapter,
    authenticateAdapter: createAuthenticateForPlatform(input.tenant.tenantId, platform),
  };
}
