import type { ConnectorType } from "@agenticverdict/types";

import { IS_PRODUCTION, NODE_ENV } from "./build-constants";
import { isFeatureMockEnabled, resolveRuntimePolicy, type RuntimePolicy } from "./runtime-policy";
import {
  mockAdapterConnectorSchema,
  runtimeConfigSchema,
  type RuntimeConfig,
} from "./schemas/runtime-config";

const ALL_MOCK_CONNECTORS = mockAdapterConnectorSchema.options as readonly ConnectorType[];

/**
 * Whether mock adapters may be toggled via env for this process (Layer 1 security).
 * Uses raw `NODE_ENV` so values like `staging` are visible even though
 * `build-constants` normalizes unknown envs to `development`.
 */
export function canEnableMocksViaEnv(env: NodeJS.ProcessEnv = process.env): boolean {
  const policy = resolveRuntimePolicy(env);
  return policy.runtimeEnv === "development" || policy.runtimeEnv === "test";
}

/**
 * Per-platform mock enablement from environment (Layer 2).
 * Preserves precedence: production/staging guardrails, then per-platform override, then master flag.
 */
export function isMockEnabledForConnector(
  connector: ConnectorType,
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  const policy = resolveRuntimePolicy(env);
  return isFeatureMockEnabled(policy, "connectors", connector);
}

function mockEnabledConnectorsFromEnv(env: NodeJS.ProcessEnv): ConnectorType[] {
  const policy = resolveRuntimePolicy(env);
  if (policy.mockMode === "all") {
    return [...ALL_MOCK_CONNECTORS];
  }
  if (policy.mockMode === "selective") {
    return ALL_MOCK_CONNECTORS.filter((connector) => policy.mockConnectors.includes(connector));
  }
  return [];
}

function readMockScenarioMap(policy: RuntimePolicy): Record<string, string> | undefined {
  const scenario = policy.mockScenario;
  if (!scenario) {
    return undefined;
  }
  return { default: scenario };
}

function buildRuntimeConfig(env: NodeJS.ProcessEnv = process.env): RuntimeConfig {
  const policy = resolveRuntimePolicy(env);
  const mockConnectors = mockEnabledConnectorsFromEnv(env);
  const config: RuntimeConfig = {
    adapters: {
      mocks: {
        enabled: mockConnectors.length > 0,
        connectors: [...mockConnectors],
        scenarios: readMockScenarioMap(policy),
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
  isMockEnabledForConnector: (connector: ConnectorType, env?: NodeJS.ProcessEnv) =>
    isMockEnabledForConnector(connector, env),
};
