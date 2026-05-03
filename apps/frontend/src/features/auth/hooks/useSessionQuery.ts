import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";
import type { Permission, TenantType, TenantStatus } from "@agenticverdict/types";

import { authActions } from "@/stores/auth-store";
import { authApi, isAuthSuccess } from "@/lib/api/auth-api";

export function useSessionQuery(options?: {
  enabled?: boolean;
  refetchInterval?: number;
  refetchOnWindowFocus?: boolean;
}) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["auth", "session"],
    queryFn: async () => {
      const result = await authApi.getSession();

      if (!isAuthSuccess(result)) {
        throw {
          code: result.error.code,
          messageKey: result.error.message,
          retryable: false,
        };
      }

      return result.data;
    },
    enabled: options?.enabled ?? true,
    refetchInterval: options?.refetchInterval ?? 10 * 60 * 1000,
    refetchOnWindowFocus: options?.refetchOnWindowFocus ?? true,
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });

  useEffect(() => {
    if (query.data) {
      const data = query.data;
      if (data.user) {
        authActions.setAuth(
          true,
          {
            id: data.user.id,
            email: data.user.email,
            firstName: data.user.firstName,
            lastName: data.user.lastName,
            emailVerified: data.user.emailVerified,
            roles: data.user.roles,
            permissions: data.user.permissions as Permission[],
            tenantId: data.user.tenantId,
            tenantType: data.user.tenantType as TenantType,
            tenantStatus: data.user.tenantStatus as TenantStatus,
          },
          data.user.tenantId,
          data.user.tenantType as TenantType,
          data.user.tenantStatus as TenantStatus,
        );
      } else {
        authActions.logout();
      }
    }
  }, [query.data]);

  const refetch = useCallback(() => {
    return queryClient.invalidateQueries({ queryKey: ["auth", "session"] });
  }, [queryClient]);

  const clear = useCallback(() => {
    queryClient.removeQueries({ queryKey: ["auth", "session"] });
  }, [queryClient]);

  return {
    ...query,
    refetch,
    clear,
  };
}

export function useIsAuthenticated() {
  const { data: session, isLoading } = useSessionQuery();

  return {
    isAuthenticated: !!session?.user,
    isLoading,
    user: session?.user ?? null,
  };
}
