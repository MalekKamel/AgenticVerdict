import {
  AppFault,
  type ErrorCode as CoreErrorCode,
  type ErrorCategory,
  type ErrorSurface,
} from "@agenticverdict/core";

import { AgentRuntimeError, AgentRuntimeErrorCode } from "../errors/AgentRuntimeError";

const ERROR_CATEGORY_MAP: Record<AgentRuntimeErrorCode, ErrorCategory> = {
  [AgentRuntimeErrorCode.PROVIDER_NOT_FOUND]: "dependency",
  [AgentRuntimeErrorCode.PROVIDER_ALREADY_REGISTERED]: "conflict",
  [AgentRuntimeErrorCode.INVALID_CONFIG]: "validation",
  [AgentRuntimeErrorCode.AUTHENTICATION_FAILED]: "authentication",
  [AgentRuntimeErrorCode.RATE_LIMIT_EXCEEDED]: "rate_limit",
  [AgentRuntimeErrorCode.REQUEST_TIMEOUT]: "timeout",
  [AgentRuntimeErrorCode.INVALID_REQUEST]: "validation",
  [AgentRuntimeErrorCode.MODEL_NOT_FOUND]: "data_access",
  [AgentRuntimeErrorCode.CONTENT_FILTERED]: "validation",
  [AgentRuntimeErrorCode.INSUFFICIENT_CREDITS]: "authorization",
  [AgentRuntimeErrorCode.INTERNAL_ERROR]: "internal",
  [AgentRuntimeErrorCode.TENANT_CONTEXT_MISSING]: "tenant",
  [AgentRuntimeErrorCode.CREDENTIAL_NOT_FOUND]: "data_access",
  [AgentRuntimeErrorCode.CREDENTIAL_INVALID]: "validation",
  [AgentRuntimeErrorCode.CIRCUIT_BREAKER_OPEN]: "dependency",
  [AgentRuntimeErrorCode.FAILOVER_EXHAUSTED]: "dependency",
  [AgentRuntimeErrorCode.BUDGET_EXCEEDED]: "authorization",
  [AgentRuntimeErrorCode.COMPLIANCE_VIOLATION]: "security",
};

const HTTP_STATUS_MAP: Record<AgentRuntimeErrorCode, number> = {
  [AgentRuntimeErrorCode.PROVIDER_NOT_FOUND]: 404,
  [AgentRuntimeErrorCode.PROVIDER_ALREADY_REGISTERED]: 409,
  [AgentRuntimeErrorCode.INVALID_CONFIG]: 400,
  [AgentRuntimeErrorCode.AUTHENTICATION_FAILED]: 401,
  [AgentRuntimeErrorCode.RATE_LIMIT_EXCEEDED]: 429,
  [AgentRuntimeErrorCode.REQUEST_TIMEOUT]: 504,
  [AgentRuntimeErrorCode.INVALID_REQUEST]: 400,
  [AgentRuntimeErrorCode.MODEL_NOT_FOUND]: 404,
  [AgentRuntimeErrorCode.CONTENT_FILTERED]: 400,
  [AgentRuntimeErrorCode.INSUFFICIENT_CREDITS]: 403,
  [AgentRuntimeErrorCode.INTERNAL_ERROR]: 500,
  [AgentRuntimeErrorCode.TENANT_CONTEXT_MISSING]: 400,
  [AgentRuntimeErrorCode.CREDENTIAL_NOT_FOUND]: 404,
  [AgentRuntimeErrorCode.CREDENTIAL_INVALID]: 400,
  [AgentRuntimeErrorCode.CIRCUIT_BREAKER_OPEN]: 503,
  [AgentRuntimeErrorCode.FAILOVER_EXHAUSTED]: 503,
  [AgentRuntimeErrorCode.BUDGET_EXCEEDED]: 403,
  [AgentRuntimeErrorCode.COMPLIANCE_VIOLATION]: 403,
};

