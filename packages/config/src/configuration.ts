import type { ConnectorType } from "@agenticverdict/types";

import { IS_PRODUCTION, NODE_ENV } from "./build-constants";
import {
  mockAdapterConnectorSchema,
  runtimeConfigSchema,
  type RuntimeConfig,
} from "./schemas/runtime-config";

const ALL_MOCK_CONNECTORS = mockAdapterConnectorSchema.options as readonly ConnectorType[];

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
export function isMockEnabledForConnector(
  connector: ConnectorType,
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  const nodeEnv = String(env.NODE_ENV ?? "");
  const masterRaw = env.AGENTICVERDICT_USE_MOCK_ADAPTERS;
  const connectorKey = `AGENTICVERDICT_MOCK_${connector.toUpperCase()}`;
  const connectorRaw = env[connectorKey];

  const master = parseBinaryFlag(masterRaw, "AGENTICVERDICT_USE_MOCK_ADAPTERS");
  const connectorOverride = parseBinaryFlag(connectorRaw, connectorKey);

  if (nodeEnv === "production" || nodeEnv === "staging") {
    if (master === true || connectorOverride === true) {
      throw new Error(
        `[SECURITY] Mock adapters cannot be enabled in ${nodeEnv} environment for connector "${connector}"`,
      );
    }
    return false;
  }

  if (Object.prototype.hasOwnProperty.call(env, connectorKey)) {
    return connectorOverride ?? false;
  }
  return master ?? false;
}

function mockEnabledConnectorsFromEnv(env: NodeJS.ProcessEnv): ConnectorType[] {
  if (!canEnableMocksViaEnv(env)) {
    return [];
  }
  return ALL_MOCK_CONNECTORS.filter((c) => isMockEnabledForConnector(c, env));
}

function readMockScenarioMap(env: NodeJS.ProcessEnv): Record<string, string> | undefined {
  const scenario = env.AGENTICVERDICT_MOCK_SCENARIO;
  if (!scenario) {
    return undefined;
  }
  return { default: scenario };
}

function buildRuntimeConfig(env: NodeJS.ProcessEnv = process.env): RuntimeConfig {
  const mockConnectors = mockEnabledConnectorsFromEnv(env);
  const config: RuntimeConfig = {
    adapters: {
      mocks: {
        enabled: mockConnectors.length > 0,
        connectors: [...mockConnectors],
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
  isMockEnabledForConnector: (connector: ConnectorType, env?: NodeJS.ProcessEnv) =>
    isMockEnabledForConnector(connector, env),
};
