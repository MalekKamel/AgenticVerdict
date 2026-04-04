import type { PlatformType } from "@agenticverdict/types";

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
  public readonly platform: PlatformType;
  public readonly code: PlatformErrorCode;
  public readonly cause?: unknown;

  constructor(
    platform: PlatformType,
    code: PlatformErrorCode,
    message: string,
    options?: { cause?: unknown },
  ) {
    super(message);
    this.name = "PlatformError";
    this.platform = platform;
    this.code = code;
    this.cause = options?.cause;
  }
}

export class PlatformAuthError extends PlatformError {
  constructor(platform: PlatformType, message: string, options?: { cause?: unknown }) {
    super(platform, "auth_failed", message, options);
    this.name = "PlatformAuthError";
  }
}

export class PlatformRateLimitError extends PlatformError {
  constructor(platform: PlatformType, message: string, options?: { cause?: unknown }) {
    super(platform, "rate_limited", message, options);
    this.name = "PlatformRateLimitError";
  }
}

export class PlatformCircuitOpenError extends PlatformError {
  constructor(platform: PlatformType, message = "Circuit breaker is open") {
    super(platform, "circuit_open", message);
    this.name = "PlatformCircuitOpenError";
  }
}
