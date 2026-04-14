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

import { createTRPCClient } from "@trpc/client";
import { createTRPCReact, httpBatchLink, loggerLink } from "@trpc/react-query";
import type { AnyRouter } from "@trpc/server";
import superjson from "superjson";

// Note: Replace with the concrete AppRouter from @agenticverdict/api when the backend is wired.
type AppRouter = AnyRouter;

/**
 * tRPC React Query integration
 *
 * Provides hooks for type-safe API calls with automatic caching, refetching, and error handling.
 */
export const trpc = createTRPCReact<AppRouter>();

/**
 * Get the API base URL from environment or default to localhost
 */
function getBaseUrl(): string {
  if (typeof window !== "undefined") {
    // Browser: use relative URL (works with proxy or same-origin)
    return "";
  }

  const apiUrl =
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_PUBLIC_API_URL) ||
    process.env.VITE_PUBLIC_API_URL ||
    process.env.API_URL;
  if (apiUrl) {
    return apiUrl;
  }

  // Default to localhost for development
  return "http://localhost:3001";
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
    // HTTP-only cookies are sent automatically by the browser
    // No need to manually attach headers for authentication
    headers: () => {
      // Add custom headers here if needed
      // Note: DO NOT add Authorization header - cookies handle auth
      return {};
    },
    // Transform requests/responses using SuperJSON for Date, BigInt, etc.
    transformer: superjson,
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

        retry: (failureCount: number, error: unknown) => {
          // Don't retry on 4xx errors (client errors)
          const errorData = error as { data?: { httpStatus?: number } };
          const httpStatus = errorData?.data?.httpStatus;

          if (httpStatus && httpStatus >= 400 && httpStatus < 500) {
            return false;
          }

          // Retry up to 3 times on network/server errors
          return failureCount < 3;
        },
        // Cache time: 5 minutes for session data
        staleTime: 5 * 60 * 1000,
      },
      mutations: {
        retry: (failureCount: number, error: unknown) => {
          // Don't retry mutations on 4xx errors
          const errorData = error as { data?: { httpStatus?: number } };
          const httpStatus = errorData?.data?.httpStatus;

          if (httpStatus && httpStatus >= 400 && httpStatus < 500) {
            return false;
          }

          // Retry once on network/server errors
          return failureCount < 1;
        },
      },
    },
  },
};

/**
 * Bare tRPC client for server-side usage
 *
 * Use this in route loaders, server components, or server actions.
 * NOT for use in React components (use trpc hooks instead).
 */
export const trpcClient = createTRPCClient<AppRouter>({
  links,
});