const RETRYABLE_MAP: Record<AgentRuntimeErrorCode, boolean> = {
  [AgentRuntimeErrorCode.PROVIDER_NOT_FOUND]: false,
  [AgentRuntimeErrorCode.PROVIDER_ALREADY_REGISTERED]: false,
  [AgentRuntimeErrorCode.INVALID_CONFIG]: false,
  [AgentRuntimeErrorCode.AUTHENTICATION_FAILED]: false,
  [AgentRuntimeErrorCode.RATE_LIMIT_EXCEEDED]: true,
  [AgentRuntimeErrorCode.REQUEST_TIMEOUT]: true,
  [AgentRuntimeErrorCode.INVALID_REQUEST]: false,
  [AgentRuntimeErrorCode.MODEL_NOT_FOUND]: false,
  [AgentRuntimeErrorCode.CONTENT_FILTERED]: false,
  [AgentRuntimeErrorCode.INSUFFICIENT_CREDITS]: false,
  [AgentRuntimeErrorCode.INTERNAL_ERROR]: false,
  [AgentRuntimeErrorCode.TENANT_CONTEXT_MISSING]: false,
  [AgentRuntimeErrorCode.CREDENTIAL_NOT_FOUND]: false,
  [AgentRuntimeErrorCode.CREDENTIAL_INVALID]: false,
  [AgentRuntimeErrorCode.CIRCUIT_BREAKER_OPEN]: true,
  [AgentRuntimeErrorCode.FAILOVER_EXHAUSTED]: true,
  [AgentRuntimeErrorCode.BUDGET_EXCEEDED]: false,
  [AgentRuntimeErrorCode.COMPLIANCE_VIOLATION]: false,
};

const CORE_ERROR_CODE_MAP: Record<AgentRuntimeErrorCode, CoreErrorCode> = {
  [AgentRuntimeErrorCode.PROVIDER_NOT_FOUND]: "RESOURCE_NOT_FOUND",
  [AgentRuntimeErrorCode.PROVIDER_ALREADY_REGISTERED]: "DB_CONFLICT",
  [AgentRuntimeErrorCode.INVALID_CONFIG]: "VALIDATION_FAILED",
  [AgentRuntimeErrorCode.AUTHENTICATION_FAILED]: "AUTH_UNAUTHORIZED",
  [AgentRuntimeErrorCode.RATE_LIMIT_EXCEEDED]: "RUNTIME_UNAVAILABLE",
  [AgentRuntimeErrorCode.REQUEST_TIMEOUT]: "RUNTIME_TIMEOUT",
  [AgentRuntimeErrorCode.INVALID_REQUEST]: "VALIDATION_FAILED",
  [AgentRuntimeErrorCode.MODEL_NOT_FOUND]: "RESOURCE_NOT_FOUND",
  [AgentRuntimeErrorCode.CONTENT_FILTERED]: "VALIDATION_FAILED",
  [AgentRuntimeErrorCode.INSUFFICIENT_CREDITS]: "AUTH_FORBIDDEN",
  [AgentRuntimeErrorCode.INTERNAL_ERROR]: "INTERNAL_ERROR",
  [AgentRuntimeErrorCode.TENANT_CONTEXT_MISSING]: "TENANT_CONTEXT_REQUIRED",
  [AgentRuntimeErrorCode.CREDENTIAL_NOT_FOUND]: "RESOURCE_NOT_FOUND",
  [AgentRuntimeErrorCode.CREDENTIAL_INVALID]: "VALIDATION_FAILED",
  [AgentRuntimeErrorCode.CIRCUIT_BREAKER_OPEN]: "RUNTIME_UNAVAILABLE",
  [AgentRuntimeErrorCode.FAILOVER_EXHAUSTED]: "RUNTIME_UNAVAILABLE",
  [AgentRuntimeErrorCode.BUDGET_EXCEEDED]: "AUTH_FORBIDDEN",
  [AgentRuntimeErrorCode.COMPLIANCE_VIOLATION]: "STORAGE_SECURITY_ERROR",
};

