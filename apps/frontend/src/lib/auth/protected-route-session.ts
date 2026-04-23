/**
 * Server-side session probe for protected routes (`beforeLoad`).
 * Forwards incoming `Authorization` and `Cookie` to the Fastify tRPC API so
 * `auth.getSession` sees the same credentials as the browser client.
 *
 * **Dev mock auth** (`VITE_PUBLIC_AUTH_API_MODE=mock`): skips the SSR gate so the
 * in-memory mock in `auth-api.ts` remains client-only; `useRequireAuth` still guards after hydration.
 *
 * **SPA / `build:spa`:** Dashboard `beforeLoad` skips this server function; rely on
 * {@link useRequireAuth} (client) for redirects — expect a brief unauthenticated paint (FOUC) vs SSR.
 *
 * **Tenant safety:** `auth.getSession` is intentionally called without `x-tenant-id` to avoid
 * false tenant mismatch signals while tenant is derived from signed auth context.
 */

import { createServerFn } from "@tanstack/react-start";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { getRequest } from "@tanstack/react-start/server";
import superjson from "superjson";

import type { AppRouter } from "@agenticverdict/api/trpc";
import { isFrontendAuthApiMockEnabled } from "./frontend-runtime-policy";
import { resolveAuthResolutionState, type AuthResolutionState } from "./auth-resolution-state";
import { resolveServerApiBaseUrls } from "./resolve-server-api-base-urls";

export type ProtectedRouteSessionResult = {
  authState: AuthResolutionState;
};

const SSR_AUTH_PROBE_TIMEOUT_MS = 2_500;

export const fetchProtectedRouteSession = createServerFn({ method: "GET" }).handler(
  async (): Promise<ProtectedRouteSessionResult> => {
    if (isFrontendAuthApiMockEnabled()) {
      return {
        // Browser-only auth mock has no SSR session visibility; treat as anonymous so
        // protected routes still redirect to login instead of silently deferring.
        authState: { kind: "anonymous" },
      };
    }

    try {
      const req = getRequest();
      const cookie = req.headers.get("cookie") ?? "";
      const authorization = req.headers.get("authorization") ?? "";
      const forward: Record<string, string> = {};
      if (cookie) {
        forward.cookie = cookie;
      }
      if (authorization) {
        forward.authorization = authorization;
      }
      // `auth.getSession` derives tenant from JWT/cookie; forwarding inferred tenant
      // hints can cause false TENANT_MISMATCH and auth-route redirect loops.
      if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        forward["x-request-id"] = crypto.randomUUID();
      }

      const candidateBases = resolveServerApiBaseUrls(req, {
        vitePublicApiUrl:
          (typeof import.meta !== "undefined" && import.meta.env?.VITE_PUBLIC_API_URL) ||
          process.env.VITE_PUBLIC_API_URL,
        apiUrl: process.env.API_URL,
      });

      for (const base of candidateBases) {
        try {
          const timeoutSignal =
            typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function"
              ? AbortSignal.timeout(SSR_AUTH_PROBE_TIMEOUT_MS)
              : undefined;
          const client = createTRPCClient<AppRouter>({
            links: [
              httpBatchLink({
                url: `${base}/api/v1/trpc`,
                transformer: superjson,
                fetch(url, options) {
                  const merged = new Headers(options?.headers);
                  for (const [k, v] of Object.entries(forward)) {
                    merged.set(k, v);
                  }
                  return globalThis.fetch(url, {
                    ...options,
                    credentials: "include",
                    headers: merged,
                    signal: timeoutSignal ?? options?.signal,
                  });
                },
              }),
            ],
          });

          const data = await client.auth.getSession.query();
          return {
            authState: resolveAuthResolutionState({
              session: data,
            }),
          };
        } catch {
          // Try next base URL candidate.
        }
      }

      throw new Error("Unable to resolve API base URL for SSR auth probe");
    } catch {
      return {
        authState: resolveAuthResolutionState({
          session: null,
          sessionCheckFailed: true,
        }),
      };
    }
  },
);
