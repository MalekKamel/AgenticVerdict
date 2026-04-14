/**
 * Error Type Definitions
 *
 * Comprehensive error type system for authentication and API errors.
 * Provides type-safe error handling across all auth flows.
 *
 * Features:
 * - Discriminated unions for type-safe error handling
 * - User-friendly error codes and messages
 * - Support for i18n translations
 * - ARIA-compliant error structure
 * - Network, server, validation, auth, and rate limit errors
 *
 * @see T097: Error type definitions
 */

/**
 * Base error interface
 *
 * All error types extend this base interface for consistency.
 */
export interface BaseError {
  /** Unique error code for programmatic handling */
  code: string;
  /** User-friendly error message (translation key) */
  message: string;
  /** Additional error details for debugging */
  details?: Record<string, unknown>;
  /** Timestamp when error occurred */
  timestamp: string;
}

/**
 * Network error types
 *
 * Errors related to network connectivity and offline detection.
 */
export type NetworkErrorCode =
  | "NETWORK_OFFLINE"
  | "NETWORK_TIMEOUT"
  | "NETWORK_CONNECTION_FAILED"
  | "NETWORK_SERVER_UNREACHABLE";

export interface NetworkError extends BaseError {
  type: "network";
  code: NetworkErrorCode;
  /** Whether the user is currently offline */
  isOffline: boolean;
  /** Suggested retry delay in milliseconds */
  retryAfter?: number;
  /** Whether the request can be retried */
  retryable: boolean;
}

/**
 * Validation error types
 *
 * Errors related to input validation and form fields.
 */
export type ValidationErrorCode =
  | "VALIDATION_REQUIRED"
  | "VALIDATION_INVALID_FORMAT"
  | "VALIDATION_TOO_SHORT"
  | "VALIDATION_TOO_LONG"
  | "VALIDATION_MISMATCH"
  | "VALIDATION_INVALID_EMAIL"
  | "VALIDATION_WEAK_PASSWORD";

export interface ValidationError extends BaseError {
  type: "validation";
  code: ValidationErrorCode;
  /** Field name that failed validation */
  field: string;
  /** Expected value/format */
  expected?: string;
  /** Actual value received */
  received?: string;
}

/**
 * Authentication error types
 *
 * Errors related to authentication and authorization.
 */
export type AuthErrorCode =
  | "AUTH_INVALID_CREDENTIALS"
  | "AUTH_SESSION_EXPIRED"
  | "AUTH_TOKEN_INVALID"
  | "AUTH_TOKEN_EXPIRED"
  | "AUTH_UNAUTHORIZED"
  | "AUTH_FORBIDDEN"
  | "AUTH_EMAIL_NOT_VERIFIED"
  | "AUTH_ACCOUNT_LOCKED"
  | "AUTH_TOO_MANY_ATTEMPTS";

export interface AuthError extends BaseError {
  type: "auth";
  code: AuthErrorCode;
  /** Whether user should be redirected to login */
  shouldRedirect: boolean;
  /** Redirect path (if applicable) */
  redirectPath?: string;
  /** Preserve intended path for after login */
  preservePath?: boolean;
}

/**
 * Server error types
 *
 * Errors related to server-side issues.
 */
export type ServerErrorCode =
  | "SERVER_INTERNAL_ERROR"
  | "SERVER_BAD_GATEWAY"
  | "SERVER_SERVICE_UNAVAILABLE"
  | "SERVER_GATEWAY_TIMEOUT"
  | "SERVER_NOT_IMPLEMENTED";

export interface ServerError extends BaseError {
  type: "server";
  code: ServerErrorCode;
  /** HTTP status code */
  statusCode: number;
  /** Whether user should contact support */
  contactSupport: boolean;
  /** Support email or contact info */
  contactInfo?: string;
}

/**
 * Rate limit error types
 *
 * Errors related to rate limiting and throttling.
 */
export type RateLimitErrorCode = "RATE_LIMIT_EXCEEDED" | "RATE_LIMIT_TOO_MANY_REQUESTS";

export interface RateLimitError extends BaseError {
  type: "rate_limit";
  code: RateLimitErrorCode;
  /** Number of seconds until user can retry */
  retryAfter: number;
  /** Current request count */
  requestCount: number;
  /** Maximum allowed requests */
  maxRequests: number;
  /** Time window in seconds */
  windowSize: number;
}

/**
 * Union type of all error types
 *
 * Use discriminated union for type-safe error handling.
 */
