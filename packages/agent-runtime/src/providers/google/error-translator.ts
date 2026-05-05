import { AgentRuntimeError, AgentRuntimeErrorCode } from "../../errors/AgentRuntimeError";

interface GoogleErrorBody {
  error?: {
    message?: string;
    status?: string;
    code?: number;
  };
}

interface GoogleError extends Error {
  status?: number;
  headers?: Record<string, string>;
  error?: GoogleErrorBody["error"];
}

function isGoogleError(error: unknown): error is GoogleError {
  return (
    error !== null &&
    typeof error === "object" &&
    "name" in error &&
    (error as Record<string, unknown>).name === "GoogleGenerativeAIError"
  );
}

function getStatusCode(error: GoogleError): number | undefined {
  return error.status;
}

function getErrorMessage(error: GoogleError): string {
  return error.error?.message ?? error.message ?? "Unknown Google error";
}

function mapStatusCodeToErrorCode(statusCode: number | undefined): AgentRuntimeErrorCode {
  if (!statusCode) {
    return AgentRuntimeErrorCode.INTERNAL_ERROR;
  }

  if (statusCode === 400) {
    return AgentRuntimeErrorCode.INVALID_REQUEST;
  }

  if (statusCode === 401) {
    return AgentRuntimeErrorCode.AUTHENTICATION_FAILED;
  }

  if (statusCode === 403) {
    return AgentRuntimeErrorCode.AUTHENTICATION_FAILED;
  }

  if (statusCode === 404) {
    return AgentRuntimeErrorCode.MODEL_NOT_FOUND;
  }

  if (statusCode === 429) {
    return AgentRuntimeErrorCode.RATE_LIMIT_EXCEEDED;
  }

  if (statusCode === 500) {
    return AgentRuntimeErrorCode.INTERNAL_ERROR;
  }

  if (statusCode === 502) {
    return AgentRuntimeErrorCode.INTERNAL_ERROR;
  }

  if (statusCode === 503) {
    return AgentRuntimeErrorCode.INTERNAL_ERROR;
  }

  if (statusCode === 504) {
    return AgentRuntimeErrorCode.REQUEST_TIMEOUT;
  }

  return AgentRuntimeErrorCode.INTERNAL_ERROR;
}

function mapGoogleErrorTypeToErrorCode(
  errorType: string | undefined,
): AgentRuntimeErrorCode | null {
  if (!errorType) {
    return null;
  }

  const typeMapping: Record<string, AgentRuntimeErrorCode> = {
    INVALID_ARGUMENT: AgentRuntimeErrorCode.INVALID_REQUEST,
    FAILED_PRECONDITION: AgentRuntimeErrorCode.INVALID_REQUEST,
    UNAUTHENTICATED: AgentRuntimeErrorCode.AUTHENTICATION_FAILED,
    PERMISSION_DENIED: AgentRuntimeErrorCode.AUTHENTICATION_FAILED,
    NOT_FOUND: AgentRuntimeErrorCode.MODEL_NOT_FOUND,
    RESOURCE_EXHAUSTED: AgentRuntimeErrorCode.RATE_LIMIT_EXCEEDED,
    QUOTA_EXCEEDED: AgentRuntimeErrorCode.INSUFFICIENT_CREDITS,
    INTERNAL: AgentRuntimeErrorCode.INTERNAL_ERROR,
    UNAVAILABLE: AgentRuntimeErrorCode.INTERNAL_ERROR,
    DEADLINE_EXCEEDED: AgentRuntimeErrorCode.REQUEST_TIMEOUT,
    UNIMPLEMENTED: AgentRuntimeErrorCode.INVALID_REQUEST,
    ABORTED: AgentRuntimeErrorCode.INTERNAL_ERROR,
    ALREADY_EXISTS: AgentRuntimeErrorCode.INVALID_REQUEST,
    CANCELLED: AgentRuntimeErrorCode.REQUEST_TIMEOUT,
    DATA_LOSS: AgentRuntimeErrorCode.INTERNAL_ERROR,
    UNKNOWN: AgentRuntimeErrorCode.INTERNAL_ERROR,
  };

  return typeMapping[errorType] ?? null;
}

export function translateGoogleError(
  error: unknown,
  context: {
    providerId: string;
    tenantId?: string;
  },
): AgentRuntimeError {
  if (!isGoogleError(error)) {
    return new AgentRuntimeError({
      code: AgentRuntimeErrorCode.INTERNAL_ERROR,
      message: error instanceof Error ? error.message : "Unknown error occurred",
      providerId: context.providerId,
      tenantId: context.tenantId,
      cause: error,
    });
  }

  const statusCode = getStatusCode(error);
  const errorType = error.error?.status;
  const message = getErrorMessage(error);

  let code: AgentRuntimeErrorCode;

  if (errorType) {
    const mappedCode = mapGoogleErrorTypeToErrorCode(errorType);
    if (mappedCode) {
      code = mappedCode;
    } else {
      code = mapStatusCodeToErrorCode(statusCode);
    }
  } else {
    code = mapStatusCodeToErrorCode(statusCode);
  }

  const metadata: Record<string, unknown> = {};

  if (error.error?.status) {
    metadata.errorStatus = error.error.status;
  }

  if (error.error?.code) {
    metadata.errorCode = error.error.code;
  }

  if (statusCode) {
    metadata.httpStatus = statusCode;
  }

  return new AgentRuntimeError({
    code,
    message,
    providerId: context.providerId,
    tenantId: context.tenantId,
    statusCode,
    metadata,
    cause: error,
  });
}

export function isGoogleRateLimitError(error: unknown): boolean {
  if (!isGoogleError(error)) {
    return false;
  }

  return (
    error.status === 429 ||
    error.error?.status === "RESOURCE_EXHAUSTED" ||
    error.error?.status === "QUOTA_EXCEEDED"
  );
}

export function isGoogleAuthenticationError(error: unknown): boolean {
  if (!isGoogleError(error)) {
    return false;
  }

  return (
    error.status === 401 ||
    error.status === 403 ||
    error.error?.status === "UNAUTHENTICATED" ||
    error.error?.status === "PERMISSION_DENIED"
  );
}

export function isGoogleContentFilterError(error: unknown): boolean {
  if (!isGoogleError(error)) {
    return false;
  }

  return error.error?.status === "FAILED_PRECONDITION";
}
