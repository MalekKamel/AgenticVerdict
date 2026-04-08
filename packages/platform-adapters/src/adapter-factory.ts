import { IS_PRODUCTION } from "@agenticverdict/config/build-constants";
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

function parseBinaryFlag(value: string | undefined, flagName: string): boolean | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value === "0") {
    return false;
  }
  if (value === "1") {
    return true;
  }
  throw new Error(`[CONFIG] ${flagName} must be "0" or "1", received "${value}"`);
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

export function isMockEnabledForPlatform(
  platform: PlatformType,
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  const nodeEnv = String(env.NODE_ENV ?? "");
  const masterRaw = env.AGENTICVERDICT_USE_MOCK_ADAPTERS;
  const platformKey = `AGENTICVERDICT_MOCK_${platform.toUpperCase()}`;
  const platformRaw = env[platformKey];

  const master = parseBinaryFlag(masterRaw, "AGENTICVERDICT_USE_MOCK_ADAPTERS");
  const platformOverride = parseBinaryFlag(platformRaw, platformKey);

  if (nodeEnv === "production" || nodeEnv === "staging") {
    if (master === true || platformOverride === true) {
      throw new Error(
        `[SECURITY] Mock adapters cannot be enabled in ${nodeEnv} environment for platform "${platform}"`,
      );
    }
    return false;
  }

  if (Object.prototype.hasOwnProperty.call(env, platformKey)) {
    return platformOverride ?? false;
  }
  return master ?? false;
}

export function createPlatformAdapter(config: AdapterFactoryConfig): PlatformAdapter {
  const shared = baseOptions(config);

  if (!IS_PRODUCTION) {
    const allowMock =
      config.useMock === true ||
      (config.useMock !== false && isMockEnabledForPlatform(config.platform));
    if (allowMock) {
      return MockAdapterFactory.create({
        platform: config.platform,
        seed: config.mockSeed,
        scenario: config.mockScenario ?? "normal",
        ...shared,
      });
    }
  }

  switch (config.platform) {
    case "meta":
      return new MetaPlatformAdapter(shared);
    case "ga4":
      return new Ga4PlatformAdapter(shared);
    case "gsc":
      return new GscPlatformAdapter(shared);
    case "gbp":
      return new GbpPlatformAdapter(shared);
    case "tiktok":
      return new TikTokPlatformAdapter(shared);
    default: {
      const exhaustive: never = config.platform;
      throw new Error(`Unsupported platform: ${String(exhaustive)}`);
    }
  }
}
