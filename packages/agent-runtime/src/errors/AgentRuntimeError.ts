export enum AgentRuntimeErrorCode {
  PROVIDER_NOT_FOUND = "PROVIDER_NOT_FOUND",
  PROVIDER_ALREADY_REGISTERED = "PROVIDER_ALREADY_REGISTERED",
  INVALID_CONFIG = "INVALID_CONFIG",
  AUTHENTICATION_FAILED = "AUTHENTICATION_FAILED",
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
  REQUEST_TIMEOUT = "REQUEST_TIMEOUT",
  INVALID_REQUEST = "INVALID_REQUEST",
  MODEL_NOT_FOUND = "MODEL_NOT_FOUND",
  CONTENT_FILTERED = "CONTENT_FILTERED",
  INSUFFICIENT_CREDITS = "INSUFFICIENT_CREDITS",
  INTERNAL_ERROR = "INTERNAL_ERROR",
  TENANT_CONTEXT_MISSING = "TENANT_CONTEXT_MISSING",
  CREDENTIAL_NOT_FOUND = "CREDENTIAL_NOT_FOUND",
  CREDENTIAL_INVALID = "CREDENTIAL_INVALID",
  CIRCUIT_BREAKER_OPEN = "CIRCUIT_BREAKER_OPEN",
  FAILOVER_EXHAUSTED = "FAILOVER_EXHAUSTED",
  BUDGET_EXCEEDED = "BUDGET_EXCEEDED",
  COMPLIANCE_VIOLATION = "COMPLIANCE_VIOLATION",
  HOOK_EXECUTION_FAILED = "HOOK_EXECUTION_FAILED",
}

export interface AgentRuntimeErrorOptions {
  code: AgentRuntimeErrorCode;
  message: string;
  providerId?: string;
  tenantId?: string;
  statusCode?: number;
  cause?: unknown;
  metadata?: Record<string, unknown>;
}

export class AgentRuntimeError extends Error {
  public readonly code: AgentRuntimeErrorCode;
  public readonly providerId?: string;
  public readonly tenantId?: string;
  public readonly statusCode?: number;
  public readonly metadata: Record<string, unknown>;
  public readonly timestamp: number;

  constructor(options: AgentRuntimeErrorOptions) {
    super(options.message);
    this.name = "AgentRuntimeError";
    this.code = options.code;
    this.providerId = options.providerId;
    this.tenantId = options.tenantId;
    this.statusCode = options.statusCode;
    this.metadata = options.metadata ?? {};
    this.timestamp = Date.now();
    this.cause = options.cause;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AgentRuntimeError);
    }
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      providerId: this.providerId,
      tenantId: this.tenantId,
      statusCode: this.statusCode,
      metadata: this.metadata,
      timestamp: this.timestamp,
    };
  }

  static isAgentRuntimeError(error: unknown): error is AgentRuntimeError {
    return error instanceof AgentRuntimeError;
  }

  /**
   * Create an AgentRuntimeError from an unknown error with additional context.
   */
  static fromError(options: {
    code: AgentRuntimeErrorCode;
    providerId?: string;
    tenantId?: string;
    cause?: unknown;
    metadata?: Record<string, unknown>;
  }): AgentRuntimeError {
    const { code, providerId, tenantId, cause, metadata } = options;

    let message = "An error occurred";
    if (cause instanceof Error) {
      message = cause.message;
    } else if (typeof cause === "string") {
      message = cause;
    }

    return new AgentRuntimeError({
      code,
      message,
      providerId,
      tenantId,
      cause,
      metadata,
    });
  }
}
