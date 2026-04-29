import { useAuthStore, authActions } from "@/stores/auth-store";

export function useAuth() {
  const auth = useAuthStore();

  return {
    isAuthenticated: auth.isAuthenticated,
    user: auth.user,
    tenantId: auth.tenantId,
    isLoading: auth.isLoading,
    error: auth.error,
    setAuth: authActions.setAuth,
    setUser: authActions.setUser,
    setTenantId: authActions.setTenantId,
    setLoading: authActions.setLoading,
    setError: authActions.setError,
    clearError: authActions.clearError,
    logout: authActions.logout,
    hasUser: auth.user !== null,
    isEmailVerified: auth.user?.emailVerified ?? false,
    userFullName: auth.user ? `${auth.user.firstName} ${auth.user.lastName}`.trim() : undefined,
  };
}

export function isAuthenticated(auth: ReturnType<typeof useAuth>): auth is ReturnType<
  typeof useAuth
> & {
  user: NonNullable<typeof auth.user>;
  tenantId: NonNullable<typeof auth.tenantId>;
} {
  return auth.isAuthenticated && auth.user !== null && auth.tenantId !== null;
}
