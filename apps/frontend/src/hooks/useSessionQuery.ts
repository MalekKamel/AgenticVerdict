/**
 * Session Query Hook
 *
 * Hook for fetching and managing user session data.
 * Integrates with the auth store to keep state in sync.
 *
 * @example
 * ```tsx
 * import { useSessionQuery } from '@/hooks/useSessionQuery'
 *
 * function Dashboard() {
 *   const { data: session, isLoading, error } = useSessionQuery()
 *
 *   if (isLoading) return <LoadingSpinner />
 *   if (error) return <ErrorMessage />
 *   if (!session?.user) return <Redirect to="/auth/login" />
 *
 *   return <WelcomeMessage user={session.user} />
 * }
 * ```
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";

import { authActions } from "@/stores/auth-store";
import { authApi, isAuthSuccess } from "@/lib/api/auth-api";

/**
 * Session query hook
 *
 * Fetches the current user session.
 * Automatically updates auth store with session data.
 *
 * @param options - React Query options (enabled, refetchInterval, etc.)
 * @returns Query result with session data
 *
 * @example
 * ```tsx
 * // Basic usage
 * const { data: session, isLoading, error } = useSessionQuery()
 *
 * // Disable automatic fetching (manual control)
 * const { data: session } = useSessionQuery({ enabled: false })
 *
 * // Refetch every 5 minutes
 * const { data: session } = useSessionQuery({ refetchInterval: 5 * 60 * 1000 })
 * ```
 */
export function useSessionQuery(options?: {
  enabled?: boolean;
  refetchInterval?: number;
  refetchOnWindowFocus?: boolean;
}) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["auth", "session"],
    queryFn: async () => {
      const result = await authApi.getSession();

      if (!isAuthSuccess(result)) {
        throw new Error(result.error.message);
      }

      return result.data;
    },
    // Default options
    enabled: options?.enabled ?? true,
    /** Soft session refresh (sliding window) — adjust when real JWT expiry is wired */
    refetchInterval: options?.refetchInterval ?? 10 * 60 * 1000,
    refetchOnWindowFocus: options?.refetchOnWindowFocus ?? true,
    staleTime: 2 * 60 * 1000,
    retry: 1, // Retry once on network errors
  });

  // Keep auth store in sync with session data
  useEffect(() => {
    if (query.data) {
      const data = query.data;
      if (data.user) {
        authActions.setAuth(
          true,
          {
            id: data.user.id,
            email: data.user.email,
            firstName: data.user.firstName,
            lastName: data.user.lastName,
            emailVerified: data.user.emailVerified,
          },
          data.user.tenantId,
        );
      } else {
        authActions.logout();
      }
    }
  }, [query.data]);

  /**
   * Invalidate session query
   *
   * Use this to force a refetch of the session data.
   *
   * @example
   * ```tsx
   * const { refetch } = useSessionQuery()
   *
   * // Manually refetch session
   * refetch()
   * ```
   */
  const refetch = useCallback(() => {
    return queryClient.invalidateQueries({ queryKey: ["auth", "session"] });
  }, [queryClient]);

  /**
   * Clear session from cache
   *
   * Use this after logout to clear the session data.
   *
   * @example
   * ```tsx
   * const { clear } = useSessionQuery()
   *
   * // Clear session after logout
   * clear()
   * ```
   */
  const clear = useCallback(() => {
    queryClient.removeQueries({ queryKey: ["auth", "session"] });
  }, [queryClient]);

  return {
    ...query,
    refetch,
    clear,
  };
}

/**
 * Hook for checking if user is authenticated
 *
 * Convenience hook that returns boolean auth status.
 *
 * @example
 * ```tsx
 * function ProtectedRoute() {
 *   const { isAuthenticated, isLoading } = useIsAuthenticated()
 *
 *   if (isLoading) return <LoadingSpinner />
 *   if (!isAuthenticated) return <Redirect to="/auth/login" />
 *
 *   return <ProtectedContent />
 * }
 * ```
 */
export function useIsAuthenticated() {
  const { data: session, isLoading } = useSessionQuery();

  return {
    isAuthenticated: !!session?.user,
    isLoading,
    user: session?.user ?? null,
  };
}
