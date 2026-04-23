/**
 * useLoginMutation Hook
 *
 * Task T032: Login mutation hook with tRPC
 *
 * Features:
 * - tRPC mutation wrapper
 * - Error handling with generic messages
 * - Success handling with redirect
 * - Loading states
 * - Auth store integration
 *
 * @example
 * ```tsx
 * const { login, isLoading, error, clearError } = useLoginMutation();
 *
 * const handleSubmit = async (data) => {
 *   await login(data);
 * };
 * ```
 */

"use client";

import { useQueryClient } from "@tanstack/react-query";

import { useRouter } from "@/i18n/navigation";
import { authActions } from "@/stores/auth-store";
import { authApi } from "@/lib/api/auth-api";
import {
  classifyAuthRedirectTarget,
  sanitizeAuthRedirectTarget,
} from "@/lib/auth/safe-auth-redirect";
import { logAuthFunnelEvent } from "@/lib/observability/auth-funnel-analytics";
import { getTenantIdForTrpcRequest } from "@/lib/tenant/trpc-tenant-bridge";
import { isTenantUuid } from "@/lib/tenant/tenant-resolution";
import { applySuccessfulLoginSession } from "@/lib/auth/auth-session-transition";
import type { LoginInput } from "@agenticverdict/types";
import { useCallback, useState } from "react";

export type LoginOAuthProvider = "google" | "microsoft" | "apple";
export type LoginMutationState =
  | "idle"
  | "submitting"
  | "oauth_redirecting"
  | "error"
  | "rate_limited"
  | "locked_out";

export interface UseLoginMutationReturn {
  /** Login mutation function */
  login: (credentials: LoginInput) => Promise<void>;
  /** OAuth login action (provider redirect if available) */
  loginWithOAuth: (provider: LoginOAuthProvider) => Promise<void>;

  /** Loading state */
  isLoading: boolean;

  /** Error message */
  error: string | null;

  /** Structured status for specialized auth UI states. */
  state: LoginMutationState;
  /** Active OAuth provider during redirect attempt. */
  oauthLoadingProvider: LoginOAuthProvider | null;
  /** Retry-after hint (seconds) for rate-limited states. */
  retryAfterSeconds: number | null;

  /** Clear error state */
  clearError: () => void;
}

export function isOAuthCapabilityEnabled(): boolean {
  return import.meta.env.VITE_PUBLIC_ENABLE_OAUTH_LOGIN === "true";
}

export function resolvePostLoginRedirect(redirectFromSearch: string | null): string {
  return sanitizeAuthRedirectTarget(redirectFromSearch);
}

export function buildVerifyEmailRedirect(
  email: string,
  tenantId?: string,
  redirectFromSearch?: string,
): string {
  const params = new URLSearchParams({ email: email.trim().toLowerCase() });
  if (tenantId && isTenantUuid(tenantId)) {
    params.set("tenantId", tenantId);
  }
  if (typeof redirectFromSearch === "string" && redirectFromSearch.length > 0) {
    params.set("redirect", resolvePostLoginRedirect(redirectFromSearch));
  }
  return `/auth/verify-email?${params.toString()}`;
}

function getRetryAfterSeconds(details: unknown): number | null {
  if (!details || typeof details !== "object") {
    return null;
  }
  const candidate = (details as { retryAfter?: unknown }).retryAfter;
  if (typeof candidate === "number" && Number.isFinite(candidate) && candidate > 0) {
    return Math.round(candidate);
  }
  if (typeof candidate === "string") {
    const parsed = Number(candidate);
    if (Number.isFinite(parsed) && parsed > 0) {
      return Math.round(parsed);
    }
  }
  return null;
}

export function resolveLoginErrorState(errorMessage: string): LoginMutationState {
  if (
    errorMessage === "auth.errors.accountLocked" ||
    errorMessage === "auth.errors.tooManyAttempts"
  ) {
    return "locked_out";
  }
  if (errorMessage === "auth.errors.rateLimitExceeded") {
    return "rate_limited";
  }
  return "error";
}

/**
 * Hook for handling login mutation
 *
 * Provides a complete login flow with:
 * - Loading states
 * - Error handling with generic messages (security)
 * - Auth state management
 * - Automatic redirect on success
 */
