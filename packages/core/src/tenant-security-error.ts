export type TenantSecurityCode =
  | "MISSING_TENANT"
  /** No tenant could be established when one is required (SSOT NFR-T3 / C-HTTP-3). */
  | "TENANT_CONTEXT_REQUIRED"
  | "INVALID_TENANT_ID"
  | "TENANT_SLUG_UNRESOLVED"
  | "TENANT_CONFIG_NOT_FOUND"
  | "TENANT_INACTIVE"
  | "TENANT_MISMATCH";

/**
 * Structured error for failed tenant resolution or isolation violations.
 * Callers map `httpStatus` to HTTP responses in servers; workers may log and abort jobs.
 */
export class TenantSecurityError extends Error {
  readonly code: TenantSecurityCode;
  readonly httpStatus: number;

  constructor(code: TenantSecurityCode, message: string, httpStatus: number) {
    super(message);
    this.name = "TenantSecurityError";
    this.code = code;
    this.httpStatus = httpStatus;
  }
}