const MESSAGE_KEY_MAP: Record<AgentRuntimeErrorCode, string> = {
  [AgentRuntimeErrorCode.PROVIDER_NOT_FOUND]: "errors.provider.notFound",
  [AgentRuntimeErrorCode.PROVIDER_ALREADY_REGISTERED]: "errors.provider.alreadyRegistered",
  [AgentRuntimeErrorCode.INVALID_CONFIG]: "errors.provider.invalidConfig",
  [AgentRuntimeErrorCode.AUTHENTICATION_FAILED]: "errors.provider.authenticationFailed",
  [AgentRuntimeErrorCode.RATE_LIMIT_EXCEEDED]: "errors.provider.rateLimitExceeded",
  [AgentRuntimeErrorCode.REQUEST_TIMEOUT]: "errors.provider.timeout",
  [AgentRuntimeErrorCode.INVALID_REQUEST]: "errors.provider.invalidRequest",
  [AgentRuntimeErrorCode.MODEL_NOT_FOUND]: "errors.provider.modelNotFound",
  [AgentRuntimeErrorCode.CONTENT_FILTERED]: "errors.provider.contentFiltered",
  [AgentRuntimeErrorCode.INSUFFICIENT_CREDITS]: "errors.provider.insufficientCredits",
  [AgentRuntimeErrorCode.INTERNAL_ERROR]: "errors.common.unknownError",
  [AgentRuntimeErrorCode.TENANT_CONTEXT_MISSING]: "errors.tenantRequired",
  [AgentRuntimeErrorCode.CREDENTIAL_NOT_FOUND]: "errors.provider.credentialNotFound",
  [AgentRuntimeErrorCode.CREDENTIAL_INVALID]: "errors.provider.credentialInvalid",
  [AgentRuntimeErrorCode.CIRCUIT_BREAKER_OPEN]: "errors.provider.circuitBreakerOpen",
  [AgentRuntimeErrorCode.FAILOVER_EXHAUSTED]: "errors.provider.failoverExhausted",
  [AgentRuntimeErrorCode.BUDGET_EXCEEDED]: "errors.provider.budgetExceeded",
  [AgentRuntimeErrorCode.COMPLIANCE_VIOLATION]: "errors.provider.complianceViolation",
};

export interface AgentRuntimeFault extends AppFault {
  readonly providerId?: string;
  readonly tenantId?: string;
  readonly runtimeCode: AgentRuntimeErrorCode;
}

export function toAgentRuntimeFault(
  error: unknown,
  context: {
    surface?: ErrorSurface;
    providerId?: string;
    tenantId?: string;
  } = {},
): AgentRuntimeFault {
  if (isAgentRuntimeFault(error)) {
    return error;
  }

  let runtimeCode: AgentRuntimeErrorCode;
  let statusCode: number | undefined;
  let metadata: Record<string, unknown> | undefined;

  if (error instanceof AgentRuntimeError) {
    runtimeCode = error.code;
    statusCode = error.statusCode;
    metadata = Object.keys(error.metadata).length > 0 ? error.metadata : undefined;
  } else {
    runtimeCode = AgentRuntimeErrorCode.INTERNAL_ERROR;
    metadata = undefined;
  }

  const coreCode = CORE_ERROR_CODE_MAP[runtimeCode];
  const category = ERROR_CATEGORY_MAP[runtimeCode];
  const httpStatus = statusCode ?? HTTP_STATUS_MAP[runtimeCode];
  const retryable = RETRYABLE_MAP[runtimeCode];
  const messageKey = MESSAGE_KEY_MAP[runtimeCode];

  const details: Record<string, unknown> = {
    runtimeCode,
    messageKey,
  };

  if (context.providerId || error instanceof AgentRuntimeError) {
    details.providerId = context.providerId ?? (error as AgentRuntimeError).providerId;
  }

  if (context.tenantId || error instanceof AgentRuntimeError) {
    details.tenantId = context.tenantId ?? (error as AgentRuntimeError).tenantId;
  }

  if (metadata) {
    details.metadata = metadata;
  }

  if (context.surface) {
    details.surface = context.surface;
  }

  const fault = new AppFault({
    code: coreCode,
    category,
    httpStatus,
    retryable,
    safeMessage: messageKey,
    details,
    cause: error,
    surface: context.surface,
  }) as AgentRuntimeFault;

  Object.defineProperty(fault, "providerId", {
    value: context.providerId ?? (error as AgentRuntimeError)?.providerId,
    enumerable: false,
    writable: false,
  });

  Object.defineProperty(fault, "tenantId", {
    value: context.tenantId ?? (error as AgentRuntimeError)?.tenantId,
    enumerable: false,
    writable: false,
  });

  Object.defineProperty(fault, "runtimeCode", {
    value: runtimeCode,
    enumerable: false,
    writable: false,
  });

  return fault;
}

export function isAgentRuntimeFault(error: unknown): error is AgentRuntimeFault {
  if (!(error instanceof AppFault)) {
    return false;
  }

  const candidate = error as Partial<AgentRuntimeFault>;
  return (
    typeof candidate.runtimeCode === "string" &&
    Object.values(AgentRuntimeErrorCode).includes(candidate.runtimeCode as AgentRuntimeErrorCode)
  );
}

export function getAgentRuntimeFaultCode(fault: AgentRuntimeFault): AgentRuntimeErrorCode {
  return fault.runtimeCode;
}

export function getAgentRuntimeFaultMessageKey(fault: AgentRuntimeFault): string {
  return MESSAGE_KEY_MAP[fault.runtimeCode] ?? "errors.common.unknownError";
}
