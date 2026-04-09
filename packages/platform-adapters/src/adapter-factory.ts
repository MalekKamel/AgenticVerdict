import { IS_PRODUCTION } from "@agenticverdict/config/build-constants";
import { isMockEnabledForPlatform } from "@agenticverdict/config/configuration";
import type { PlatformType } from "@agenticverdict/types";

import type { BasePlatformAdapterOptions, PlatformAdapter } from "./adapter";
import { Ga4PlatformAdapter } from "./ga4/ga4-adapter";
import { GbpPlatformAdapter } from "./gbp/gbp-adapter";
import { GscPlatformAdapter } from "./gsc/gsc-adapter";
import { MetaPlatformAdapter } from "./meta/meta-adapter";
import { MockAdapterFactory } from "./mock-adapter-factory";
import type { MockAdapterScenario } from "./mock-static-data";
import { TikTokPlatformAdapter } from "./tiktok/tiktok-adapter";

export const platformAdapterTypes = ["meta", "ga4", "gsc", "gbp", "tiktok"] as const;

export interface AdapterFactoryConfig extends BasePlatformAdapterOptions {
  readonly platform: PlatformType;
  readonly useMock?: boolean;
  readonly mockSeed?: number;
  readonly mockScenario?: MockAdapterScenario;
}

function baseOptions(config: AdapterFactoryConfig): BasePlatformAdapterOptions {
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

function shouldUseMockAdapter(platform: PlatformType, explicitUseMock?: boolean): boolean {
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
  return isMockEnabledForPlatform(platform);
}

function createProductionAdapter(
  platform: PlatformType,
  options: BasePlatformAdapterOptions,
): PlatformAdapter {
  switch (platform) {
    case "meta":
      return new MetaPlatformAdapter(options);
    case "ga4":
      return new Ga4PlatformAdapter(options);
    case "gsc":
      return new GscPlatformAdapter(options);
    case "gbp":
      return new GbpPlatformAdapter(options);
    case "tiktok":
      return new TikTokPlatformAdapter(options);
    default: {
      const exhaustive: never = platform;
      throw new Error(`Unsupported platform: ${String(exhaustive)}`);
    }
  }
}

export function createPlatformAdapter(factoryConfig: AdapterFactoryConfig): PlatformAdapter {
  const { platform, useMock, ...rest } = factoryConfig;
  const shared = baseOptions({ platform, useMock, ...rest });

  if (shouldUseMockAdapter(platform, useMock)) {
    return MockAdapterFactory.create({
      platform,
      seed: factoryConfig.mockSeed,
      scenario: factoryConfig.mockScenario ?? "normal",
      ...shared,
    });
  }

  return createProductionAdapter(platform, shared);
}

export { config, isMockEnabledForPlatform } from "@agenticverdict/config/configuration";
