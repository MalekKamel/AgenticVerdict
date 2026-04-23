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

import { useRouter } from "@/i18n/navigation";

import { authApi, isAuthSuccess } from "@/lib/api/auth-api";
import { logAuthFunnelEvent } from "@/lib/observability/auth-funnel-analytics";
import type { RequestPasswordResetInput, ConfirmPasswordResetInput } from "@agenticverdict/types";

export interface AuthMutationErrorDetails {
  retryAfter?: number | string;
  retryAfterSeconds?: number | string;
  [key: string]: unknown;
}

export class AuthMutationError extends Error {
  code: string;
  details?: AuthMutationErrorDetails;
  retryAfterSeconds: number | null;

  constructor(message: string, code: string, details?: AuthMutationErrorDetails) {
    super(message);
    this.name = "AuthMutationError";
    this.code = code;
    this.details = details;
    this.retryAfterSeconds = getRetryAfterSeconds(details);
  }
}

function getRetryAfterSeconds(details?: AuthMutationErrorDetails): number | null {
  const raw = details?.retryAfterSeconds ?? details?.retryAfter;
  if (typeof raw === "number" && Number.isFinite(raw) && raw > 0) {
    return Math.round(raw);
  }
  if (typeof raw === "string") {
    const parsed = Number(raw);
    if (Number.isFinite(parsed) && parsed > 0) {
      return Math.round(parsed);
    }
  }
  return null;
}

function toAuthMutationError(error: unknown, fallbackCode: string): AuthMutationError {
  if (error instanceof AuthMutationError) {
    return error;
  }
  if (error instanceof Error) {
    return new AuthMutationError(error.message, fallbackCode);
  }
  return new AuthMutationError("auth.errors.internalError", fallbackCode);
}

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
        throw new AuthMutationError(
          result.error.message,
          result.error.code,
          result.error.details as AuthMutationErrorDetails | undefined,
        );
      }

      return result.data;
    },
    onSuccess: () => {
      logAuthFunnelEvent("auth.forgot_password.result", {
        flow: "forgot_password",
        outcome: "success",
        latencyMs: Math.round(performance.now() - startedAt),
      });
    },
    onError: (error) => {
      const authError = toAuthMutationError(error, "REQUEST_RESET_FAILED");
      logAuthFunnelEvent("auth.forgot_password.result", {
        flow: "forgot_password",
        outcome: "failure",
        errorCode: authError.code,
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
  let startedAt = 0;

  return useMutation({
    onMutate: (input) => {
      startedAt = performance.now();
      const token = "token" in input ? input.token : (tokenOverride ?? "");
      logAuthFunnelEvent("auth.reset_password.submit", {
        flow: "reset_password",
        tokenPresent: Boolean(token),
      });
    },
    mutationFn: async (input: ConfirmPasswordResetPayload) => {
      const token = "token" in input ? input.token : (tokenOverride ?? "");

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
        throw new AuthMutationError(
          result.error.message,
          result.error.code,
          result.error.details as AuthMutationErrorDetails | undefined,
        );
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
      const authError = toAuthMutationError(error, "RESET_PASSWORD_FAILED");
      const invalidToken = authError.message.includes("invalidToken");
      logAuthFunnelEvent("auth.reset_password.result", {
        flow: "reset_password",
        outcome: "failure",
        errorCode: invalidToken ? "INVALID_TOKEN" : authError.code,
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
