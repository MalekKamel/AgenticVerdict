import { useMutation, useQueryClient } from "@tanstack/react-query";

import { authApi, isAuthSuccess } from "@/features/auth/api/auth-api";
import { authActions } from "@/features/auth/model/state/auth-store";

export function useLogoutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const result = await authApi.logout();

      if (!isAuthSuccess(result)) {
        throw {
          code: result.error.code,
          messageKey: result.error.message,
          retryable: false,
        };
      }

      return result.data;
    },
    onSuccess: () => {
      authActions.logout();
      void queryClient.invalidateQueries({ queryKey: ["auth", "session"] });
    },
  });
}
