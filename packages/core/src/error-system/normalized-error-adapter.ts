import { isTRPCClientError } from "@trpc/client";
import {
  ERROR_CATEGORY_VALUES,
  ERROR_CODE_SET,
  ERROR_SURFACE_VALUES,
  type ErrorCategory,
  type ErrorCode,
  type ErrorSurface,
} from "../errors";

type ErrorSeverity = "info" | "warning" | "error" | "critical";

type CanonicalErrorPayload = {
  code?: string;
  category?: string;
  retryable?: boolean;
  messageKey?: string;
  surface?: string;
  details?: Record<string, unknown>;
};

type TrpcErrorDataWithCanonical = {
  canonicalError?: CanonicalErrorPayload;
  code?: string;
  httpStatus?: number;
};

export interface NormalizedUiError {
  code: string;
  category: string;
  surface: string;
  messageKey: string;
  cause?: string;
  messageParams?: Record<string, string | number | boolean>;
  retryable: boolean;
  retryAfterMs?: number;
  severity: ErrorSeverity;
  correlationId?: string;
}

const MESSAGE_KEY_BY_CODE: Record<string, string> = {
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
  INTERNAL_ERROR: "errors.common.unknownError",
};

const ERROR_CATEGORY_SET = new Set<string>(ERROR_CATEGORY_VALUES);
const ERROR_SURFACE_SET = new Set<string>(ERROR_SURFACE_VALUES);

function isErrorCode(value: string): value is ErrorCode {
  return ERROR_CODE_SET.has(value as ErrorCode);
}

function isErrorCategory(value: string): value is ErrorCategory {
  return ERROR_CATEGORY_SET.has(value);
}

function isErrorSurface(value: string): value is ErrorSurface {
  return ERROR_SURFACE_SET.has(value);
}

function toMessageKey(code: string): string {
  return MESSAGE_KEY_BY_CODE[code] ?? "errors.common.unknownError";
}

function toSeverity(category: string, code: string): ErrorSeverity {
  if (category === "internal" || code === "INTERNAL_ERROR") {
    return "critical";
  }
  if (category === "authorization" || category === "authentication") {
    return "warning";
  }
  if (category === "validation") {
    return "info";
  }
  return "error";
}

function readRetryAfterMs(details: Record<string, unknown> | undefined): number | undefined {
  const retryAfterSeconds = details?.retryAfterSeconds;
  if (typeof retryAfterSeconds === "number" && retryAfterSeconds > 0) {
    return retryAfterSeconds * 1000;
  }
  const retryAfterMs = details?.retryAfterMs;
  if (typeof retryAfterMs === "number" && retryAfterMs > 0) {
    return retryAfterMs;
  }
  return undefined;
}

function readCorrelationId(details: Record<string, unknown> | undefined): string | undefined {
  const value = details?.requestId ?? details?.correlationId;
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function readMessageParams(
  details: Record<string, unknown> | undefined,
): Record<string, string | number | boolean> | undefined {
  const candidate = details?.messageParams;
  if (!candidate || typeof candidate !== "object") {
    return undefined;
  }

  const normalizedEntries = Object.entries(candidate).filter((entry) => {
    const value = entry[1];
    return typeof value === "string" || typeof value === "number" || typeof value === "boolean";
  });

  if (normalizedEntries.length === 0) {
    return undefined;
  }

  return Object.fromEntries(normalizedEntries);
}

function readSafeCause(error: unknown): string | undefined {
  const meta = import.meta as unknown as { env?: { DEV?: boolean } } | undefined;
  return meta?.env?.DEV && error instanceof Error ? error.message : undefined;
}

function fromCanonicalPayload(payload: CanonicalErrorPayload): NormalizedUiError {
  const code =
    typeof payload.code === "string" && isErrorCode(payload.code) ? payload.code : "INTERNAL_ERROR";
  const category =
    typeof payload.category === "string" && isErrorCategory(payload.category)
      ? payload.category
      : "internal";
  const surface =
    typeof payload.surface === "string" && isErrorSurface(payload.surface)
      ? payload.surface
      : "frontend";
  const details = payload.details;
  const messageKey =
    typeof payload.messageKey === "string" && payload.messageKey.startsWith("errors.")
      ? payload.messageKey
      : toMessageKey(code);
  return {
    code,
    category,
    surface,
    messageKey,
    messageParams: readMessageParams(details),
    retryable: payload.retryable === true,
    retryAfterMs: readRetryAfterMs(details),
    severity: toSeverity(category, code),
    correlationId: readCorrelationId(details),
  };
}

export function normalizeFrontendError(error: unknown): NormalizedUiError {
  if (isTRPCClientError(error)) {
    const data = error.data as TrpcErrorDataWithCanonical | undefined;
    if (data?.canonicalError) {
      return fromCanonicalPayload({
        ...data.canonicalError,
        details: {
          ...(data.canonicalError.details ?? {}),
          httpStatus: data.httpStatus,
        },
      });
    }

    const fallbackCode =
      data?.code === "UNAUTHORIZED" || data?.httpStatus === 401
        ? "AUTH_UNAUTHORIZED"
        : data?.code === "FORBIDDEN" || data?.httpStatus === 403
          ? "AUTH_FORBIDDEN"
          : "INTERNAL_ERROR";
    return {
      code: fallbackCode,
      category: fallbackCode.startsWith("AUTH_") ? "authentication" : "internal",
      surface: "trpc",
      messageKey: toMessageKey(fallbackCode),
      cause: readSafeCause(error),
      retryable: false,
      severity: toSeverity(
        fallbackCode.startsWith("AUTH_") ? "authentication" : "internal",
        fallbackCode,
      ),
    };
  }

  if (
    error !== null &&
    typeof error === "object" &&
    "code" in error &&
    "messageKey" in error &&
    typeof (error as { code?: unknown }).code === "string" &&
    typeof (error as { messageKey?: unknown }).messageKey === "string"
  ) {
    const typed = error as { code: string; messageKey: string; retryable?: boolean };
    return {
      code: typed.code,
      category: "internal",
      surface: "frontend",
      messageKey: typed.messageKey,
      retryable: typed.retryable === true,
      severity: "error",
    };
  }

  return {
    code: "INTERNAL_ERROR",
    category: "internal",
    surface: "frontend",
    messageKey: "errors.common.unknownError",
    cause: readSafeCause(error),
    retryable: false,
    severity: "critical",
  };
}
