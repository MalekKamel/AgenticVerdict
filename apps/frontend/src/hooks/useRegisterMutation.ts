/**
 * useRegisterMutation Hook
 *
 * Custom hook that wraps the registration API call with React Query mutation.
 * Handles success/error states and redirects to verification page on success.
 *
 * @see T050: Create useRegisterMutation hook
 *
 * @example
 * ```tsx
 * import { useRegisterMutation } from '@/hooks/useRegisterMutation'
 *
 * function RegisterForm() {
 *   const register = useRegisterMutation()
 *
 *   const handleSubmit = (data) => {
 *     register.mutate(data, {
 *       onSuccess: () => {
 *         console.log('Registration successful')
 *       }
 *     })
 *   }
 *
 *   return <form onSubmit={handleSubmit}>...</form>
 * }
 * ```
 */

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "@/i18n/navigation";

import { authApi, isAuthSuccess } from "@/lib/api/auth-api";
import { logAuthFunnelEvent } from "@/lib/observability/auth-funnel-analytics";
import { getEffectiveTenantId, isTenantUuid } from "@/lib/tenant/tenant-resolution";
import { authStore } from "@/stores/auth-store";
import type { RegisterInput } from "@agenticverdict/types";
import { AuthMutationError, type AuthMutationErrorDetails } from "@/hooks/usePasswordReset";

/**
 * Register mutation hook
 *
 * Creates a new user account and handles the response:
 * - On success: Redirects to verification page
 * - On error: Returns error message for display
 *
 * The hook does NOT update the auth store since users must verify
 * their email before being authenticated.
 *
 * @returns React Query mutation with registration state
 *
 * @example
 * ```tsx
 * const register = useRegisterMutation()
 *
 * if (register.isPending) {
 *   return <LoadingSpinner />
 * }
 *
 * if (register.isError) {
 *   return <ErrorMessage error={register.error} />
 * }
 *
 * return <RegisterForm onSubmit={(data) => register.mutate(data)} />
 * ```
 */
export function useRegisterMutation() {
  const router = useRouter();
  let startedAt = 0;

  return useMutation({
    onMutate: () => {
      startedAt = performance.now();
      logAuthFunnelEvent("auth.register.submit", { flow: "register" });
    },
    mutationFn: async (input: RegisterInput) => {
      const result = await authApi.register(input);

      if (!isAuthSuccess(result)) {
        throw new AuthMutationError(
          result.error.message,
          result.error.code,
          result.error.details as AuthMutationErrorDetails | undefined,
        );
      }

      return result.data;
    },
    onSuccess: (_data, variables) => {
      logAuthFunnelEvent("auth.register.result", {
        flow: "register",
        outcome: "success",
        latencyMs: Math.round(performance.now() - startedAt),
      });

      const params = new URLSearchParams({ email: variables.email });
      const effectiveTenantId = isTenantUuid(variables.tenantId)
        ? variables.tenantId
        : getEffectiveTenantId({ authTenantId: authStore.state.tenantId });
      if (effectiveTenantId) {
        params.set("tenantId", effectiveTenantId);
      }
      router.push(`/auth/verify-email?${params.toString()}`);
    },
    onError: (error) => {
      const authError =
        error instanceof AuthMutationError
          ? error
          : new AuthMutationError("auth.errors.internalError", "INTERNAL_ERROR");
      logAuthFunnelEvent("auth.register.result", {
        flow: "register",
        outcome: "failure",
        errorCode: authError.code,
        latencyMs: Math.round(performance.now() - startedAt),
      });
    },
  });
}
