import { AgentRuntimeError, AgentRuntimeErrorCode } from "../../errors/AgentRuntimeError";

interface AnthropicErrorBody {
  error?: {
    message?: string;
    type?: string;
  };
}

interface AnthropicError extends Error {
  status?: number;
  headers?: Record<string, string>;
  error?: AnthropicErrorBody["error"];
}

function isAnthropicError(error: unknown): error is AnthropicError {
  return (
    error !== null &&
    typeof error === "object" &&
    "name" in error &&
    (error as Record<string, unknown>).name === "APIError"
  );
}

function getStatusCode(error: AnthropicError): number | undefined {
  return error.status;
}

function getErrorMessage(error: AnthropicError): string {
  return error.error?.message ?? error.message ?? "Unknown Anthropic error";
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

function mapAnthropicErrorTypeToErrorCode(errorType: string): AgentRuntimeErrorCode | null {
  const typeMapping: Record<string, AgentRuntimeErrorCode> = {
    authentication_error: AgentRuntimeErrorCode.AUTHENTICATION_FAILED,
    invalid_request_error: AgentRuntimeErrorCode.INVALID_REQUEST,
    not_found_error: AgentRuntimeErrorCode.MODEL_NOT_FOUND,
    rate_limit_error: AgentRuntimeErrorCode.RATE_LIMIT_EXCEEDED,
    api_error: AgentRuntimeErrorCode.INTERNAL_ERROR,
    overloaded_error: AgentRuntimeErrorCode.RATE_LIMIT_EXCEEDED,
    content_policy_violation: AgentRuntimeErrorCode.CONTENT_FILTERED,
    invalid_tool_error: AgentRuntimeErrorCode.INVALID_REQUEST,
  };

  return typeMapping[errorType] ?? null;
}

export function translateAnthropicError(
  error: unknown,
  context: {
    providerId: string;
    tenantId?: string;
  },
): AgentRuntimeError {
  if (!isAnthropicError(error)) {
    return new AgentRuntimeError({
      code: AgentRuntimeErrorCode.INTERNAL_ERROR,
      message: error instanceof Error ? error.message : "Unknown error occurred",
      providerId: context.providerId,
      tenantId: context.tenantId,
      cause: error,
    });
  }

  const statusCode = getStatusCode(error);
  const errorType = error.error?.type;
  const message = getErrorMessage(error);

  let code: AgentRuntimeErrorCode;

  if (errorType) {
    const mappedCode = mapAnthropicErrorTypeToErrorCode(errorType);
    if (mappedCode) {
      code = mappedCode;
    } else {
      code = mapStatusCodeToErrorCode(statusCode);
    }
  } else {
    code = mapStatusCodeToErrorCode(statusCode);
  }

  const metadata: Record<string, unknown> = {};

  if (error.error?.type) {
    metadata.errorType = error.error.type;
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

export function isAnthropicRateLimitError(error: unknown): boolean {
  if (!isAnthropicError(error)) {
    return false;
  }

  return (
    error.status === 429 ||
    error.error?.type === "rate_limit_error" ||
    error.error?.type === "overloaded_error"
  );
}

export function isAnthropicAuthenticationError(error: unknown): boolean {
  if (!isAnthropicError(error)) {
    return false;
  }

  return (
    error.status === 401 || error.status === 403 || error.error?.type === "authentication_error"
  );
}

export function isAnthropicContentFilterError(error: unknown): boolean {
  if (!isAnthropicError(error)) {
    return false;
  }

  return error.error?.type === "content_policy_violation";
}
