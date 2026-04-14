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

import { useRouter } from "@/i18n/navigation";
import { authActions } from "@/stores/auth-store";
import { authApi } from "@/lib/api/auth-api";
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(
    async (credentials: LoginInput) => {
      setIsLoading(true);
      setError(null);
      authActions.setLoading(true);
      authActions.clearError();

      try {
        const result = await authApi.login(credentials);

        if (result.success) {
          // Update auth store
          const { user } = result.data;
          authActions.setAuth(true, user, user.tenantId);

          // Clear loading states
          setIsLoading(false);
          authActions.setLoading(false);

          // Redirect to dashboard
          router.push("/dashboard");
        } else {
          // Handle error - use generic message for security
          const genericError = "Invalid email or password";
          setError(genericError);
          authActions.setError({
            code: result.error.code,
            message: genericError,
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
        setIsLoading(false);
        authActions.setLoading(false);
      }
    },
    [router],
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
