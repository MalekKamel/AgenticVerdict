import type { ConnectorType } from "@agenticverdict/types";

export type PlatformErrorCode =
  | "auth_failed"
  | "rate_limited"
  | "invalid_request"
  | "upstream_error"
  | "not_found"
  | "circuit_open"
  | "not_registered"
  | "missing_tenant_id"
  | "unknown";

export class PlatformError extends Error {
  public readonly connector: ConnectorType;
  public readonly code: PlatformErrorCode;
  public readonly cause?: unknown;

  constructor(
    connector: ConnectorType,
    code: PlatformErrorCode,
    message: string,
    options?: { cause?: unknown },
  ) {
    super(message);
    this.name = "PlatformError";
    this.connector = connector;
    this.code = code;
    this.cause = options?.cause;
  }
}

export class PlatformAuthError extends PlatformError {
  constructor(connector: ConnectorType, message: string, options?: { cause?: unknown }) {
    super(connector, "auth_failed", message, options);
    this.name = "PlatformAuthError";
  }
}

export class PlatformRateLimitError extends PlatformError {
  constructor(connector: ConnectorType, message: string, options?: { cause?: unknown }) {
    super(connector, "rate_limited", message, options);
    this.name = "PlatformRateLimitError";
  }
}

export class PlatformCircuitOpenError extends PlatformError {
  constructor(connector: ConnectorType, message = "Circuit breaker is open") {
    super(connector, "circuit_open", message);
    this.name = "PlatformCircuitOpenError";
  }
}
