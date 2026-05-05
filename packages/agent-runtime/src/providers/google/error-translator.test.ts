import { describe, it, expect } from "vitest";
import {
  translateGoogleError,
  isGoogleRateLimitError,
  isGoogleAuthenticationError,
  isGoogleContentFilterError,
} from "./error-translator";
import { AgentRuntimeErrorCode } from "../../errors/AgentRuntimeError";

describe("translateGoogleError", () => {
  const context = {
    providerId: "google",
    tenantId: "test-tenant",
  };

  it("should handle generic errors", () => {
    const error = new Error("Something went wrong");
    const translated = translateGoogleError(error, context);

    expect(translated.code).toBe(AgentRuntimeErrorCode.INTERNAL_ERROR);
    expect(translated.message).toBe("Something went wrong");
    expect(translated.providerId).toBe("google");
    expect(translated.tenantId).toBe("test-tenant");
  });

  it("should handle 400 Bad Request", () => {
    const error = {
      name: "GoogleGenerativeAIError",
      message: "Invalid request",
      status: 400,
      error: {
        status: "INVALID_ARGUMENT",
        message: "Invalid request parameters",
      },
    };

    const translated = translateGoogleError(error, context);
    expect(translated.code).toBe(AgentRuntimeErrorCode.INVALID_REQUEST);
    expect(translated.statusCode).toBe(400);
  });

  it("should handle 401 Unauthorized", () => {
    const error = {
      name: "GoogleGenerativeAIError",
      message: "Invalid API key",
      status: 401,
      error: {
        status: "UNAUTHENTICATED",
        message: "Invalid API key",
      },
    };

    const translated = translateGoogleError(error, context);
    expect(translated.code).toBe(AgentRuntimeErrorCode.AUTHENTICATION_FAILED);
    expect(translated.statusCode).toBe(401);
  });

  it("should handle 403 Forbidden", () => {
    const error = {
      name: "GoogleGenerativeAIError",
      message: "Permission denied",
      status: 403,
      error: {
        status: "PERMISSION_DENIED",
        message: "Permission denied",
      },
    };

    const translated = translateGoogleError(error, context);
    expect(translated.code).toBe(AgentRuntimeErrorCode.AUTHENTICATION_FAILED);
    expect(translated.statusCode).toBe(403);
  });

  it("should handle 404 Not Found", () => {
    const error = {
      name: "GoogleGenerativeAIError",
      message: "Model not found",
      status: 404,
      error: {
        status: "NOT_FOUND",
        message: "Model not found",
      },
    };

    const translated = translateGoogleError(error, context);
    expect(translated.code).toBe(AgentRuntimeErrorCode.MODEL_NOT_FOUND);
    expect(translated.statusCode).toBe(404);
  });

  it("should handle 429 Rate Limit", () => {
    const error = {
      name: "GoogleGenerativeAIError",
      message: "Rate limit exceeded",
      status: 429,
      error: {
        status: "RESOURCE_EXHAUSTED",
        message: "Rate limit exceeded",
      },
    };

    const translated = translateGoogleError(error, context);
    expect(translated.code).toBe(AgentRuntimeErrorCode.RATE_LIMIT_EXCEEDED);
    expect(translated.statusCode).toBe(429);
  });

  it("should handle quota exceeded", () => {
    const error = {
      name: "GoogleGenerativeAIError",
      message: "Quota exceeded",
      status: 429,
      error: {
        status: "QUOTA_EXCEEDED",
        message: "Quota exceeded",
      },
    };

    const translated = translateGoogleError(error, context);
    expect(translated.code).toBe(AgentRuntimeErrorCode.INSUFFICIENT_CREDITS);
    expect(translated.statusCode).toBe(429);
  });

  it("should handle 500 Internal Server Error", () => {
    const error = {
      name: "GoogleGenerativeAIError",
      message: "Internal error",
      status: 500,
      error: {
        status: "INTERNAL",
        message: "Internal server error",
      },
    };

    const translated = translateGoogleError(error, context);
    expect(translated.code).toBe(AgentRuntimeErrorCode.INTERNAL_ERROR);
    expect(translated.statusCode).toBe(500);
  });

  it("should handle 503 Service Unavailable", () => {
    const error = {
      name: "GoogleGenerativeAIError",
      message: "Service unavailable",
      status: 503,
      error: {
        status: "UNAVAILABLE",
        message: "Service unavailable",
      },
    };

    const translated = translateGoogleError(error, context);
    expect(translated.code).toBe(AgentRuntimeErrorCode.INTERNAL_ERROR);
    expect(translated.statusCode).toBe(503);
  });

  it("should handle 504 Gateway Timeout", () => {
    const error = {
      name: "GoogleGenerativeAIError",
      message: "Request timeout",
      status: 504,
      error: {
        status: "DEADLINE_EXCEEDED",
        message: "Request timeout",
      },
    };

    const translated = translateGoogleError(error, context);
    expect(translated.code).toBe(AgentRuntimeErrorCode.REQUEST_TIMEOUT);
    expect(translated.statusCode).toBe(504);
  });

  it("should include metadata in error", () => {
    const error = {
      name: "GoogleGenerativeAIError",
      message: "Error occurred",
      status: 400,
      error: {
        status: "INVALID_ARGUMENT",
        code: 400,
        message: "Invalid argument",
      },
    };

    const translated = translateGoogleError(error, context);
    expect(translated.metadata).toEqual({
      errorStatus: "INVALID_ARGUMENT",
      errorCode: 400,
      httpStatus: 400,
    });
  });

  it("should handle unknown error types", () => {
    const error = {
      name: "GoogleGenerativeAIError",
      message: "Unknown error",
      status: 418,
      error: {
        status: "UNKNOWN_ERROR_TYPE",
        message: "Unknown error",
      },
    };

    const translated = translateGoogleError(error, context);
    expect(translated.code).toBe(AgentRuntimeErrorCode.INTERNAL_ERROR);
    expect(translated.statusCode).toBe(418);
  });
});

