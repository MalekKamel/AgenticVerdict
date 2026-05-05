import { AgentRuntimeError, AgentRuntimeErrorCode } from "../../errors/AgentRuntimeError";

interface OpenAIErrorBody {
  error?: {
    message?: string;
    type?: string;
    param?: string | null;
    code?: string | null;
  };
}

interface OpenAIError extends Error {
  status?: number;
  headers?: Record<string, string>;
  error?: OpenAIErrorBody["error"];
}

function isOpenAIError(error: unknown): error is OpenAIError {
  return (
    error !== null &&
    typeof error === "object" &&
    "name" in error &&
    (error as Record<string, unknown>).name === "APIError"
  );
}

function getStatusCode(error: OpenAIError): number | undefined {
  return error.status;
}

function getErrorCode(error: OpenAIError): string | null | undefined {
  return error.error?.code;
}

function getErrorMessage(error: OpenAIError): string {
  return error.error?.message ?? error.message ?? "Unknown OpenAI error";
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

function mapOpenAIErrorCodeToErrorCode(openAIErrorCode: string): AgentRuntimeErrorCode | null {
  const codeMapping: Record<string, AgentRuntimeErrorCode> = {
    api_key_expired: AgentRuntimeErrorCode.AUTHENTICATION_FAILED,
    incorrect_api_key: AgentRuntimeErrorCode.AUTHENTICATION_FAILED,
    invalid_api_key: AgentRuntimeErrorCode.AUTHENTICATION_FAILED,
    invalid_request_error: AgentRuntimeErrorCode.INVALID_REQUEST,
    model_not_found: AgentRuntimeErrorCode.MODEL_NOT_FOUND,
    context_length_exceeded: AgentRuntimeErrorCode.INVALID_REQUEST,
    content_policy_violation: AgentRuntimeErrorCode.CONTENT_FILTERED,
    insufficient_quota: AgentRuntimeErrorCode.INSUFFICIENT_CREDITS,
    rate_limit_exceeded: AgentRuntimeErrorCode.RATE_LIMIT_EXCEEDED,
    server_error: AgentRuntimeErrorCode.INTERNAL_ERROR,
    timeout: AgentRuntimeErrorCode.REQUEST_TIMEOUT,
  };

  return codeMapping[openAIErrorCode] ?? null;
}

export function translateOpenAIError(
  error: unknown,
  context: {
    providerId: string;
    tenantId?: string;
  },
): AgentRuntimeError {
  if (!isOpenAIError(error)) {
    return new AgentRuntimeError({
      code: AgentRuntimeErrorCode.INTERNAL_ERROR,
      message: error instanceof Error ? error.message : "Unknown error occurred",
      providerId: context.providerId,
      tenantId: context.tenantId,
      cause: error,
    });
  }

  const statusCode = getStatusCode(error);
  const openAIErrorCode = getErrorCode(error);
  const message = getErrorMessage(error);

  let code: AgentRuntimeErrorCode;

  if (openAIErrorCode) {
    const mappedCode = mapOpenAIErrorCodeToErrorCode(openAIErrorCode);
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

  if (error.error?.param) {
    metadata.param = error.error.param;
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

export function isOpenAIRateLimitError(error: unknown): boolean {
  if (!isOpenAIError(error)) {
    return false;
  }

  return (
    error.status === 429 ||
    error.error?.code === "rate_limit_exceeded" ||
    error.error?.type === "rate_limit_error"
  );
}

export function isOpenAIAuthenticationError(error: unknown): boolean {
  if (!isOpenAIError(error)) {
    return false;
  }

  return (
    error.status === 401 ||
    error.status === 403 ||
    ["invalid_api_key", "incorrect_api_key", "api_key_expired"].includes(error.error?.code ?? "")
  );
}

export function isOpenAIContentFilterError(error: unknown): boolean {
  if (!isOpenAIError(error)) {
    return false;
  }

  return error.error?.code === "content_policy_violation";
}
