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

export function usePasswordResetMutations() {
  const requestPasswordReset = useRequestPasswordReset();
  const confirmPasswordReset = useConfirmPasswordReset();

  return {
    request: requestPasswordReset,
    confirm: confirmPasswordReset,
  };
}
