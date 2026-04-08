/**
 * Build-time configuration constants derived from `process.env.NODE_ENV`.
 *
 * Bundlers (e.g. esbuild) can replace `process.env.NODE_ENV` so dead branches
 * that depend on these values may be dropped in production bundles.
 */

const rawNodeEnv = process.env.NODE_ENV;

export const NODE_ENV: "development" | "production" | "test" =
  rawNodeEnv === "production" || rawNodeEnv === "test" || rawNodeEnv === "development"
    ? rawNodeEnv
    : "development";

/** Whether this process is running with `NODE_ENV === "production"`. */
export const IS_PRODUCTION = NODE_ENV === "production";

/**
 * Whether mock adapters are permitted by default for this process.
 * Production deployments use real adapters; dev/test may use mocks via env flags.
 */
export const MOCK_ADAPTERS_ENABLED = NODE_ENV !== "production";

/** Recorded when this module is first evaluated (use for diagnostics only). */
export const BUILD_TIMESTAMP = Date.now();

export const API_VERSION = "v1" as const;

const buildConfigInner = {
  environment: NODE_ENV,
  isProduction: IS_PRODUCTION,
  mockAdaptersEnabled: MOCK_ADAPTERS_ENABLED,
  timestamp: BUILD_TIMESTAMP,
  version: API_VERSION,
} as const;

export const BUILD_CONFIG = Object.freeze(buildConfigInner);

export type BuildConfig = typeof buildConfigInner;

export function isProductionBuild(): boolean {
  return IS_PRODUCTION;
}

export function isDevelopmentBuild(): boolean {
  return NODE_ENV === "development";
}

export function isTestBuild(): boolean {
  return NODE_ENV === "test";
}
