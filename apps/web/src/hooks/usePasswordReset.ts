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
  return useMutation({
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
    },
    onError: (error) => {
      // Log error for debugging
      console.error("Password reset request failed:", error.message);
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
export function useConfirmPasswordReset() {
  const router = useRouter();
  const search = useRouterState({ select: (s) => s.location.search });
  const token = new URLSearchParams(search).get("token") || "";

  return useMutation({
    mutationFn: async (input: Omit<ConfirmPasswordResetInput, "token">) => {
      // Validate token exists
      if (!token) {
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
      // Redirect to login page after successful password reset
      router.push("/auth/login");
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
