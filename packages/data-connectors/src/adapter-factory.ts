import { IS_PRODUCTION } from "@agenticverdict/config/build-constants";
import { isMockEnabledForConnector } from "@agenticverdict/config/configuration";
import type { ConnectorType } from "@agenticverdict/types";

import type { BaseConnectorAdapterOptions, ConnectorAdapter } from "./adapter";
import { Ga4ConnectorAdapter } from "./ga4/ga4-adapter";
import { GbpConnectorAdapter } from "./gbp/gbp-adapter";
import { GscConnectorAdapter } from "./gsc/gsc-adapter";
import { MetaConnectorAdapter } from "./meta/meta-adapter";
import { MockAdapterFactory } from "./mock-adapter-factory";
import type { MockAdapterScenario } from "./mock-static-data";
import { TikTokConnectorAdapter } from "./tiktok/tiktok-adapter";

export const connectorAdapterTypes = ["meta", "ga4", "gsc", "gbp", "tiktok"] as const;

export interface AdapterFactoryConfig extends BaseConnectorAdapterOptions {
  readonly connector: ConnectorType;
  readonly useMock?: boolean;
  readonly mockSeed?: number;
  readonly mockScenario?: MockAdapterScenario;
}

function baseOptions(config: AdapterFactoryConfig): BaseConnectorAdapterOptions {
  return {
    tenantId: config.tenantId,
    cache: config.cache,
    cacheTtlSeconds: config.cacheTtlSeconds,
    circuitBreaker: config.circuitBreaker,
    circuitBreakerOptions: config.circuitBreakerOptions,
    tokenBucket: config.tokenBucket,
    backoff: config.backoff,
    metrics: config.metrics,
    deadLetterQueue: config.deadLetterQueue,
  };
}

function shouldUseMockAdapter(connector: ConnectorType, explicitUseMock?: boolean): boolean {
  if (explicitUseMock === true) {
    if (IS_PRODUCTION) {
      return false;
    }
    return true;
  }
  if (explicitUseMock === false) {
    return false;
  }
  if (IS_PRODUCTION) {
    return false;
  }
  return isMockEnabledForConnector(connector);
}

function createProductionAdapter(
  connector: ConnectorType,
  options: BaseConnectorAdapterOptions,
): ConnectorAdapter {
  switch (connector) {
    case "meta":
      return new MetaConnectorAdapter(options);
    case "ga4":
      return new Ga4ConnectorAdapter(options);
    case "gsc":
      return new GscConnectorAdapter(options);
    case "gbp":
      return new GbpConnectorAdapter(options);
    case "tiktok":
      return new TikTokConnectorAdapter(options);
    default: {
      const exhaustive: never = connector;
      throw new Error(`Unsupported connector: ${String(exhaustive)}`);
    }
  }
}

export function createConnectorAdapter(factoryConfig: AdapterFactoryConfig): ConnectorAdapter {
  const { connector, useMock, ...rest } = factoryConfig;
  const shared = baseOptions({ connector, useMock, ...rest });

  if (shouldUseMockAdapter(connector, useMock)) {
    return MockAdapterFactory.create({
      connector,
      seed: factoryConfig.mockSeed,
      scenario: factoryConfig.mockScenario ?? "normal",
      ...shared,
    });
  }

  return createProductionAdapter(connector, shared);
}

export { config, isMockEnabledForConnector } from "@agenticverdict/config/configuration";
