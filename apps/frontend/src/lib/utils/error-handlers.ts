/**
 * Error Handler Utilities
 *
 * Comprehensive error handling utilities for authentication and API errors.
 * Provides user-friendly error messages, logging, and recovery options.
 *
 * Features:
 * - Network error detection and user-friendly messages
 * - Server error handling with support contact options
 * - Session expiry detection and redirect logic
 * - Rate limiting error messages with retry time
 * - ARIA-compliant error announcements
 * - Focus management for errors
 * - Error logging for debugging
 * - RTL support for error messages
 *
 * @see T098-T106: Error handling implementation tasks
 */

import { useTranslations } from "@/i18n/react";
import { useCallback, useEffect } from "react";
import type {
  AppError,
  AuthError,
  ContextualError,
  NetworkError,
  RateLimitError,
  ServerError,
} from "../types/errors";
import {
  createAuthError,
  createNetworkError,
  createRateLimitError,
  createServerError,
  isAuthError,
  isNetworkError,
  isRateLimitError,
  isServerError,
} from "../types/errors";

/**
 * Error handler result
 *
 * Provides user-friendly error information and recovery options.
 */
export interface ErrorHandlerResult {
  /** User-friendly error message */
  message: string;
  /** Whether the error is retryable */
  retryable: boolean;
  /** Suggested retry delay in milliseconds */
  retryDelay: number;
  /** Whether user should be redirected */
  shouldRedirect: boolean;
  /** Redirect path if applicable */
  redirectPath?: string;
  /** Whether user should contact support */
  contactSupport: boolean;
  /** Support contact information */
  supportContact?: string;
  /** Error severity */
  severity: "low" | "medium" | "high" | "critical";
}

/**
 * Detect network status
 *
 * Returns true if user is currently offline.
 */
export function isOffline(): boolean {
  if (typeof window === "undefined" || !window.navigator) {
    return false;
  }
  return !window.navigator.onLine;
}

/**
 * Get network error message
 *
 * Returns user-friendly message based on network error type.
 */
export function getNetworkErrorMessage(error: NetworkError, t: (key: string) => string): string {
  const codeMap: Record<NetworkError["code"], string> = {
    NETWORK_OFFLINE: "errors.network.offline",
    NETWORK_TIMEOUT: "errors.network.timeout",
    NETWORK_CONNECTION_FAILED: "errors.network.connectionFailed",
    NETWORK_SERVER_UNREACHABLE: "errors.network.serverUnreachable",
  };
  return t(codeMap[error.code]);
}

/**
 * Get server error message
 *
 * Returns user-friendly message based on server error type.
 */
export function getServerErrorMessage(error: ServerError, t: (key: string) => string): string {
  const codeMap: Record<ServerError["code"], string> = {
    SERVER_INTERNAL_ERROR: "errors.server.internalError",
    SERVER_BAD_GATEWAY: "errors.server.badGateway",
    SERVER_SERVICE_UNAVAILABLE: "errors.server.serviceUnavailable",
    SERVER_GATEWAY_TIMEOUT: "errors.server.gatewayTimeout",
    SERVER_NOT_IMPLEMENTED: "errors.server.notImplemented",
  };
  const message = t(codeMap[error.code]);

  // Add support contact info for critical errors
  if (error.contactSupport) {
    const contactMessage = t("errors.common.contactSupport");
    return `${message} ${contactMessage}`;
  }

  return message;
}

/**
 * Get auth error message
 *
 * Returns user-friendly message based on auth error type.
 */
export function getAuthErrorMessage(error: AuthError, t: (key: string) => string): string {
  const codeMap: Record<AuthError["code"], string> = {
    AUTH_INVALID_CREDENTIALS: "auth.login.errors.invalidCredentials",
    AUTH_SESSION_EXPIRED: "errors.auth.sessionExpired",
    AUTH_TOKEN_INVALID: "errors.auth.tokenInvalid",
    AUTH_TOKEN_EXPIRED: "errors.auth.tokenExpired",
    AUTH_UNAUTHORIZED: "errors.auth.unauthorized",
    AUTH_FORBIDDEN: "errors.auth.forbidden",
    AUTH_EMAIL_NOT_VERIFIED: "auth.login.errors.emailNotVerified",
    AUTH_ACCOUNT_LOCKED: "auth.login.errors.accountLocked",
    AUTH_TOO_MANY_ATTEMPTS: "errors.auth.tooManyAttempts",
  };
  return t(codeMap[error.code]);
}

/**
 * Get rate limit error message
 *
 * Returns user-friendly message with retry time.
 */
export function getRateLimitErrorMessage(
  error: RateLimitError,
  t: (key: string, params?: Record<string, unknown>) => string,
): string {
  const codeMap: Record<RateLimitError["code"], string> = {
    RATE_LIMIT_EXCEEDED: "errors.rateLimit.exceeded",
    RATE_LIMIT_TOO_MANY_REQUESTS: "errors.rateLimit.tooManyRequests",
  };
  return t(codeMap[error.code], { retryAfter: error.retryAfter });
}

