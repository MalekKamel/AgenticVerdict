/**
 * tRPC Client Configuration
 *
 * This file configures the tRPC client for type-safe API communication
 * between the TanStack Start frontend and the tRPC v11 backend.
 *
 * Architecture:
 * - Uses tRPC v11 with React Query integration
 * - HTTP-only cookie-based session management
 * - End-to-end type safety without code generation
 * - Automatic error handling and retries
 *
 * @example
 * ```tsx
 * import { trpc } from '@/lib/api/trpc-client'
 *
 * function MyComponent() {
 *   const { data, error, isLoading } = trpc.auth.getSession.useQuery()
 * }
 * ```
 */

import { createTRPCReact, httpBatchLink, loggerLink } from "@trpc/react-query";
import superjson from "superjson";

import type { AppRouter } from "@agenticverdict/api/trpc";

import { getTenantIdForTrpcRequest } from "@agenticverdict/core/tenant/trpc-tenant-bridge";

import { shouldRetryTrpcMutation, shouldRetryTrpcQuery } from "./trpc-retry-policy";

/**
 * tRPC React Query integration
 *
 * Provides hooks for type-safe API calls with automatic caching, refetching, and error handling.
 */
export const trpc = createTRPCReact<AppRouter>();

function getDesktopApiBaseUrl(): string | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }
  const desktop = window.agenticDesktop;
  if (!desktop || desktop.platform !== "electron") {
    return undefined;
  }
  const url = desktop.getRuntimeConfig()?.apiBaseUrl?.trim();
  if (url) {
    return url.replace(/\/$/, "");
  }
  return undefined;
}

export function inferDevApiBaseUrlFromBrowserLocation(input: {
  protocol: string;
  hostname: string;
  port?: string;
}): string {
  const frontendPort = Number(input.port);
  const pairedApiPort =
    Number.isFinite(frontendPort) && frontendPort >= 3000 && frontendPort < 4000
      ? frontendPort + 1000
      : 4000;
  return `${input.protocol}//${input.hostname}:${pairedApiPort}`;
}

/**
 * Get the API base URL from environment or default to localhost
 */
function getBaseUrl(): string {
  const runtimeEnv = process.env.AGENTICVERDICT_RUNTIME_ENV ?? process.env.NODE_ENV;
  const isProductionLike = runtimeEnv === "production" || runtimeEnv === "staging";
  if (typeof window !== "undefined") {
    const fromDesktop = getDesktopApiBaseUrl();
    if (fromDesktop) {
      return fromDesktop;
    }
    const fromVite =
      typeof import.meta !== "undefined" && import.meta.env?.VITE_PUBLIC_API_URL
        ? String(import.meta.env.VITE_PUBLIC_API_URL).trim()
        : "";
    if (fromVite) {
      return fromVite.replace(/\/$/, "");
    }
    // Browser fallback for local dev: frontend :300x pairs with API :400x.
    if (isProductionLike) {
      throw new Error("VITE_PUBLIC_API_URL is required in production-like runtime");
    }
    return inferDevApiBaseUrlFromBrowserLocation({
      protocol: window.location.protocol,
      hostname: window.location.hostname,
      port: window.location.port,
    });
  }

  const apiUrl =
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_PUBLIC_API_URL) ||
    process.env.VITE_PUBLIC_API_URL ||
    process.env.API_URL;
  if (apiUrl) {
    return apiUrl;
  }

  if (isProductionLike) {
    throw new Error("API_URL or VITE_PUBLIC_API_URL must be set in production-like runtime");
  }
  // Default to local API service port during local development.
  return "http://localhost:4000";
}

/** Included in tests to verify `x-tenant-id` alignment with `authStore`. */
export function buildTrpcHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  const tenantId = getTenantIdForTrpcRequest();
  if (tenantId) {
    headers["x-tenant-id"] = tenantId;
  }
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    headers["x-request-id"] = crypto.randomUUID();
  }
  return headers;
}

/**
 * Session probes must not send inferred tenant hints. Backend resolves tenant from
 * the signed session JWT/cookie and rejects mismatched `x-tenant-id` headers.
 */
export function buildTrpcHeadersWithoutTenant(): Record<string, string> {
  const headers: Record<string, string> = {};
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    headers["x-request-id"] = crypto.randomUUID();
  }
  return headers;
}

/**
 * Configure tRPC links
 *
 * Links are the middleware chain for tRPC requests:
 * 1. loggerLink: Development logging
 * 2. httpBatchLink: HTTP batch requests to the API
 */
const links = [
  // Log requests in development
  loggerLink({
    enabled: (opts) =>
      process.env.NODE_ENV === "development" ||
      (opts.direction === "down" && opts.result instanceof Error),
  }),
  // HTTP batch link for API calls
  httpBatchLink({
    url: `${getBaseUrl()}/api/v1/trpc`,
    // HTTP-only cookies are sent automatically by the browser for same-origin / credentialed calls.
    headers: () => buildTrpcHeaders(),
    // Transform requests/responses using SuperJSON for Date, BigInt, etc.
    transformer: superjson,
    fetch(url, options) {
      return fetch(url, { ...options, credentials: "include" });
    },
  }),
];

/**
 * tRPC client configuration for React Query integration
 *
 * This is the primary client used in React components via the trpc hooks.
 */
export const trpcClientConfig = {
  links,
  // Enable queries to refetch on window focus (optional)
  queryClientConfig: {
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,

        retry: (failureCount: number, error: unknown) => shouldRetryTrpcQuery(failureCount, error),
        // Cache time: 5 minutes for session data
        staleTime: 5 * 60 * 1000,
      },
      mutations: {
        retry: (failureCount: number, error: unknown) =>
          shouldRetryTrpcMutation(failureCount, error),
      },
    },
  },
};

/**
 * Shared tRPC client for React (`trpc.Provider`) and loaders/server usage.
 * Headers are evaluated per request so `x-tenant-id` stays aligned with `authStore`.
 */
export const trpcClient = trpc.createClient({
  links,
});

export const trpcClientWithoutTenantHeader = trpc.createClient({
  links: [
    loggerLink({
      enabled: (opts) =>
        process.env.NODE_ENV === "development" ||
        (opts.direction === "down" && opts.result instanceof Error),
    }),
    httpBatchLink({
      url: `${getBaseUrl()}/api/v1/trpc`,
      headers: () => buildTrpcHeadersWithoutTenant(),
      transformer: superjson,
      fetch(url, options) {
        return fetch(url, { ...options, credentials: "include" });
      },
    }),
  ],
});
