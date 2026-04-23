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
  verifyRedirectTo?: string;
  requireVerifiedEmail?: boolean;
  /** When set, called instead of default redirect (e.g. custom router integration). */
  onUnauthorized?: () => void;
};

function normalizeOptions(input?: string | UseRequireAuthOptions): {
  redirectTo: string;
  verifyRedirectTo: string;
  requireVerifiedEmail: boolean;
  onUnauthorized?: () => void;
} {
  if (input === undefined) {
    return {
      redirectTo: "/auth/login",
      verifyRedirectTo: "/auth/verify-email",
      requireVerifiedEmail: false,
    };
  }
  if (typeof input === "string") {
    return {
      redirectTo: input,
      verifyRedirectTo: "/auth/verify-email",
      requireVerifiedEmail: false,
    };
  }
  return {
    redirectTo: input.redirectTo ?? "/auth/login",
    verifyRedirectTo: input.verifyRedirectTo ?? "/auth/verify-email",
    requireVerifiedEmail: input.requireVerifiedEmail ?? false,
    onUnauthorized: input.onUnauthorized,
  };
}

/**
 * Protected route data hook. Redirect ownership belongs to route `beforeLoad` guards.
 * Client-side redirects remain enabled as a reconciliation fallback when SSR probes defer/fail
 * or when auth state changes after hydration.
 */
export function useRequireAuth(input?: string | UseRequireAuthOptions) {
  const { redirectTo, verifyRedirectTo, requireVerifiedEmail, onUnauthorized } =
    normalizeOptions(input);
  const { data: session, isPending, isFetching, error } = useSessionQuery();
  const router = useRouter();
  const pathname = usePathname();
  const redirectOnce = useRef(false);

  const user: AuthUserData | null = session?.user ?? null;
  const isBlockingAuthResolution = isPending || (isFetching && !session);

  useEffect(() => {
    /**
     * Treat only first-load pending state as "blocking". Background refetches should not
     * freeze protected routes once we already have a resolved session snapshot.
     */
    if (isBlockingAuthResolution) {
      redirectOnce.current = false;
      return;
    }
    if (pathname === "/auth/login" || pathname.startsWith("/auth/")) {
      return;
    }
    if (user && requireVerifiedEmail && !user.emailVerified) {
      const currentPath = pathname !== verifyRedirectTo ? pathname : undefined;
      const query = new URLSearchParams();
      if (currentPath) query.set("redirect", currentPath);
      query.set("email", user.email);
      if (user.tenantId) {
        query.set("tenantId", user.tenantId);
      }
      const next = `${verifyRedirectTo}?${query.toString()}`;
      if (!redirectOnce.current) {
        redirectOnce.current = true;
        router.push(next);
      }
      return;
    }
    if (user) {
      return;
    }

    if (onUnauthorized) {
      onUnauthorized();
      return;
    }

    const currentPath = pathname !== redirectTo ? pathname : undefined;
    const next = currentPath
      ? `${redirectTo}?redirect=${encodeURIComponent(currentPath)}`
      : redirectTo;

    if (!redirectOnce.current) {
      redirectOnce.current = true;
      router.push(next);
    }
  }, [
    isBlockingAuthResolution,
    user,
    pathname,
    redirectTo,
    router,
    onUnauthorized,
    requireVerifiedEmail,
    verifyRedirectTo,
  ]);

  return {
    user,
    isLoading: isBlockingAuthResolution,
    isAuthenticated: !!user,
    isReady: !isBlockingAuthResolution && !!user,
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
