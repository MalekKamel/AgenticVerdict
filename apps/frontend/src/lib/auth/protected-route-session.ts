/**
 * Server-side session probe for protected routes (`beforeLoad`).
 * Forwards incoming `Authorization`, `Cookie`, and `x-tenant-id` to the Fastify tRPC API so
 * `auth.getSession` sees the same credentials as the browser client.
 *
 * **Dev mock auth** (`VITE_PUBLIC_AUTH_API_MOCK` not `"false"`): skips the SSR gate so the
 * in-memory mock in `auth-api.ts` remains client-only; `useRequireAuth` still guards after hydration.
 */

import { createServerFn } from "@tanstack/react-start";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { getRequest } from "@tanstack/react-start/server";
import superjson from "superjson";

import type { AppRouter } from "@agenticverdict/api/trpc";

function isDevAuthApiMockEnabled(): boolean {
  if (import.meta.env.PROD) {
    return false;
  }
  return import.meta.env.VITE_PUBLIC_AUTH_API_MOCK !== "false";
}

function getApiBaseUrlForServer(): string {
  const fromEnv =
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_PUBLIC_API_URL) ||
    process.env.VITE_PUBLIC_API_URL ||
    process.env.API_URL;
  if (fromEnv && fromEnv.length > 0) {
    return fromEnv.replace(/\/$/, "");
  }
  return "http://localhost:3001";
}

export type ProtectedRouteSessionResult = {
  /**
   * When true, `beforeLoad` must not redirect — dev mock session exists only in the browser bundle.
   */
  skipSsrGuard: boolean;
  authenticated: boolean;
};

export const fetchProtectedRouteSession = createServerFn({ method: "GET" }).handler(
  async (): Promise<ProtectedRouteSessionResult> => {
    if (isDevAuthApiMockEnabled()) {
      return { skipSsrGuard: true, authenticated: false };
    }

    try {
      const req = getRequest();
      const cookie = req.headers.get("cookie") ?? "";
      const authorization = req.headers.get("authorization") ?? "";
      const tenantId = req.headers.get("x-tenant-id") ?? "";

      const forward: Record<string, string> = {};
      if (cookie) {
        forward.cookie = cookie;
      }
      if (authorization) {
        forward.authorization = authorization;
      }
      if (tenantId) {
        forward["x-tenant-id"] = tenantId;
      }
      if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        forward["x-request-id"] = crypto.randomUUID();
      }

      const base = getApiBaseUrlForServer();
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
              });
            },
          }),
        ],
      });

      const data = await client.auth.getSession.query();
      return { skipSsrGuard: false, authenticated: !!data.user };
    } catch {
      return { skipSsrGuard: false, authenticated: false };
    }
  },
);
