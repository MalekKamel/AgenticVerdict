import type { PlatformType } from "@agenticverdict/types";

import { IS_PRODUCTION, NODE_ENV } from "./build-constants";
import {
  mockAdapterPlatformSchema,
  runtimeConfigSchema,
  type RuntimeConfig,
} from "./schemas/runtime-config";

const ALL_MOCK_PLATFORMS = mockAdapterPlatformSchema.options as readonly PlatformType[];

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

/**
 * Whether mock adapters may be toggled via env for this process (Layer 1 security).
 * Uses raw `NODE_ENV` so values like `staging` are visible even though
 * `build-constants` normalizes unknown envs to `development`.
 */
export function canEnableMocksViaEnv(env: NodeJS.ProcessEnv = process.env): boolean {
  const raw = String(env.NODE_ENV ?? "");
  if (raw === "production" || raw === "staging") {
    return false;
  }
  if (IS_PRODUCTION) {
    return false;
  }
  return true;
}

/**
 * Per-platform mock enablement from environment (Layer 2).
 * Preserves precedence: production/staging guardrails, then per-platform override, then master flag.
 */
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

function mockEnabledPlatformsFromEnv(env: NodeJS.ProcessEnv): PlatformType[] {
  if (!canEnableMocksViaEnv(env)) {
    return [];
  }
  return ALL_MOCK_PLATFORMS.filter((p) => isMockEnabledForPlatform(p, env));
}

function readMockScenarioMap(env: NodeJS.ProcessEnv): Record<string, string> | undefined {
  const scenario = env.AGENTICVERDICT_MOCK_SCENARIO;
  if (!scenario) {
    return undefined;
  }
  return { default: scenario };
}

function buildRuntimeConfig(env: NodeJS.ProcessEnv = process.env): RuntimeConfig {
  const mockPlatforms = mockEnabledPlatformsFromEnv(env);
  const config: RuntimeConfig = {
    adapters: {
      mocks: {
        enabled: mockPlatforms.length > 0,
        platforms: [...mockPlatforms],
        scenarios: readMockScenarioMap(env),
      },
    },
    features: {
      enableNewReportGenerator: env.ENABLE_NEW_REPORT_GENERATOR === "true",
      enableAdvancedAnalytics: env.ENABLE_ADVANCED_ANALYTICS === "true",
    },
    experiments: {},
  };
  return runtimeConfigSchema.parse(config);
}

/**
 * Layered runtime configuration (validated). Reads env on each call so tests and
 * container overrides see updates without a cached singleton.
 */
export class ConfigurationService {
  static load(env: NodeJS.ProcessEnv = process.env): RuntimeConfig {
    return buildRuntimeConfig(env);
  }

  static areMockAdaptersEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
    return this.load(env).adapters.mocks.enabled;
  }
}

/** Build vs runtime layers (`config.build`, `config.runtime`, …). */
export const config = {
  get build() {
    return {
      NODE_ENV,
      IS_PRODUCTION,
    } as const;
  },
  runtime: (env?: NodeJS.ProcessEnv) => ConfigurationService.load(env),
  mocksEnabled: (env?: NodeJS.ProcessEnv) => ConfigurationService.areMockAdaptersEnabled(env),
  isMockEnabledForPlatform: (platform: PlatformType, env?: NodeJS.ProcessEnv) =>
    isMockEnabledForPlatform(platform, env),
};
