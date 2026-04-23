import { useMutation } from "@tanstack/react-query";

import { authApi, isAuthSuccess } from "@/lib/api/auth-api";
import { AuthMutationError, type AuthMutationErrorDetails } from "@/hooks/usePasswordReset";
import type { ResendEmailVerificationInput, VerifyEmailInput } from "@agenticverdict/types";

export function useVerifyEmailMutation() {
  return useMutation({
    mutationFn: async (input: VerifyEmailInput) => {
      const result = await authApi.verifyEmail(input);

      if (!isAuthSuccess(result)) {
        throw new AuthMutationError(
          result.error.message,
          result.error.code,
          result.error.details as AuthMutationErrorDetails | undefined,
        );
      }

      return result.data;
    },
  });
}

export function useResendEmailVerificationMutation() {
  return useMutation({
    mutationFn: async (input: ResendEmailVerificationInput) => {
      const result = await authApi.resendEmailVerification(input);

      if (!isAuthSuccess(result)) {
        throw new AuthMutationError(
          result.error.message,
          result.error.code,
          result.error.details as AuthMutationErrorDetails | undefined,
        );
      }

      return result.data;
    },
  });
}
