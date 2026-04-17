import { useEffect, useRef } from "react";

import { usePathname, useRouter } from "@/i18n/navigation";

import { useAuth } from "./useAuth";
import { useSessionQuery } from "./useSessionQuery";

import type { AuthUserData } from "@/lib/api/auth-api";

/**
 * Options for {@link useRequireAuth} (TanStack Router + session-query SSOT).
 */
export type UseRequireAuthOptions = {
  /** Locale-stripped path (e.g. `/auth/login`). Default `/auth/login`. */
  redirectTo?: string;
  /** When set, called instead of default redirect (e.g. custom router integration). */
  onUnauthorized?: () => void;
};

function normalizeOptions(input?: string | UseRequireAuthOptions): {
  redirectTo: string;
  onUnauthorized?: () => void;
} {
  if (input === undefined) {
    return { redirectTo: "/auth/login" };
  }
  if (typeof input === "string") {
    return { redirectTo: input };
  }
  return {
    redirectTo: input.redirectTo ?? "/auth/login",
    onUnauthorized: input.onUnauthorized,
  };
}

/**
 * Protected route guard: uses **`useSessionQuery`** (not the auth store alone) for loading
 * so we do not redirect before the session request finishes or clear the store incorrectly.
 *
 * Skips redirect on `/auth/*` routes to avoid redirect loops.
 */
export function useRequireAuth(input?: string | UseRequireAuthOptions) {
  const { redirectTo, onUnauthorized } = normalizeOptions(input);
  const { data: session, isPending, error } = useSessionQuery();
  const router = useRouter();
  const pathname = usePathname();
  const redirectOnce = useRef(false);

  const user: AuthUserData | null = session?.user ?? null;

  useEffect(() => {
    if (isPending) {
      redirectOnce.current = false;
      return;
    }
    if (user) {
      return;
    }
    if (pathname === "/auth/login" || pathname.startsWith("/auth/")) {
      return;
    }

    if (onUnauthorized) {
      onUnauthorized();
      return;
    }

    const currentPath = pathname !== redirectTo ? pathname : undefined;
    const redirectUrl = currentPath
      ? `${redirectTo}?redirect=${encodeURIComponent(currentPath)}`
      : redirectTo;

    if (!redirectOnce.current) {
      redirectOnce.current = true;
      router.push(redirectUrl);
    }
  }, [isPending, user, pathname, redirectTo, router, onUnauthorized]);

  return {
    user,
    isLoading: isPending,
    isAuthenticated: !!user,
    isReady: !isPending && !!user,
    error: error ?? null,
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
