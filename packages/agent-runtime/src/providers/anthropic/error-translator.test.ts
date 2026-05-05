import { describe, it, expect } from "vitest";
import {
  translateAnthropicError,
  isAnthropicRateLimitError,
  isAnthropicAuthenticationError,
  isAnthropicContentFilterError,
} from "./error-translator";
import { AgentRuntimeErrorCode } from "../../errors/AgentRuntimeError";

describe("translateAnthropicError", () => {
  const context = {
    providerId: "anthropic",
    tenantId: "test-tenant",
  };

  it("should handle authentication errors", () => {
    const error = {
      name: "APIError",
      message: "Invalid API key",
      status: 401,
      error: {
        type: "authentication_error",
        message: "Invalid API key",
      },
    };

    const translated = translateAnthropicError(error, context);

    expect(translated.code).toBe(AgentRuntimeErrorCode.AUTHENTICATION_FAILED);
    expect(translated.providerId).toBe("anthropic");
    expect(translated.tenantId).toBe("test-tenant");
    expect(translated.statusCode).toBe(401);
    expect(translated.metadata.errorType).toBe("authentication_error");
  });

  it("should handle rate limit errors", () => {
    const error = {
      name: "APIError",
      message: "Rate limit exceeded",
      status: 429,
      error: {
        type: "rate_limit_error",
        message: "Rate limit exceeded",
      },
    };

    const translated = translateAnthropicError(error, context);

    expect(translated.code).toBe(AgentRuntimeErrorCode.RATE_LIMIT_EXCEEDED);
    expect(translated.statusCode).toBe(429);
    expect(translated.metadata.errorType).toBe("rate_limit_error");
  });

  it("should handle overloaded errors as rate limit", () => {
    const error = {
      name: "APIError",
      message: "Overloaded",
      status: 429,
      error: {
        type: "overloaded_error",
        message: "Overloaded",
      },
    };

    const translated = translateAnthropicError(error, context);

    expect(translated.code).toBe(AgentRuntimeErrorCode.RATE_LIMIT_EXCEEDED);
  });

  it("should handle content policy violations", () => {
    const error = {
      name: "APIError",
      message: "Content policy violation",
      status: 400,
      error: {
        type: "content_policy_violation",
        message: "Content policy violation",
      },
    };

    const translated = translateAnthropicError(error, context);

    expect(translated.code).toBe(AgentRuntimeErrorCode.CONTENT_FILTERED);
  });

  it("should handle invalid request errors", () => {
    const error = {
      name: "APIError",
      message: "Invalid request",
      status: 400,
      error: {
        type: "invalid_request_error",
        message: "Invalid request",
      },
    };

    const translated = translateAnthropicError(error, context);

    expect(translated.code).toBe(AgentRuntimeErrorCode.INVALID_REQUEST);
  });

  it("should handle not found errors", () => {
    const error = {
      name: "APIError",
      message: "Model not found",
      status: 404,
      error: {
        type: "not_found_error",
        message: "Model not found",
      },
    };

    const translated = translateAnthropicError(error, context);

    expect(translated.code).toBe(AgentRuntimeErrorCode.MODEL_NOT_FOUND);
  });

  it("should handle internal server errors", () => {
    const error = {
      name: "APIError",
      message: "Internal server error",
      status: 500,
      error: {
        type: "api_error",
        message: "Internal server error",
      },
    };

    const translated = translateAnthropicError(error, context);

    expect(translated.code).toBe(AgentRuntimeErrorCode.INTERNAL_ERROR);
  });

  it("should handle unknown errors", () => {
    const error = {
      name: "APIError",
      message: "Unknown error",
      status: 502,
    };

    const translated = translateAnthropicError(error, context);

    expect(translated.code).toBe(AgentRuntimeErrorCode.INTERNAL_ERROR);
    expect(translated.statusCode).toBe(502);
  });

  it("should handle non-Anthropic errors", () => {
    const error = new Error("Random error");

    const translated = translateAnthropicError(error, context);

    expect(translated.code).toBe(AgentRuntimeErrorCode.INTERNAL_ERROR);
    expect(translated.message).toBe("Random error");
    expect(translated.cause).toBe(error);
  });

  it("should handle errors without status code", () => {
    const error = {
      name: "APIError",
      message: "Error without status",
      error: {
        type: "unknown_error",
      },
    };

    const translated = translateAnthropicError(error, context);

    expect(translated.code).toBe(AgentRuntimeErrorCode.INTERNAL_ERROR);
  });

  it("should include metadata in error", () => {
    const error = {
      name: "APIError",
      message: "Test error",
      status: 400,
      error: {
        type: "invalid_request_error",
      },
    };

    const translated = translateAnthropicError(error, context);

    expect(translated.metadata).toHaveProperty("errorType", "invalid_request_error");
    expect(translated.metadata).toHaveProperty("httpStatus", 400);
  });

  it("should preserve error cause", () => {
    const underlyingError = {
      name: "APIError",
      message: "Underlying error",
      status: 500,
    };

    const translated = translateAnthropicError(underlyingError, context);

    expect(translated.cause).toBe(underlyingError);
  });
});

