import { useMutation } from "@tanstack/react-query";
import { useRouter } from "@/i18n/navigation";

import { authApi, isAuthSuccess } from "@/lib/api/auth-api";
import { logAuthFunnelEvent } from "@/lib/observability/auth-funnel-analytics";
import { getEffectiveTenantId, isTenantUuid } from "@/lib/tenant/tenant-resolution";
import { authStore } from "@/stores/auth-store";
import type { RegisterInput } from "@agenticverdict/types";
import { AuthMutationError, type AuthMutationErrorDetails } from "./usePasswordReset";

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
      const authTenantId =
        authStore.state.isAuthenticated && isTenantUuid(authStore.state.tenantId)
          ? authStore.state.tenantId
          : undefined;
      const effectiveTenantId = isTenantUuid(variables.tenantId)
        ? variables.tenantId
        : getEffectiveTenantId({ authTenantId });
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
