import type { ConnectorType } from "@agenticverdict/types";

const ALLOWED_RUNTIME_ENVS = ["development", "test", "staging", "production"] as const;
const ALLOWED_MOCK_MODES = ["off", "selective", "all"] as const;
const ALLOWED_AUTH_MODES = ["real", "mock"] as const;
const CONNECTORS = [
  "meta",
  "ga4",
  "gsc",
  "gbp",
  "tiktok",
] as const satisfies readonly ConnectorType[];

export type RuntimeEnv = (typeof ALLOWED_RUNTIME_ENVS)[number];
export type RuntimeMockMode = (typeof ALLOWED_MOCK_MODES)[number];
export type FrontendAuthApiMode = (typeof ALLOWED_AUTH_MODES)[number];
export type RuntimePolicyFeature =
  | "reportFormats"
  | "emailDelivery"
  | "authApi"
  | "tenantSyntheticFallback"
  | "connectors";

export type RuntimePolicy = {
  runtimeEnv: RuntimeEnv;
  mockMode: RuntimeMockMode;
  mockConnectors: ConnectorType[];
  mockScenario?: string;
  stubs: {
    reportFormats: boolean;
    emailDelivery: boolean;
  };
  frontend: {
    authApiMode: FrontendAuthApiMode;
  };
  tenant: {
    allowSyntheticFallback: boolean;
  };
};

function parseBinaryFlag(value: string | undefined, key: string): boolean | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value === "0") {
    return false;
  }
  if (value === "1") {
    return true;
  }
  throw new Error(`[CONFIG] ${key} must be "0" or "1", received "${value}"`);
}

function normalizeRuntimeEnv(input: string | undefined): RuntimeEnv {
  if (!input || input.length === 0) {
    return "development";
  }
  if ((ALLOWED_RUNTIME_ENVS as readonly string[]).includes(input)) {
    return input as RuntimeEnv;
  }
  throw new Error(
    `[CONFIG] AGENTICVERDICT_RUNTIME_ENV must be one of ${ALLOWED_RUNTIME_ENVS.join(", ")}, received "${input}"`,
  );
}

function inferRuntimeEnvFromNodeEnv(input: string | undefined): RuntimeEnv {
  if (input === "production") {
    return "production";
  }
  if (input === "test") {
    return "test";
  }
  if (input === "staging") {
    return "staging";
  }
  return "development";
}

function parseMockMode(input: string | undefined): RuntimeMockMode | undefined {
  if (input === undefined || input.length === 0) {
    return undefined;
  }
  if ((ALLOWED_MOCK_MODES as readonly string[]).includes(input)) {
    return input as RuntimeMockMode;
  }
  throw new Error(
    `[CONFIG] AGENTICVERDICT_MOCK_MODE must be one of ${ALLOWED_MOCK_MODES.join(", ")}, received "${input}"`,
  );
}

function parseConnectorList(input: string | undefined): ConnectorType[] {
  if (!input) {
    return [];
  }
  const normalized = input
    .split(",")
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);
  const unique = [...new Set(normalized)];
  for (const connector of unique) {
    if (!(CONNECTORS as readonly string[]).includes(connector)) {
      throw new Error(
        `[CONFIG] AGENTICVERDICT_MOCK_CONNECTORS contains unsupported connector "${connector}"`,
      );
    }
  }
  return unique as ConnectorType[];
}

function parseAuthApiMode(input: string | undefined): FrontendAuthApiMode | undefined {
  if (!input || input.length === 0) {
    return undefined;
  }
  if ((ALLOWED_AUTH_MODES as readonly string[]).includes(input)) {
    return input as FrontendAuthApiMode;
  }
  throw new Error(
    `[CONFIG] VITE_PUBLIC_AUTH_API_MODE must be one of ${ALLOWED_AUTH_MODES.join(", ")}, received "${input}"`,
  );
}

function isProductionLike(env: RuntimeEnv): boolean {
  return env === "staging" || env === "production";
}