/**
 * Handle error and return user-friendly result
 *
 * Main error handler that converts any error into user-friendly format.
 */
export function handleError(
  error: AppError | Error | unknown,
  t: (key: string) => string,
): ErrorHandlerResult {
  // Handle Error instances and string errors directly
  if (error instanceof Error) {
    return {
      message: error.message,
      retryable: false,
      retryDelay: 0,
      shouldRedirect: false,
      contactSupport: true,
      severity: "medium",
    };
  }

  if (typeof error === "string") {
    return {
      message: error,
      retryable: false,
      retryDelay: 0,
      shouldRedirect: false,
      contactSupport: true,
      severity: "medium",
    };
  }

  // Convert to AppError if needed
  let appError: AppError;
  if (typeof error === "object" && error !== null && "type" in error) {
    appError = error as AppError;
  } else {
    appError = createServerError("SERVER_INTERNAL_ERROR", 500);
  }

  // Handle different error types
  if (isNetworkError(appError)) {
    return {
      message: getNetworkErrorMessage(appError, t),
      retryable: appError.retryable,
      retryDelay: appError.retryAfter || 2000,
      shouldRedirect: false,
      contactSupport: false,
      severity: "medium",
    };
  }

  if (isServerError(appError)) {
    return {
      message: getServerErrorMessage(appError, t),
      retryable: appError.statusCode >= 500,
      retryDelay: 5000,
      shouldRedirect: false,
      contactSupport: appError.contactSupport,
      supportContact: appError.contactInfo,
      severity: appError.statusCode >= 500 ? "high" : "medium",
    };
  }

  if (isAuthError(appError)) {
    return {
      message: getAuthErrorMessage(appError, t),
      retryable: appError.code === "AUTH_SESSION_EXPIRED" || appError.code === "AUTH_TOKEN_EXPIRED",
      retryDelay: 0,
      shouldRedirect: appError.shouldRedirect,
      redirectPath: appError.redirectPath,
      contactSupport: appError.code === "AUTH_ACCOUNT_LOCKED",
      severity: appError.code === "AUTH_ACCOUNT_LOCKED" ? "high" : "medium",
    };
  }

  if (isRateLimitError(appError)) {
    return {
      message: getRateLimitErrorMessage(appError, t),
      retryable: true,
      retryDelay: appError.retryAfter * 1000,
      shouldRedirect: false,
      contactSupport: false,
      severity: "low",
    };
  }

  // Default error handling
  return {
    message: t("errors.common.unknownError"),
    retryable: false,
    retryDelay: 0,
    shouldRedirect: false,
    contactSupport: true,
    severity: "medium",
  };
}

/**
 * Log error for debugging
 *
 * Logs error with appropriate details for debugging.
 */
export function logError(error: ContextualError): void {
  const { error: err, context } = error;
  const logLevel = getErrorLogLevel(context.severity);

  // Log with appropriate details
  const logData = {
    code: err.code,
    message: err.message,
    type: err.type,
    timestamp: err.timestamp,
    context: {
      severity: context.severity,
      component: context.component,
      action: context.action,
      userId: context.userId,
      tenantId: context.tenantId,
      requestId: context.requestId,
    },
    details: err.details,
  };

  // Log based on severity
  switch (logLevel) {
    case "error":
      console.error("[Error]", logData);
      break;
    case "warn":
      console.warn("[Warning]", logData);
      break;
    default:
      console.log("[Info]", logData);
  }
}

/**
 * Get log level from error severity
 */
function getErrorLogLevel(
  severity: ContextualError["context"]["severity"],
): "log" | "warn" | "error" {
  switch (severity) {
    case "critical":
    case "high":
      return "error";
    case "medium":
      return "warn";
    default:
      return "log";
  }
}

/**
 * Error handler hook
 *
 * React hook for handling errors with translations and logging.
 *
 * @example
 * ```tsx
 * const { handleError, handleAndLogError } = useErrorHandler()
 *
 * try {
 *   await apiCall()
 * } catch (error) {
 *   const result = handleAndLogError(error, {
 *     component: 'LoginForm',
 *     action: 'login'
 *   })
 *
 *   if (result.shouldRedirect) {
 *     router.push(result.redirectPath || '/auth/login')
 *   }
 * }
 * ```
 */
