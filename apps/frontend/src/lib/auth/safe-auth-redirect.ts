export type AuthRedirectClass = "dashboard_default" | "safe_internal" | "auth_loop_blocked";

const DASHBOARD_FALLBACK = "/dashboard";

function isSafeInternalTarget(value: string): boolean {
  if (!value.startsWith("/") || value.startsWith("//")) {
    return false;
  }

  if (value.startsWith("/auth")) {
    return false;
  }

  return true;
}

export function sanitizeAuthRedirectTarget(redirectFromSearch?: string | null): string {
  if (!redirectFromSearch) {
    return DASHBOARD_FALLBACK;
  }

  return isSafeInternalTarget(redirectFromSearch) ? redirectFromSearch : DASHBOARD_FALLBACK;
}

export function classifyAuthRedirectTarget(redirectFromSearch?: string | null): {
  target: string;
  redirectClass: AuthRedirectClass;
} {
  if (
    !redirectFromSearch ||
    !redirectFromSearch.startsWith("/") ||
    redirectFromSearch.startsWith("//")
  ) {
    return { target: DASHBOARD_FALLBACK, redirectClass: "dashboard_default" };
  }

  if (redirectFromSearch.startsWith("/auth")) {
    return { target: DASHBOARD_FALLBACK, redirectClass: "auth_loop_blocked" };
  }

  return { target: redirectFromSearch, redirectClass: "safe_internal" };
}