export type AppError = NetworkError | ValidationError | AuthError | ServerError | RateLimitError;

/**
 * Error severity levels
 */
export type ErrorSeverity = "low" | "medium" | "high" | "critical";

/**
 * Error context for logging and tracking
 */
export interface ErrorContext {
  /** Error severity */
  severity: ErrorSeverity;
  /** User ID (if authenticated) */
  userId?: string;
  /** Tenant ID */
  tenantId?: string;
  /** Request ID for tracing */
  requestId?: string;
  /** Component or page where error occurred */
  component?: string;
  /** Action being performed when error occurred */
  action?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Enhanced error with context
 *
 * Combines error with context for comprehensive error handling.
 */
export interface ContextualError {
  error: AppError;
  context: ErrorContext;
}

/**
 * Error handler function type
 */
export type ErrorHandler = (error: ContextualError) => void;

/**
 * Error translation keys
 *
 * Maps error codes to i18n translation keys.
 */
export const ERROR_TRANSLATION_KEYS: Record<
  Exclude<AppError["type"], "validation"> | "common",
  Record<string, string>
> = {
  network: {
    NETWORK_OFFLINE: "errors.network.offline",
    NETWORK_TIMEOUT: "errors.network.timeout",
    NETWORK_CONNECTION_FAILED: "errors.network.connectionFailed",
    NETWORK_SERVER_UNREACHABLE: "errors.network.serverUnreachable",
  },
  auth: {
    AUTH_INVALID_CREDENTIALS: "errors.auth.invalidCredentials",
    AUTH_SESSION_EXPIRED: "errors.auth.sessionExpired",
    AUTH_TOKEN_INVALID: "errors.auth.tokenInvalid",
    AUTH_TOKEN_EXPIRED: "errors.auth.tokenExpired",
    AUTH_UNAUTHORIZED: "errors.auth.unauthorized",
    AUTH_FORBIDDEN: "errors.auth.forbidden",
    AUTH_EMAIL_NOT_VERIFIED: "errors.auth.emailNotVerified",
    AUTH_ACCOUNT_LOCKED: "errors.auth.accountLocked",
    AUTH_TOO_MANY_ATTEMPTS: "errors.auth.tooManyAttempts",
  },
  server: {
    SERVER_INTERNAL_ERROR: "errors.server.internalError",
    SERVER_BAD_GATEWAY: "errors.server.badGateway",
    SERVER_SERVICE_UNAVAILABLE: "errors.server.serviceUnavailable",
    SERVER_GATEWAY_TIMEOUT: "errors.server.gatewayTimeout",
    SERVER_NOT_IMPLEMENTED: "errors.server.notImplemented",
  },
  rate_limit: {
    RATE_LIMIT_EXCEEDED: "errors.rateLimit.exceeded",
    RATE_LIMIT_TOO_MANY_REQUESTS: "errors.rateLimit.tooManyRequests",
  },
  common: {
    UNKNOWN_ERROR: "errors.common.unknown",
    TRY_AGAIN: "errors.common.tryAgain",
    CONTACT_SUPPORT: "errors.common.contactSupport",
  },
};

/**
 * Type guards for error types
 */

export function isNetworkError(error: AppError): error is NetworkError {
  return error.type === "network";
}

export function isValidationError(error: AppError): error is ValidationError {
  return error.type === "validation";
}

export function isAuthError(error: AppError): error is AuthError {
  return error.type === "auth";
}

export function isServerError(error: AppError): error is ServerError {
  return error.type === "server";
}

export function isRateLimitError(error: AppError): error is RateLimitError {
  return error.type === "rate_limit";
}

/**
 * Get error translation key
 *
 * Returns the i18n translation key for a given error.
 */
export function getErrorTranslationKey(error: AppError): string {
  // Validation errors are handled separately since they're not in ERROR_TRANSLATION_KEYS
  if (error.type === "validation") {
    return error.field
      ? `errors.validation.${error.field}.${error.code}`
      : `errors.validation.${error.code}`;
  }

  const typeMap = ERROR_TRANSLATION_KEYS[error.type === "rate_limit" ? "rate_limit" : error.type];
  if (typeMap && error.code in typeMap) {
    return typeMap[error.code];
  }
  return ERROR_TRANSLATION_KEYS.common.UNKNOWN_ERROR;
}

/**
 * Check if error is retryable
 *
 * Determines if an operation can be retried based on error type.
 */
export function isRetryable(error: AppError): boolean {
  if (isNetworkError(error)) {
    return error.retryable;
  }
  if (isRateLimitError(error)) {
    return true; // Rate limit errors are retryable after delay
  }
  if (isServerError(error)) {
    return error.statusCode >= 500 || error.statusCode === 429;
  }
  return false;
}

/**
 * Get retry delay for retryable errors
 *
 * Returns the suggested retry delay in milliseconds.
 */
export function getRetryDelay(error: AppError): number {
  if (isNetworkError(error) && error.retryAfter) {
    return error.retryAfter;
  }
  if (isRateLimitError(error)) {
    return error.retryAfter * 1000; // Convert seconds to milliseconds
  }
  if (isServerError(error)) {
    // Default exponential backoff: 2 seconds
    return 2000;
  }
  return 0;
}

/**
 * Check if error requires user redirect
 *
 * Determines if user should be redirected based on error type.
 */
export function requiresRedirect(error: AppError): boolean {
  if (isAuthError(error)) {
    return error.shouldRedirect;
  }
  return false;
}

/**
 * Get redirect path for error
 *
 * Returns the path to redirect user to after error.
 */
export function getRedirectPath(error: AppError): string | undefined {
  if (isAuthError(error)) {
    return error.redirectPath;
  }
  return undefined;
}

/**
 * Create a network error
 */
export function createNetworkError(
  code: NetworkErrorCode,
  options: Partial<NetworkError> = {},
): NetworkError {
  return {
    type: "network",
    code,
    message: getErrorTranslationKey({ type: "network", code } as NetworkError),
    isOffline: code === "NETWORK_OFFLINE",
    retryable: true,
    timestamp: new Date().toISOString(),
    ...options,
  };
}

/**
 * Create a validation error
 */
export function createValidationError(
  code: ValidationErrorCode,
  field: string,
  options: Partial<ValidationError> = {},
): ValidationError {
  return {
    type: "validation",
    code,
    message: getErrorTranslationKey({ type: "validation", code } as ValidationError),
    field,
    timestamp: new Date().toISOString(),
    ...options,
  };
}

/**
 * Create an auth error
 */
export function createAuthError(code: AuthErrorCode, options: Partial<AuthError> = {}): AuthError {
  return {
    type: "auth",
    code,
    message: getErrorTranslationKey({ type: "auth", code } as AuthError),
    shouldRedirect: code === "AUTH_SESSION_EXPIRED" || code === "AUTH_TOKEN_EXPIRED",
    timestamp: new Date().toISOString(),
    ...options,
  };
}

/**
 * Create a server error
 */
export function createServerError(
  code: ServerErrorCode,
  statusCode: number,
  options: Partial<ServerError> = {},
): ServerError {
  return {
    type: "server",
    code,
    statusCode,
    message: getErrorTranslationKey({ type: "server", code } as ServerError),
    contactSupport: statusCode >= 500,
    timestamp: new Date().toISOString(),
    ...options,
  };
}

/**
 * Create a rate limit error
 */
export function createRateLimitError(
  code: RateLimitErrorCode,
  retryAfter: number,
  options: Partial<RateLimitError> = {},
): RateLimitError {
  return {
    type: "rate_limit",
    code,
    retryAfter,
    requestCount: options.requestCount || 0,
    maxRequests: options.maxRequests || 0,
    windowSize: options.windowSize || 60,
    message: getErrorTranslationKey({ type: "rate_limit", code } as RateLimitError),
    timestamp: new Date().toISOString(),
    ...options,
  };
}

/**
 * Convert unknown error to AppError
 *
 * Safely converts unknown errors to typed AppError instances.
 */
export function toAppError(error: unknown, defaultType: AppError["type"] = "server"): AppError {
  if (isAppError(error)) {
    return error;
  }

  // Handle Error instances
  if (error instanceof Error) {
    return createServerError("SERVER_INTERNAL_ERROR", 500, {
      message: error.message,
      details: { name: error.name, stack: error.stack },
    });
  }

  // Handle string errors
  if (typeof error === "string") {
    return createServerError("SERVER_INTERNAL_ERROR", 500, {
      message: error,
    });
  }

  // Handle unknown errors
  return createServerError("SERVER_INTERNAL_ERROR", 500, {
    details: { originalError: error, defaultType },
  });
}

/**
 * Type guard for AppError
 */
function isAppError(error: unknown): error is AppError {
  return (
    typeof error === "object" &&
    error !== null &&
    "type" in error &&
    "code" in error &&
    "message" in error &&
    "timestamp" in error
  );
}
