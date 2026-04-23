import { useMutation, useQueryClient } from "@tanstack/react-query";

import { authApi, isAuthSuccess } from "@/lib/api/auth-api";
import { authActions } from "@/stores/auth-store";

export function useLogoutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const result = await authApi.logout();

      if (!isAuthSuccess(result)) {
        throw new Error(result.error.message);
      }

      return result.data;
    },
    onSuccess: () => {
      authActions.logout();
      void queryClient.invalidateQueries({ queryKey: ["auth", "session"] });
    },
  });
}
