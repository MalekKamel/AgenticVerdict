/**
 * useLoginMutation Hook
 *
 * Task T032: Login mutation hook with tRPC
 *
 * Features:
 * - tRPC mutation wrapper
 * - Error handling with generic messages
 * - Success handling with redirect
 * - Loading states
 * - Auth store integration
 *
 * @example
 * ```tsx
 * const { login, isLoading, error, clearError } = useLoginMutation();
 *
 * const handleSubmit = async (data) => {
 *   await login(data);
 * };
 * ```
 */

"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouterState } from "@tanstack/react-router";

import { useRouter } from "@/i18n/navigation";
import { authActions } from "@/stores/auth-store";
import { authApi } from "@/lib/api/auth-api";
import { logAuthFunnelEvent } from "@/lib/observability/auth-funnel-analytics";
import type { LoginInput } from "@agenticverdict/types";
import { useCallback, useState } from "react";

export interface UseLoginMutationReturn {
  /** Login mutation function */
  login: (credentials: LoginInput) => Promise<void>;

  /** Loading state */
  isLoading: boolean;

  /** Error message */
  error: string | null;

  /** Clear error state */
  clearError: () => void;
}

export function resolvePostLoginRedirect(redirectFromSearch: string | null): string {
  if (!redirectFromSearch || !redirectFromSearch.startsWith("/")) {
    return "/dashboard";
  }

  if (redirectFromSearch.startsWith("/auth")) {
    return "/dashboard";
  }

  return redirectFromSearch;
}

function classifyRedirectTarget(redirectFromSearch: string | null): {
  target: string;
  redirectClass: "dashboard_default" | "safe_internal" | "auth_loop_blocked";
} {
  if (!redirectFromSearch || !redirectFromSearch.startsWith("/")) {
    return { target: "/dashboard", redirectClass: "dashboard_default" };
  }

  if (redirectFromSearch.startsWith("/auth")) {
    return { target: "/dashboard", redirectClass: "auth_loop_blocked" };
  }

  return { target: redirectFromSearch, redirectClass: "safe_internal" };
}

/**
 * Hook for handling login mutation
 *
 * Provides a complete login flow with:
 * - Loading states
 * - Error handling with generic messages (security)
 * - Auth state management
 * - Automatic redirect on success
 */
export function useLoginMutation(): UseLoginMutationReturn {
  const router = useRouter();
  const queryClient = useQueryClient();
  const search = useRouterState({ select: (s) => s.location.search });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectFromSearch = new URLSearchParams(search).get("redirect");

  const login = useCallback(
    async (credentials: LoginInput) => {
      const startedAt = performance.now();
      setIsLoading(true);
      setError(null);
      authActions.setLoading(true);
      authActions.clearError();
      logAuthFunnelEvent("auth.login.submit", { flow: "login" });

      try {
        const result = await authApi.login(credentials);
        const latencyMs = Math.round(performance.now() - startedAt);

        if (result.success) {
          // Update auth store
          const { user } = result.data;
          authActions.setAuth(true, user, user.tenantId);
          await queryClient.invalidateQueries({ queryKey: ["auth", "session"] });

          // Clear loading states
          setIsLoading(false);
          authActions.setLoading(false);

          // Keep locale-aware redirect destination while preventing auth-route loops.
          const { target, redirectClass } = classifyRedirectTarget(redirectFromSearch);
          logAuthFunnelEvent("auth.login.result", {
            flow: "login",
            outcome: "success",
            latencyMs,
            redirectClass,
          });
          router.push(target);
        } else {
          // Handle error - use generic message for security
          const genericError = "Invalid email or password";
          setError(genericError);
          authActions.setError({
            code: result.error.code,
            message: genericError,
          });
          logAuthFunnelEvent("auth.login.result", {
            flow: "login",
            outcome: "failure",
            errorCode: result.error.code,
            latencyMs,
          });
          setIsLoading(false);
          authActions.setLoading(false);
        }
      } catch {
        // Handle unexpected errors
        const genericError = "An error occurred. Please try again.";
        setError(genericError);
        authActions.setError({
          code: "INTERNAL_ERROR",
          message: genericError,
        });
        logAuthFunnelEvent("auth.login.result", {
          flow: "login",
          outcome: "failure",
          errorCode: "INTERNAL_ERROR",
          latencyMs: Math.round(performance.now() - startedAt),
        });
        setIsLoading(false);
        authActions.setLoading(false);
      }
    },
    [queryClient, redirectFromSearch, router],
  );

  const clearError = useCallback(() => {
    setError(null);
    authActions.clearError();
  }, []);

  return {
    login,
    isLoading,
    error,
    clearError,
  };
}

export default useLoginMutation;