describe("isAnthropicRateLimitError", () => {
  it("should identify rate limit errors", () => {
    const error = {
      name: "APIError",
      status: 429,
      error: { type: "rate_limit_error" },
    };

    expect(isAnthropicRateLimitError(error)).toBe(true);
  });

  it("should identify overloaded errors", () => {
    const error = {
      name: "APIError",
      status: 429,
      error: { type: "overloaded_error" },
    };

    expect(isAnthropicRateLimitError(error)).toBe(true);
  });

  it("should return false for non-rate-limit errors", () => {
    const error = {
      name: "APIError",
      status: 400,
      error: { type: "invalid_request_error" },
    };

    expect(isAnthropicRateLimitError(error)).toBe(false);
  });

  it("should return false for non-Anthropic errors", () => {
    expect(isAnthropicRateLimitError(new Error("test"))).toBe(false);
    expect(isAnthropicRateLimitError(null)).toBe(false);
    expect(isAnthropicRateLimitError(undefined)).toBe(false);
  });
});

describe("isAnthropicAuthenticationError", () => {
  it("should identify 401 errors", () => {
    const error = {
      name: "APIError",
      status: 401,
      error: { type: "authentication_error" },
    };

    expect(isAnthropicAuthenticationError(error)).toBe(true);
  });

  it("should identify 403 errors", () => {
    const error = {
      name: "APIError",
      status: 403,
    };

    expect(isAnthropicAuthenticationError(error)).toBe(true);
  });

  it("should identify authentication_error type", () => {
    const error = {
      name: "APIError",
      status: 400,
      error: { type: "authentication_error" },
    };

    expect(isAnthropicAuthenticationError(error)).toBe(true);
  });

  it("should return false for non-authentication errors", () => {
    const error = {
      name: "APIError",
      status: 400,
      error: { type: "invalid_request_error" },
    };

    expect(isAnthropicAuthenticationError(error)).toBe(false);
  });

  it("should return false for non-Anthropic errors", () => {
    expect(isAnthropicAuthenticationError(new Error("test"))).toBe(false);
    expect(isAnthropicAuthenticationError(null)).toBe(false);
  });
});

describe("isAnthropicContentFilterError", () => {
  it("should identify content policy violations", () => {
    const error = {
      name: "APIError",
      status: 400,
      error: { type: "content_policy_violation" },
    };

    expect(isAnthropicContentFilterError(error)).toBe(true);
  });

  it("should return false for non-content errors", () => {
    const error = {
      name: "APIError",
      status: 400,
      error: { type: "invalid_request_error" },
    };

    expect(isAnthropicContentFilterError(error)).toBe(false);
  });

  it("should return false for non-Anthropic errors", () => {
    expect(isAnthropicContentFilterError(new Error("test"))).toBe(false);
    expect(isAnthropicContentFilterError(null)).toBe(false);
  });
});