export function useErrorHandler() {
  const tErrors = useTranslations("errors");
  const tAuth = useTranslations("auth");
  type TranslationParams = Record<string, string | number | boolean | Date | null | undefined>;
  const t = useCallback(
    (key: string, params?: TranslationParams) => {
      if (key.startsWith("auth.")) {
        return tAuth(key.slice("auth.".length), params);
      }
      if (key.startsWith("errors.")) {
        return tErrors(key.slice("errors.".length), params);
      }
      return tErrors(key, params);
    },
    [tAuth, tErrors],
  );

  const handleErrorWithContext = useCallback(
    (error: AppError | Error | unknown, context?: Partial<ContextualError["context"]>) => {
      const result = handleError(error, t);

      // Log error if context provided
      if (context) {
        const appError =
          error instanceof Error || typeof error === "string"
            ? createServerError("SERVER_INTERNAL_ERROR", 500, {
                message: error instanceof Error ? error.message : String(error),
              })
            : (error as AppError);

        logError({
          error: appError,
          context: {
            severity: result.severity,
            ...context,
          },
        });
      }

      return result;
    },
    [t],
  );

  return {
    handleError: handleErrorWithContext,
  };
}

/**
 * Network status hook
 *
 * React hook for monitoring network status.
 *
 * @example
 * ```tsx
 * const { isOffline, onlineCount } = useNetworkStatus()
 *
 * if (isOffline) {
 *   return <div>You are offline</div>
 * }
 * ```
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = React.useState(() => {
    if (typeof window === "undefined" || !window.navigator) {
      return true;
    }
    return window.navigator.onLine;
  });

  useEffect(() => {
    if (typeof window === "undefined" || !window.navigator) {
      return;
    }

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return {
    isOffline: !isOnline,
    isOnline,
  };
}

/**
 * Error focus management hook
 *
 * React hook for managing focus to error container.
 *
 * @example
 * ```tsx
 * const errorRef = useRef<HTMLDivElement>(null)
 * const { focusError } = useErrorFocus(errorRef)
 *
 * // When error occurs
 * focusError()
 * ```
 */
export function useErrorFocus(errorRef: React.RefObject<HTMLElement>) {
  const focusError = useCallback(() => {
    if (errorRef.current) {
      errorRef.current.focus();
      errorRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [errorRef]);

  return { focusError };
}

/**
 * Create error from fetch response
 *
 * Converts fetch error responses to AppError instances.
 */
export async function createErrorFromResponse(
  response: Response,
  requestUrl: string,
): Promise<AppError> {
  const status = response.status;

  try {
    const contentType = response.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      const data = await response.json();

      // Handle rate limit errors
      if (status === 429) {
        const retryAfter = response.headers.get("retry-after");
        const retryAfterSeconds = retryAfter ? parseInt(retryAfter, 10) : 60;
        return createRateLimitError("RATE_LIMIT_EXCEEDED", retryAfterSeconds, {
          requestCount: data.requestCount || 0,
          maxRequests: data.maxRequests || 0,
        });
      }

      // Handle auth errors
      if (status === 401) {
        return createAuthError("AUTH_UNAUTHORIZED", {
          shouldRedirect: true,
          redirectPath: "/auth/login",
          preservePath: true,
        });
      }

      if (status === 403) {
        return createAuthError("AUTH_FORBIDDEN", {
          shouldRedirect: false,
        });
      }

      // Handle server errors
      if (status >= 500) {
        return createServerError("SERVER_INTERNAL_ERROR", status, {
          details: data,
        });
      }

      // Handle other errors
      return createServerError("SERVER_INTERNAL_ERROR", status, {
        message: data.message || data.error,
      });
    }
  } catch {
    // If parsing fails, create generic error
  }

  // Generic error handling based on status
  if (status === 401) {
    return createAuthError("AUTH_UNAUTHORIZED", {
      shouldRedirect: true,
      redirectPath: "/auth/login",
      preservePath: true,
    });
  }

  if (status === 429) {
    const retryAfter = response.headers.get("retry-after");
    const retryAfterSeconds = retryAfter ? parseInt(retryAfter, 10) : 60;
    return createRateLimitError("RATE_LIMIT_EXCEEDED", retryAfterSeconds);
  }

  if (status >= 500) {
    return createServerError("SERVER_INTERNAL_ERROR", status, {
      contactSupport: true,
    });
  }

  return createServerError("SERVER_INTERNAL_ERROR", status, {
    details: { requestUrl },
  });
}

/**
 * Create network error
 *
 * Creates network error based on error type.
 */
export function createNetworkErrorFromException(error: Error): NetworkError {
  const errorMessage = error.message.toLowerCase();

  if (errorMessage.includes("timeout") || errorMessage.includes("timed out")) {
    return createNetworkError("NETWORK_TIMEOUT", {
      retryable: true,
      retryAfter: 2000,
    });
  }

  if (errorMessage.includes("fetch") || errorMessage.includes("network")) {
    return createNetworkError("NETWORK_CONNECTION_FAILED", {
      isOffline: isOffline(),
      retryable: true,
      retryAfter: 2000,
    });
  }

  return createNetworkError("NETWORK_OFFLINE", {
    isOffline: isOffline(),
    retryable: true,
    retryAfter: 2000,
  });
}

// Import React for hooks
import React from "react";
