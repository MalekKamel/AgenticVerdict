import { QueryClient } from "@tanstack/react-query";

import { trpcClientConfig } from "@/lib/api/trpc-client";

function createQueryClient(): QueryClient {
  return new QueryClient(trpcClientConfig.queryClientConfig);
}

let browserQueryClient: QueryClient | undefined;

/**
 * Returns a QueryClient suitable for the current environment.
 * Server: new client per request (avoids cross-request cache leaks).
 * Browser: stable singleton for the SPA lifetime.
 */
export function getQueryClient(): QueryClient {
  if (typeof window === "undefined") {
    return createQueryClient();
  }
  if (!browserQueryClient) {
    browserQueryClient = createQueryClient();
  }
  return browserQueryClient;
}
