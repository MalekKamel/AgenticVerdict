import { defaultStringifySearch } from "@tanstack/react-router";

import { sanitizeAuthRedirectTarget } from "@/lib/auth/safe-auth-redirect";

import type { GuardLocation } from "./guard-types";

export function buildProtectedRedirectTarget(location: GuardLocation): string {
  const pathAfterLocale = location.pathname.replace(/^\/[^/]+/, "") || "/";
  const search = defaultStringifySearch(location.search);
  return `${pathAfterLocale}${search}`;
}

export function resolvePublicAuthRedirectTarget(searchRedirect?: string): string {
  return sanitizeAuthRedirectTarget(searchRedirect);
}
