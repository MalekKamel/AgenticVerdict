export const ERROR_CODES = [
  "TENANT_CONTEXT_REQUIRED",
  "TENANT_MISMATCH",
  "TENANT_NOT_FOUND",
  "AUTH_UNAUTHORIZED",
  "AUTH_FORBIDDEN",
  "AUTH_SESSION_EXPIRED",
  "VALIDATION_FAILED",
  "VALIDATION_MISSING_FIELD",
  "RESOURCE_NOT_FOUND",
  "QUEUE_UNAVAILABLE",
  "QUEUE_JOB_FAILED",
  "DB_CONFLICT",
  "DB_UNAVAILABLE",
  "CONNECTOR_TIMEOUT",
  "CONNECTOR_UPSTREAM_FAILURE",
  "RUNTIME_TIMEOUT",
  "RUNTIME_UNAVAILABLE",
  "STORAGE_ERROR",
  "STORAGE_SECURITY_ERROR",
  "INTERNAL_ERROR",
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

export const ERROR_CODE_SET = new Set<ErrorCode>(ERROR_CODES);

export const ERROR_CATEGORY_VALUES = [
  "validation",
  "authentication",
  "authorization",
  "tenant",
  "dependency",
  "data_access",
  "rate_limit",
  "timeout",
  "conflict",
  "security",
  "internal",
] as const;

export type ErrorCategory = (typeof ERROR_CATEGORY_VALUES)[number];

export const ERROR_SURFACE_VALUES = [
  "http",
  "trpc",
  "queue",
  "worker",
  "frontend",
  "integration",
] as const;

export type ErrorSurface = (typeof ERROR_SURFACE_VALUES)[number];

export type AppFaultDetails = Record<string, unknown>;

const MESSAGE_KEY_BY_CODE: Record<ErrorCode, string> = {
  TENANT_CONTEXT_REQUIRED: "errors.tenantRequired",
  TENANT_MISMATCH: "errors.tenantMismatch",
  TENANT_NOT_FOUND: "errors.tenantNotFound",
  AUTH_UNAUTHORIZED: "errors.auth.unauthorized",
  AUTH_FORBIDDEN: "errors.auth.forbidden",
  AUTH_SESSION_EXPIRED: "errors.auth.sessionExpired",
  VALIDATION_FAILED: "errors.validation.failed",
  VALIDATION_MISSING_FIELD: "errors.validation.missingField",
  RESOURCE_NOT_FOUND: "errors.common.notFound",
  QUEUE_UNAVAILABLE: "errors.common.tryAgain",
  QUEUE_JOB_FAILED: "errors.common.tryAgain",
  DB_CONFLICT: "errors.common.conflict",
  DB_UNAVAILABLE: "errors.server.serviceUnavailable",
  CONNECTOR_TIMEOUT: "errors.server.gatewayTimeout",
  CONNECTOR_UPSTREAM_FAILURE: "errors.server.badGateway",
  RUNTIME_TIMEOUT: "errors.server.gatewayTimeout",
  RUNTIME_UNAVAILABLE: "errors.server.serviceUnavailable",
  STORAGE_ERROR: "errors.storage.error",
  STORAGE_SECURITY_ERROR: "errors.storage.securityError",
  INTERNAL_ERROR: "errors.common.unknownError",
};

export interface AppFaultInit {
  code: ErrorCode;
  category: ErrorCategory;
  httpStatus: number;
  retryable: boolean;
  safeMessage: string;
  details?: AppFaultDetails;
  cause?: unknown;
  surface?: ErrorSurface;
}

export class AppFault extends Error {
  readonly code: ErrorCode;
  readonly category: ErrorCategory;
  readonly httpStatus: number;
  readonly retryable: boolean;
  readonly safeMessage: string;
  readonly details?: AppFaultDetails;
  readonly cause?: unknown;
  readonly surface?: ErrorSurface;

  constructor(init: AppFaultInit) {
    super(init.safeMessage);
    this.name = "AppFault";
    this.code = init.code;
    this.category = init.category;
    this.httpStatus = init.httpStatus;
    this.retryable = init.retryable;
    this.safeMessage = init.safeMessage;
    this.details = init.details;
    this.cause = init.cause;
    this.surface = init.surface;
  }
}

export interface FaultNormalizationContext {
  surface?: ErrorSurface;
  fallbackCode?: ErrorCode;
  fallbackMessage?: string;
  fallbackCategory?: ErrorCategory;
  fallbackHttpStatus?: number;
  fallbackRetryable?: boolean;
  guardUnregisteredCode?: boolean;
}

const CATEGORY_BY_CODE: Record<ErrorCode, ErrorCategory> = {
  TENANT_CONTEXT_REQUIRED: "tenant",
  TENANT_MISMATCH: "tenant",
  TENANT_NOT_FOUND: "tenant",
  AUTH_UNAUTHORIZED: "authentication",
  AUTH_FORBIDDEN: "authorization",
  AUTH_SESSION_EXPIRED: "authentication",
  VALIDATION_FAILED: "validation",
  VALIDATION_MISSING_FIELD: "validation",
  RESOURCE_NOT_FOUND: "data_access",
  QUEUE_UNAVAILABLE: "dependency",
  QUEUE_JOB_FAILED: "dependency",
  DB_CONFLICT: "conflict",
  DB_UNAVAILABLE: "data_access",
  CONNECTOR_TIMEOUT: "timeout",
  CONNECTOR_UPSTREAM_FAILURE: "dependency",
  RUNTIME_TIMEOUT: "timeout",
  RUNTIME_UNAVAILABLE: "dependency",
  STORAGE_ERROR: "dependency",
  STORAGE_SECURITY_ERROR: "security",
  INTERNAL_ERROR: "internal",
};

const HTTP_STATUS_BY_CODE: Record<ErrorCode, number> = {
  TENANT_CONTEXT_REQUIRED: 400,
  TENANT_MISMATCH: 403,
  TENANT_NOT_FOUND: 404,
  AUTH_UNAUTHORIZED: 401,
  AUTH_FORBIDDEN: 403,
  AUTH_SESSION_EXPIRED: 401,
  VALIDATION_FAILED: 422,
  VALIDATION_MISSING_FIELD: 422,
  RESOURCE_NOT_FOUND: 404,
  QUEUE_UNAVAILABLE: 503,
  QUEUE_JOB_FAILED: 500,
  DB_CONFLICT: 409,
  DB_UNAVAILABLE: 503,
  CONNECTOR_TIMEOUT: 504,
  CONNECTOR_UPSTREAM_FAILURE: 502,
  RUNTIME_TIMEOUT: 504,
  RUNTIME_UNAVAILABLE: 503,
  STORAGE_ERROR: 500,
  STORAGE_SECURITY_ERROR: 403,
  INTERNAL_ERROR: 500,
};

const RETRYABLE_BY_CODE: Record<ErrorCode, boolean> = {
  TENANT_CONTEXT_REQUIRED: false,
  TENANT_MISMATCH: false,
  TENANT_NOT_FOUND: false,
  AUTH_UNAUTHORIZED: false,
  AUTH_FORBIDDEN: false,
  AUTH_SESSION_EXPIRED: true,
  VALIDATION_FAILED: false,
  VALIDATION_MISSING_FIELD: false,
  RESOURCE_NOT_FOUND: false,
  QUEUE_UNAVAILABLE: true,
  QUEUE_JOB_FAILED: true,
  DB_CONFLICT: false,
  DB_UNAVAILABLE: true,
  CONNECTOR_TIMEOUT: true,
  CONNECTOR_UPSTREAM_FAILURE: true,
  RUNTIME_TIMEOUT: true,
  RUNTIME_UNAVAILABLE: true,
  STORAGE_ERROR: true,
  STORAGE_SECURITY_ERROR: false,
  INTERNAL_ERROR: false,
};

export function assertRegisteredErrorCode(code: string): asserts code is ErrorCode {
  if (ERROR_CODE_SET.has(code as ErrorCode)) {
    return;
  }

  throw new AppFault({
    code: "INTERNAL_ERROR",
    category: "internal",
    httpStatus: 500,
    retryable: false,
    safeMessage: "errors.common.unknownError",
    details: { code },
  });
}

export function getMessageKeyForErrorCode(code: ErrorCode): string {
  return MESSAGE_KEY_BY_CODE[code];
}

export function isAppFault(value: unknown): value is AppFault {
  if (!(value instanceof Error)) {
    return false;
  }

  const candidate = value as Partial<AppFault>;
  return (
    typeof candidate.code === "string" &&
    ERROR_CODE_SET.has(candidate.code as ErrorCode) &&
    typeof candidate.category === "string" &&
    typeof candidate.httpStatus === "number" &&
    typeof candidate.retryable === "boolean" &&
    typeof candidate.safeMessage === "string"
  );
}

export function toAppFault(error: unknown, context: FaultNormalizationContext = {}): AppFault {
  if (isAppFault(error)) {
    return error;
  }

  const fallbackCode = context.fallbackCode ?? "INTERNAL_ERROR";

  if (context.guardUnregisteredCode === true) {
    assertRegisteredErrorCode(fallbackCode);
  }

  return new AppFault({
    code: fallbackCode,
    category: context.fallbackCategory ?? CATEGORY_BY_CODE[fallbackCode],
    httpStatus: context.fallbackHttpStatus ?? HTTP_STATUS_BY_CODE[fallbackCode],
    retryable: context.fallbackRetryable ?? RETRYABLE_BY_CODE[fallbackCode],
    safeMessage: context.fallbackMessage ?? "errors.common.unknownError",
    surface: context.surface,
    cause: error,
  });
}
