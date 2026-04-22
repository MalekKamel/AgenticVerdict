/**
 * Password Reset Hooks
 *
 * Custom hooks that wrap password reset API calls with React Query mutations.
 * These hooks provide proper error handling and type safety for the password reset flow.
 *
 * @see T068: Create useRequestPasswordReset hook
 * @see T082: Create useConfirmPasswordReset hook
 */

import { useMutation } from "@tanstack/react-query";
import { useRouterState } from "@tanstack/react-router";

import { useRouter } from "@/i18n/navigation";

import { authApi, isAuthSuccess } from "@/lib/api/auth-api";
import { logAuthFunnelEvent } from "@/lib/observability/auth-funnel-analytics";
import type { RequestPasswordResetInput, ConfirmPasswordResetInput } from "@agenticverdict/types";

/**
 * T068: Request password reset mutation hook
 *
 * Initiates password reset flow by sending a reset link email.
 * Shows generic success message for both existing and non-existing emails
 * to prevent email enumeration attacks.
 *
 * Security: The success message is intentionally generic to prevent
 * attackers from determining which email addresses are registered.
 *
 * @example
 * ```tsx
 * import { useRequestPasswordReset } from '@/hooks/usePasswordReset'
 *
 * function ForgotPasswordForm() {
 *   const requestReset = useRequestPasswordReset()
 *
 *   const handleSubmit = (data) => {
 *     requestReset.mutate(data, {
 *       onSuccess: (data) => {
 *         console.log(data.message)
 *         // Show generic success message
 *         // "If an account exists with this email, a password reset link has been sent"
 *       }
 *     })
 *   }
 *
 *   return <form onSubmit={handleSubmit}>...</form>
 * }
 * ```
 */
export function useRequestPasswordReset() {
  let startedAt = 0;
  return useMutation({
    onMutate: () => {
      startedAt = performance.now();
      logAuthFunnelEvent("auth.forgot_password.submit", { flow: "forgot_password" });
    },
    mutationFn: async (input: RequestPasswordResetInput) => {
      const result = await authApi.requestPasswordReset(input);

      if (!isAuthSuccess(result)) {
        throw new Error(result.error.message);
      }

      return result.data;
    },
    onSuccess: (data) => {
      // Log success for debugging
      console.log("Password reset request successful:", data.message);

      // Note: We show the same success message for both existing and non-existing emails
      // This prevents email enumeration attacks
      // The backend should return a generic message
      logAuthFunnelEvent("auth.forgot_password.result", {
        flow: "forgot_password",
        outcome: "success",
        latencyMs: Math.round(performance.now() - startedAt),
      });
    },
    onError: (error) => {
      // Log error for debugging
      console.error("Password reset request failed:", error.message);
      logAuthFunnelEvent("auth.forgot_password.result", {
        flow: "forgot_password",
        outcome: "failure",
        errorCode: "REQUEST_RESET_FAILED",
        latencyMs: Math.round(performance.now() - startedAt),
      });
    },
  });
}

/**
 * Confirm password reset mutation hook
 *
 * Sets a new password using a valid reset token.
 * Handles token validation, error states, and automatic redirect on success.
 *
 * Features:
 * - Token validation from URL query parameter
 * - Automatic redirect to login on success
 * - Error handling for expired/used tokens
 * - Loading states
 *
 * @example
 * ```tsx
 * import { useConfirmPasswordReset } from '@/hooks/usePasswordReset'
 *
 * function ResetPasswordPage() {
 *   const { confirmPasswordReset, isPending, error } = useConfirmPasswordReset()
 *
 *   const handleSubmit = (password: string) => {
 *     confirmPasswordReset(
 *       { password },
 *       {
 *         onSuccess: () => {
 *           // Already redirects to login automatically
 *         }
 *       }
 *     )
 *   }
 *
 *   return <ResetPasswordForm onSubmit={handleSubmit} isLoading={isPending} error={error?.message} />
 * }
 * ```
 */
type ConfirmPasswordResetPayload =
  | ConfirmPasswordResetInput
  | Omit<ConfirmPasswordResetInput, "token">;

export function useConfirmPasswordReset(tokenOverride?: string) {
  const router = useRouter();
  const search = useRouterState({ select: (s) => s.location.search });
  const tokenFromSearch = new URLSearchParams(search).get("token") || "";
  let startedAt = 0;

  return useMutation({
    onMutate: (input) => {
      startedAt = performance.now();
      const token = "token" in input ? input.token : (tokenOverride ?? tokenFromSearch);
      logAuthFunnelEvent("auth.reset_password.submit", {
        flow: "reset_password",
        tokenPresent: Boolean(token),
      });
    },
    mutationFn: async (input: ConfirmPasswordResetPayload) => {
      const token = "token" in input ? input.token : (tokenOverride ?? tokenFromSearch);

      // Validate token exists
      if (!token) {
        logAuthFunnelEvent("auth.reset_password.result", {
          flow: "reset_password",
          outcome: "failure",
          errorCode: "INVALID_TOKEN",
          tokenPresent: false,
        });
        throw new Error("auth.resetPassword.errors.invalidToken");
      }

      const result = await authApi.confirmPasswordReset({
        token,
        newPassword: input.newPassword,
      });

      if (!isAuthSuccess(result)) {
        throw new Error(result.error.message);
      }

      return result.data;
    },
    onSuccess: () => {
      logAuthFunnelEvent("auth.reset_password.result", {
        flow: "reset_password",
        outcome: "success",
        tokenPresent: true,
        latencyMs: Math.round(performance.now() - startedAt),
      });
      // Redirect to login page after successful password reset
      router.push("/auth/login");
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "";
      const invalidToken = message.includes("invalidToken");
      logAuthFunnelEvent("auth.reset_password.result", {
        flow: "reset_password",
        outcome: "failure",
        errorCode: invalidToken ? "INVALID_TOKEN" : "RESET_PASSWORD_FAILED",
        tokenPresent: !invalidToken,
        latencyMs: Math.round(performance.now() - startedAt),
      });
    },
  });
}

/**
 * Combined password reset operations hook
 *
 * Provides all password reset mutations in a single hook for convenience.
 *
 * @example
 * ```tsx
 * const passwordReset = usePasswordResetMutations()
 *
 * // Request password reset
 * passwordReset.request.mutate({ email: 'user@example.com' })
 *
 * // Confirm password reset
 * passwordReset.confirm.mutate({ newPassword: 'NewPassword123!' })
 * ```
 */
export function usePasswordResetMutations() {
  const requestPasswordReset = useRequestPasswordReset();
  const confirmPasswordReset = useConfirmPasswordReset();

  return {
    request: requestPasswordReset,
    confirm: confirmPasswordReset,
  };
}
