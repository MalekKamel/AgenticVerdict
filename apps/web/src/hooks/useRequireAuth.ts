import { useEffect } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useAuth } from "./useAuth";

/**
 * useRequireAuth hook
 *
 * Protected route guard that redirects unauthenticated users to the login page.
 * This hook should be used in pages or components that require authentication.
 *
 * @param redirectTo - Optional path to redirect to if not authenticated (default: "/login")
 *
 * @example
 * ```tsx
 * function DashboardPage() {
 *   useRequireAuth();
 *
 *   // If we reach here, the user is authenticated
 *   return <Dashboard />;
 * }
 * ```
 *
 * @example
 * ```tsx
 * function SettingsPage() {
 *   useRequireAuth("/login?redirect=/settings");
 *
 *   return <Settings />;
 * }
 * ```
 */
export function useRequireAuth(redirectTo: string = "/login") {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Preserve the current path for redirect after login
      const currentPath = pathname !== redirectTo ? pathname : undefined;
      const redirectUrl = currentPath
        ? `${redirectTo}?redirect=${encodeURIComponent(currentPath)}`
        : redirectTo;

      router.push(redirectUrl);
    }
  }, [isAuthenticated, isLoading, router, pathname, redirectTo]);

  return {
    isAuthenticated,
    isLoading,
    isReady: !isLoading && isAuthenticated,
  };
}

/**
 * Type guard for components that require authentication
 *
 * Use this to narrow types when you know authentication is required.
 *
 * @example
 * ```tsx
 * function ProtectedComponent() {
 *   const auth = useAuth();
 *
 *   if (!isAuthenticatedGuard(auth)) {
 *     return null;
 *   }
 *
 *   // TypeScript knows auth.user is defined here
 *   return <div>Welcome, {auth.user.firstName}</div>;
 * }
 * ```
 */
export function isAuthenticatedGuard(auth: ReturnType<typeof useAuth>): auth is ReturnType<
  typeof useAuth
> & {
  isAuthenticated: true;
  user: NonNullable<typeof auth.user>;
  tenantId: NonNullable<typeof auth.tenantId>;
} {
  return auth.isAuthenticated && auth.user !== null && auth.tenantId !== null;
}
