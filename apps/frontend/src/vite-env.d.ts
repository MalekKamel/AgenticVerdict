/// <reference types="vite/client" />

declare module "@web-csp-nonce" {
  /**
   * SSR: request-scoped nonce (AsyncLocalStorage). Client: from `<meta property="csp-nonce">`.
   */
  export function getCspNonce(): string | undefined;
}

interface ImportMetaEnv {
  readonly VITE_PUBLIC_API_URL?: string;
  readonly VITE_PUBLIC_TRPC_API_URL?: string;
  readonly VITE_PUBLIC_ENABLE_AUTH?: string;
  /** When `"true"`, MFA placeholder surfaces may render (default off). */
  readonly VITE_PUBLIC_ENABLE_MFA_UI?: string;
  /** Optional HTTPS endpoint for JSON telemetry (`client_error`, `web_vital`, `product_event`). */
  readonly VITE_PUBLIC_TELEMETRY_INGEST_URL?: string;
  /** Must match API `TELEMETRY_INGEST_SECRET` when ingest auth is enabled (public ingest key; abuse reduction only). */
  readonly VITE_PUBLIC_TELEMETRY_INGEST_TOKEN?: string;
  /** Probability (0–1) that a browser telemetry envelope is sent; default 1. */
  readonly VITE_PUBLIC_TELEMETRY_SAMPLE_RATE?: string;
  /** When `"true"`, `/dashboard/feature-flags` admin snapshot is available (default off). */
  readonly VITE_PUBLIC_ENABLE_FEATURE_FLAGS_ADMIN_UI?: string;
  /**
   * Comma-separated hostnames used with `extractTenantSlugFromHost` (e.g. `localhost` for `acme.localhost`).
   * When unset, slug-based tenant resolution is disabled.
   */
  readonly VITE_PUBLIC_TENANT_BASE_DOMAINS?: string;
  /** When `"true"`, multi-step onboarding at `/onboarding` is available (default off). */
  readonly VITE_PUBLIC_ENABLE_ONBOARDING_WIZARD?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/** Injected by `apps/desktop` preload (`contextBridge`). */
type AgenticDesktopApi = {
  readonly platform: "electron";
  getRuntimeConfig: () => { apiBaseUrl?: string };
  openExternal: (url: string) => Promise<void>;
  onDeepLink: (handler: (url: string) => void) => () => void;
};

interface Window {
  agenticDesktop?: AgenticDesktopApi;
}
