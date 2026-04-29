import { AppFault, getMessageKeyForErrorCode, toAppFault, type ErrorSurface } from "./errors";

export interface CanonicalBoundaryPayload {
  code: string;
  category: string;
  retryable: boolean;
  messageKey: string;
  message: string;
  details: Record<string, unknown>;
}

export interface HttpErrorResponse {
  statusCode: number;
  body: {
    error: CanonicalBoundaryPayload;
    requestId?: string;
  };
}

export interface TrpcErrorMeta {
  code: string;
  category: string;
  retryable: boolean;
  surface: ErrorSurface;
  details: Record<string, unknown>;
}

export interface QueueFailurePayload {
  code: string;
  category: string;
  retryable: boolean;
  messageKey: string;
  message: string;
  details: Record<string, unknown>;
}

function toBoundaryPayload(
  fault: AppFault,
  fallbackSurface: ErrorSurface,
): CanonicalBoundaryPayload {
  return {
    code: fault.code,
    category: fault.category,
    retryable: fault.retryable,
    messageKey: getMessageKeyForErrorCode(fault.code),
    message: fault.safeMessage,
    details: {
      ...(fault.details ?? {}),
      surface: fault.surface ?? fallbackSurface,
    },
  };
}

export function toHttpErrorResponse(error: unknown, requestId?: string): HttpErrorResponse {
  const fault = toAppFault(error, { surface: "http" });
  return {
    statusCode: fault.httpStatus,
    body: {
      error: toBoundaryPayload(fault, "http"),
      ...(requestId ? { requestId } : {}),
    },
  };
}

export function toTrpcErrorMeta(
  error: unknown,
  context?: {
    requestId?: string;
    correlationId?: string;
    trpcPath?: string;
  },
): TrpcErrorMeta {
  const fault = toAppFault(error, { surface: "trpc" });
  const details: Record<string, unknown> = {
    ...(fault.details ?? {}),
    surface: fault.surface ?? "trpc",
  };
  if (context?.requestId) {
    details.requestId = context.requestId;
  }
  if (context?.correlationId) {
    details.correlationId = context.correlationId;
  }
  if (context?.trpcPath) {
    details.trpcPath = context.trpcPath;
  }
  return {
    code: fault.code,
    category: fault.category,
    retryable: fault.retryable,
    surface: fault.surface ?? "trpc",
    details,
  };
}

export function toTrpcErrorCode(
  error: unknown,
):
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "TIMEOUT"
  | "TOO_MANY_REQUESTS"
  | "INTERNAL_SERVER_ERROR" {
  const statusCandidate =
    error !== null &&
    typeof error === "object" &&
    "httpStatus" in error &&
    typeof (error as { httpStatus?: unknown }).httpStatus === "number"
      ? (error as { httpStatus: number }).httpStatus
      : toAppFault(error, { surface: "trpc" }).httpStatus;
  if (statusCandidate === 409) {
    return "CONFLICT";
  }
  if (statusCandidate === 504) {
    return "TIMEOUT";
  }
  if (statusCandidate >= 500) {
    return "INTERNAL_SERVER_ERROR";
  }
  if (statusCandidate === 401) {
    return "UNAUTHORIZED";
  }
  if (statusCandidate === 403) {
    return "FORBIDDEN";
  }
  if (statusCandidate === 404) {
    return "NOT_FOUND";
  }
  if (statusCandidate === 429) {
    return "TOO_MANY_REQUESTS";
  }
  return "BAD_REQUEST";
}

export function toQueueFailure(error: unknown): QueueFailurePayload {
  const fault = toAppFault(error, { surface: "queue" });
  return toBoundaryPayload(fault, "queue");
}

export function toWorkerFailure(error: unknown): QueueFailurePayload {
  const fault = toAppFault(error, { surface: "worker" });
  return toBoundaryPayload(fault, "worker");
}