export function resolveRuntimePolicy(env: NodeJS.ProcessEnv = process.env): RuntimePolicy {
  const explicitRuntimeEnv = env.AGENTICVERDICT_RUNTIME_ENV;
  const runtimeEnv = explicitRuntimeEnv
    ? normalizeRuntimeEnv(explicitRuntimeEnv)
    : inferRuntimeEnvFromNodeEnv(env.NODE_ENV);

  const explicitMockMode = parseMockMode(env.AGENTICVERDICT_MOCK_MODE);
  const explicitConnectors = parseConnectorList(env.AGENTICVERDICT_MOCK_CONNECTORS);
  const mockMode: RuntimeMockMode = explicitMockMode ?? "off";

  const mockConnectors =
    mockMode === "all" ? [...CONNECTORS] : mockMode === "selective" ? explicitConnectors : [];
  if (mockMode === "selective" && mockConnectors.length === 0) {
    throw new Error(
      "[CONFIG] AGENTICVERDICT_MOCK_CONNECTORS is required when AGENTICVERDICT_MOCK_MODE=selective",
    );
  }

  const stubsReport = parseBinaryFlag(
    env.AGENTICVERDICT_STUB_REPORT_FORMATS,
    "AGENTICVERDICT_STUB_REPORT_FORMATS",
  );
  const stubsEmail = parseBinaryFlag(
    env.AGENTICVERDICT_STUB_EMAIL_DELIVERY,
    "AGENTICVERDICT_STUB_EMAIL_DELIVERY",
  );
  const authApiMode = parseAuthApiMode(env.VITE_PUBLIC_AUTH_API_MODE) ?? "real";

  const policy: RuntimePolicy = {
    runtimeEnv,
    mockMode,
    mockConnectors,
    mockScenario: env.AGENTICVERDICT_MOCK_SCENARIO?.trim() || undefined,
    stubs: {
      reportFormats: stubsReport ?? false,
      emailDelivery: stubsEmail ?? false,
    },
    frontend: {
      authApiMode,
    },
    tenant: {
      allowSyntheticFallback: runtimeEnv === "test",
    },
  };

  assertProductionSafeRuntimePolicy(policy);
  return policy;
}

export function assertProductionSafeRuntimePolicy(policy: RuntimePolicy): void {
  if (!isProductionLike(policy.runtimeEnv)) {
    return;
  }
  if (policy.mockMode !== "off" || policy.mockConnectors.length > 0) {
    throw new Error(
      `[SECURITY] Connector mocks are forbidden in ${policy.runtimeEnv}. Set AGENTICVERDICT_MOCK_MODE=off.`,
    );
  }
  if (policy.stubs.reportFormats) {
    throw new Error(
      `[SECURITY] Report format stubs are forbidden in ${policy.runtimeEnv}. Set AGENTICVERDICT_STUB_REPORT_FORMATS=0.`,
    );
  }
  if (policy.stubs.emailDelivery) {
    throw new Error(
      `[SECURITY] Email delivery stubs are forbidden in ${policy.runtimeEnv}. Set AGENTICVERDICT_STUB_EMAIL_DELIVERY=0.`,
    );
  }
  if (policy.frontend.authApiMode !== "real") {
    throw new Error(`[SECURITY] Frontend auth API mode must be "real" in ${policy.runtimeEnv}.`);
  }
}

export function isFeatureMockEnabled(
  policy: RuntimePolicy,
  feature: RuntimePolicyFeature,
  connector?: ConnectorType,
): boolean {
  if (feature === "reportFormats") {
    return policy.stubs.reportFormats;
  }
  if (feature === "emailDelivery") {
    return policy.stubs.emailDelivery;
  }
  if (feature === "authApi") {
    return policy.frontend.authApiMode === "mock";
  }
  if (feature === "tenantSyntheticFallback") {
    return policy.tenant.allowSyntheticFallback;
  }
  if (!connector) {
    return policy.mockMode !== "off";
  }
  return policy.mockMode === "all" || policy.mockConnectors.includes(connector);
}