export function useLoginMutation(redirectFromSearch?: string): UseLoginMutationReturn {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [state, setState] = useState<LoginMutationState>("idle");
  const [oauthLoadingProvider, setOauthLoadingProvider] = useState<LoginOAuthProvider | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryAfterSeconds, setRetryAfterSeconds] = useState<number | null>(null);

  const login = useCallback(
    async (credentials: LoginInput) => {
      const startedAt = performance.now();
      setState("submitting");
      setError(null);
      setRetryAfterSeconds(null);
      authActions.setLoading(true);
      authActions.clearError();
      logAuthFunnelEvent("auth.login.submit", { flow: "login" });

      try {
        const result = await authApi.login(credentials);
        const latencyMs = Math.round(performance.now() - startedAt);

        if (result.success) {
          const { user, sessionExpiresAt } = result.data;
          applySuccessfulLoginSession(queryClient, {
            user,
            sessionExpiresAt,
          });

          // Clear loading states
          setState("idle");
          authActions.setLoading(false);

          // Keep locale-aware redirect destination while preventing auth-route loops.
          const { target, redirectClass } = classifyAuthRedirectTarget(redirectFromSearch);
          logAuthFunnelEvent("auth.login.result", {
            flow: "login",
            outcome: "success",
            latencyMs,
            redirectClass,
          });
          router.push(target);
        } else {
          if (
            result.error.code === "EMAIL_NOT_VERIFIED" ||
            result.error.message === "auth.errors.emailNotVerified"
          ) {
            const tenantId = isTenantUuid(credentials.tenantId)
              ? credentials.tenantId
              : getTenantIdForTrpcRequest();
            const verifyEmailHref = buildVerifyEmailRedirect(
              credentials.email,
              tenantId,
              redirectFromSearch,
            );
            setState("idle");
            authActions.setLoading(false);
            router.push(verifyEmailHref);
            return;
          }

          setError(result.error.message);
          const nextState = resolveLoginErrorState(result.error.message);
          setState(nextState);
          setRetryAfterSeconds(getRetryAfterSeconds(result.error.details));
          authActions.setError({
            code: result.error.code,
            message: result.error.message,
          });
          logAuthFunnelEvent("auth.login.result", {
            flow: "login",
            outcome: "failure",
            errorCode: result.error.code,
            latencyMs,
          });
          authActions.setLoading(false);
        }
      } catch {
        // Handle unexpected errors
        const genericError = "auth.errors.internalError";
        setError(genericError);
        setState("error");
        authActions.setError({
          code: "INTERNAL_ERROR",
          message: genericError,
        });
        logAuthFunnelEvent("auth.login.result", {
          flow: "login",
          outcome: "failure",
          errorCode: "INTERNAL_ERROR",
          latencyMs: Math.round(performance.now() - startedAt),
        });
        authActions.setLoading(false);
      }
    },
    [queryClient, redirectFromSearch, router],
  );

  const loginWithOAuth = useCallback(async (provider: LoginOAuthProvider) => {
    if (!isOAuthCapabilityEnabled()) {
      setError("auth.login.oauth.unavailable");
      setState("idle");
      logAuthFunnelEvent("auth.login.result", {
        flow: "login",
        outcome: "capability_unavailable",
        errorCode: `OAUTH_${provider.toUpperCase()}_DISABLED`,
      });
      return;
    }

    setOauthLoadingProvider(provider);
    setState("oauth_redirecting");
    setError(null);
    setRetryAfterSeconds(null);
    logAuthFunnelEvent("auth.login.submit", { flow: "login" });

    // OAuth contract is wired as part of login alignment, but provider endpoints are pending.
    setError("auth.login.oauth.unavailable");
    setState("error");
    setOauthLoadingProvider(null);
    logAuthFunnelEvent("auth.login.result", {
      flow: "login",
      outcome: "capability_unavailable",
      errorCode: "OAUTH_UNAVAILABLE",
    });
  }, []);

  const clearError = useCallback(() => {
    setError(null);
    setState("idle");
    setRetryAfterSeconds(null);
    setOauthLoadingProvider(null);
    authActions.clearError();
  }, []);

  return {
    login,
    loginWithOAuth,
    isLoading: state === "submitting" || state === "oauth_redirecting",
    error,
    state,
    oauthLoadingProvider,
    retryAfterSeconds,
    clearError,
  };
}

export default useLoginMutation;
