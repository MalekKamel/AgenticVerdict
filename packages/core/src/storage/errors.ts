import { AppFault } from "../errors";

export class StorageError extends AppFault {
  constructor(message: string, options?: { cause?: unknown; details?: Record<string, unknown> }) {
    super({
      code: "STORAGE_ERROR",
      category: "dependency",
      httpStatus: 500,
      retryable: true,
      safeMessage: message,
      details: options?.details,
      cause: options?.cause,
    });
  }
}

export class TenantSecurityError extends AppFault {
  constructor(message: string, options?: { cause?: unknown; details?: Record<string, unknown> }) {
    super({
      code: "STORAGE_SECURITY_ERROR",
      category: "security",
      httpStatus: 403,
      retryable: false,
      safeMessage: message,
      details: options?.details,
      cause: options?.cause,
    });
  }
}

export class StorageUploadError extends StorageError {
  constructor(
    message: string,
    options?: { cause?: unknown; details?: Record<string, unknown>; key?: string },
  ) {
    super(message, {
      cause: options?.cause,
      details: { ...options?.details, key: options?.key },
    });
  }
}

export class StorageDownloadError extends StorageError {
  constructor(
    message: string,
    options?: { cause?: unknown; details?: Record<string, unknown>; key?: string },
  ) {
    super(message, {
      cause: options?.cause,
      details: { ...options?.details, key: options?.key },
    });
  }
}

export class StorageDeleteError extends StorageError {
  constructor(
    message: string,
    options?: { cause?: unknown; details?: Record<string, unknown>; key?: string },
  ) {
    super(message, {
      cause: options?.cause,
      details: { ...options?.details, key: options?.key },
    });
  }
}

export class StorageNotFoundError extends StorageError {
  constructor(
    message: string,
    options?: { cause?: unknown; details?: Record<string, unknown>; key?: string },
  ) {
    super(message, {
      cause: options?.cause,
      details: { ...options?.details, key: options?.key },
    });
  }
}

export class StorageIntegrityError extends StorageError {
  constructor(
    message: string,
    options?: { cause?: unknown; details?: Record<string, unknown>; key?: string },
  ) {
    super(message, {
      cause: options?.cause,
      details: { ...options?.details, key: options?.key },
    });
  }
}

export class StorageConfigurationError extends StorageError {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, { cause: options?.cause });
  }
}