describe("isGoogleRateLimitError", () => {
  it("should return true for 429 status", () => {
    const error = {
      name: "GoogleGenerativeAIError",
      status: 429,
    };

    expect(isGoogleRateLimitError(error)).toBe(true);
  });

  it("should return true for RESOURCE_EXHAUSTED", () => {
    const error = {
      name: "GoogleGenerativeAIError",
      error: {
        status: "RESOURCE_EXHAUSTED",
      },
    };

    expect(isGoogleRateLimitError(error)).toBe(true);
  });

  it("should return true for QUOTA_EXCEEDED", () => {
    const error = {
      name: "GoogleGenerativeAIError",
      error: {
        status: "QUOTA_EXCEEDED",
      },
    };

    expect(isGoogleRateLimitError(error)).toBe(true);
  });

  it("should return false for non-Google errors", () => {
    const error = new Error("Regular error");
    expect(isGoogleRateLimitError(error)).toBe(false);
  });

  it("should return false for other status codes", () => {
    const error = {
      name: "GoogleGenerativeAIError",
      status: 500,
    };

    expect(isGoogleRateLimitError(error)).toBe(false);
  });
});

describe("isGoogleAuthenticationError", () => {
  it("should return true for 401 status", () => {
    const error = {
      name: "GoogleGenerativeAIError",
      status: 401,
    };

    expect(isGoogleAuthenticationError(error)).toBe(true);
  });

  it("should return true for 403 status", () => {
    const error = {
      name: "GoogleGenerativeAIError",
      status: 403,
    };

    expect(isGoogleAuthenticationError(error)).toBe(true);
  });

  it("should return true for UNAUTHENTICATED", () => {
    const error = {
      name: "GoogleGenerativeAIError",
      error: {
        status: "UNAUTHENTICATED",
      },
    };

    expect(isGoogleAuthenticationError(error)).toBe(true);
  });

  it("should return true for PERMISSION_DENIED", () => {
    const error = {
      name: "GoogleGenerativeAIError",
      error: {
        status: "PERMISSION_DENIED",
      },
    };

    expect(isGoogleAuthenticationError(error)).toBe(true);
  });

  it("should return false for non-Google errors", () => {
    const error = new Error("Regular error");
    expect(isGoogleAuthenticationError(error)).toBe(false);
  });

  it("should return false for other status codes", () => {
    const error = {
      name: "GoogleGenerativeAIError",
      status: 404,
    };

    expect(isGoogleAuthenticationError(error)).toBe(false);
  });
});

describe("isGoogleContentFilterError", () => {
  it("should return true for FAILED_PRECONDITION", () => {
    const error = {
      name: "GoogleGenerativeAIError",
      error: {
        status: "FAILED_PRECONDITION",
      },
    };

    expect(isGoogleContentFilterError(error)).toBe(true);
  });

  it("should return false for non-Google errors", () => {
    const error = new Error("Regular error");
    expect(isGoogleContentFilterError(error)).toBe(false);
  });

  it("should return false for other error types", () => {
    const error = {
      name: "GoogleGenerativeAIError",
      error: {
        status: "INVALID_ARGUMENT",
      },
    };

    expect(isGoogleContentFilterError(error)).toBe(false);
  });
});
