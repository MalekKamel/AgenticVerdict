import { useAuthStore, authActions } from "@/stores/auth-store";

/**
 * useAuth hook
 *
 * Provides access to authentication state and actions throughout the application.
 * This hook serves as the primary interface for components to interact with
 * the authentication store.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isAuthenticated, user, logout, isLoading } = useAuth();
 *
 *   if (isLoading) {
 *     return <LoadingSpinner />;
 *   }
 *
 *   if (!isAuthenticated) {
 *     return <PleaseLogin />;
 *   }
 *
 *   return <div>Welcome, {user?.firstName}</div>;
 * }
 * ```
 *
 * @returns Authentication state and actions
 */
export function useAuth() {
  const auth = useAuthStore();

  return {
    // State
    isAuthenticated: auth.isAuthenticated,
    user: auth.user,
    tenantId: auth.tenantId,
    isLoading: auth.isLoading,
    error: auth.error,

    // Actions
    setAuth: authActions.setAuth,
    setUser: authActions.setUser,
    setTenantId: authActions.setTenantId,
    setLoading: authActions.setLoading,
    setError: authActions.setError,
    clearError: authActions.clearError,
    logout: authActions.logout,

    // Computed values for convenience
    hasUser: auth.user !== null,
    isEmailVerified: auth.user?.emailVerified ?? false,
    userFullName: auth.user ? `${auth.user.firstName} ${auth.user.lastName}`.trim() : undefined,
  };
}

/**
 * Type guard to check if user is authenticated
 *
 * @example
 * ```tsx
 * function ProtectedComponent() {
 *   const auth = useAuth();
 *
 *   if (!isAuthenticated(auth)) {
 *     return null;
 *   }
 *
 *   // TypeScript knows auth.user is defined here
 *   return <div>{auth.user.email}</div>;
 * }
 * ```
 */
export function isAuthenticated(auth: ReturnType<typeof useAuth>): auth is ReturnType<
  typeof useAuth
> & {
  user: NonNullable<typeof auth.user>;
  tenantId: NonNullable<typeof auth.tenantId>;
} {
  return auth.isAuthenticated && auth.user !== null && auth.tenantId !== null;
}
