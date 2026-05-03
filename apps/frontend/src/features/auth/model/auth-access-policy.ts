import type { AppLocale } from "@/i18n/locales";
import { withLocalePrefix } from "@/router/utils/navigation";
import { isTenantUuid } from "@agenticverdict/core/tenant/tenant-resolution";

import type { AuthResolutionState } from "./auth-resolution-state";

export type AuthRouteKind = "public_auth" | "protected" | "public_general";

export type AuthAccessDecision =
  | { type: "allow" }
  | { type: "defer"; reason: "unknown_state" }
  | { type: "redirect"; to: string };

type ResolveRouteAccessDecisionInput = {
  routeKind: AuthRouteKind;
  authState: AuthResolutionState;
  locale: string;
  redirectTarget?: string;
};

function buildVerifyEmailTarget(
  locale: string,
  authState: Extract<AuthResolutionState, { kind: "authenticated_unverified" }>,
  redirectTarget: string | undefined,
): string {
  const search = new URLSearchParams();
  search.set("redirect", redirectTarget ?? "/dashboard");
  if (authState.user.email) {
    search.set("email", authState.user.email);
  }
  if (authState.user.tenantId && isTenantUuid(authState.user.tenantId)) {
    search.set("tenantId", authState.user.tenantId);
  }
  return `/${locale}/auth/verify-email?${search.toString()}`;
}

export function resolveRouteAccessDecision({
  routeKind,
  authState,
  locale,
  redirectTarget,
}: ResolveRouteAccessDecisionInput): AuthAccessDecision {
  if (authState.kind === "unknown") {
    return { type: "defer", reason: "unknown_state" };
  }

  if (routeKind === "public_general") {
    return { type: "allow" };
  }

  if (routeKind === "public_auth") {
    if (authState.kind === "anonymous") {
      return { type: "allow" };
    }

    const target = redirectTarget ?? "/dashboard";
    return {
      type: "redirect",
      to: withLocalePrefix(locale as AppLocale, target),
    };
  }

  if (authState.kind === "anonymous") {
    const target = redirectTarget ?? "/dashboard";
    return { type: "redirect", to: `/${locale}/auth/login?redirect=${encodeURIComponent(target)}` };
  }

  if (authState.kind === "authenticated_unverified") {
    return {
      type: "redirect",
      to: buildVerifyEmailTarget(locale, authState, redirectTarget),
    };
  }

  return { type: "allow" };
}
