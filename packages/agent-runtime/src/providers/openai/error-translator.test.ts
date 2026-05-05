import { describe, it, expect } from "vitest";
import {
  translateOpenAIError,
  isOpenAIRateLimitError,
  isOpenAIAuthenticationError,
  isOpenAIContentFilterError,
} from "./error-translator";
import { AgentRuntimeErrorCode } from "../../errors/AgentRuntimeError";

const createContext = (overrides?: Partial<{ providerId: string; tenantId: string }>) => ({
  providerId: "openai",
  tenantId: "tenant-123",
  ...overrides,
});

function createOpenAIError(overrides: {
  status?: number;
  code?: string;
  type?: string;
  message?: string;
  param?: string | null;
}): Error & { status?: number; error?: Record<string, unknown> } {
  const error = new Error(overrides.message ?? "OpenAI API Error") as Error & {
    status?: number;
    error?: Record<string, unknown>;
  };
  error.name = "APIError";
  error.status = overrides.status;
  error.error = {
    code: overrides.code ?? null,
    type: overrides.type ?? null,
    param: overrides.param ?? null,
    message: overrides.message ?? "OpenAI API Error",
  };
  return error;
}

describe("translateOpenAIError", () => {
  describe("authentication errors", () => {
    it("should translate 401 status to AUTHENTICATION_FAILED", () => {
      const error = createOpenAIError({
        status: 401,
        message: "Invalid API key",
      });

      const translated = translateOpenAIError(error, createContext());

      expect(translated.code).toBe(AgentRuntimeErrorCode.AUTHENTICATION_FAILED);
      expect(translated.statusCode).toBe(401);
      expect(translated.providerId).toBe("openai");
      expect(translated.tenantId).toBe("tenant-123");
    });

    it("should translate invalid_api_key code to AUTHENTICATION_FAILED", () => {
      const error = createOpenAIError({
        status: 401,
        code: "invalid_api_key",
        message: "Your API key is invalid",
      });

      const translated = translateOpenAIError(error, createContext());

      expect(translated.code).toBe(AgentRuntimeErrorCode.AUTHENTICATION_FAILED);
      expect(translated.message).toBe("Your API key is invalid");
    });

    it("should translate incorrect_api_key code to AUTHENTICATION_FAILED", () => {
      const error = createOpenAIError({
        status: 401,
        code: "incorrect_api_key",
      });

      const translated = translateOpenAIError(error, createContext());

      expect(translated.code).toBe(AgentRuntimeErrorCode.AUTHENTICATION_FAILED);
    });

    it("should translate api_key_expired code to AUTHENTICATION_FAILED", () => {
      const error = createOpenAIError({
        status: 401,
        code: "api_key_expired",
      });

      const translated = translateOpenAIError(error, createContext());

      expect(translated.code).toBe(AgentRuntimeErrorCode.AUTHENTICATION_FAILED);
    });

    it("should translate 403 status to AUTHENTICATION_FAILED", () => {
      const error = createOpenAIError({
        status: 403,
        message: "Forbidden",
      });

      const translated = translateOpenAIError(error, createContext());

      expect(translated.code).toBe(AgentRuntimeErrorCode.AUTHENTICATION_FAILED);
      expect(translated.statusCode).toBe(403);
    });
  });

  describe("rate limit errors", () => {
    it("should translate 429 status to RATE_LIMIT_EXCEEDED", () => {
      const error = createOpenAIError({
        status: 429,
        message: "Rate limit exceeded",
      });

      const translated = translateOpenAIError(error, createContext());

      expect(translated.code).toBe(AgentRuntimeErrorCode.RATE_LIMIT_EXCEEDED);
      expect(translated.statusCode).toBe(429);
    });

    it("should translate rate_limit_exceeded code to RATE_LIMIT_EXCEEDED", () => {
      const error = createOpenAIError({
        status: 429,
        code: "rate_limit_exceeded",
      });

      const translated = translateOpenAIError(error, createContext());

      expect(translated.code).toBe(AgentRuntimeErrorCode.RATE_LIMIT_EXCEEDED);
    });
  });

  describe("not found errors", () => {
    it("should translate 404 status to MODEL_NOT_FOUND", () => {
      const error = createOpenAIError({
        status: 404,
        message: "Model not found",
      });

      const translated = translateOpenAIError(error, createContext());

      expect(translated.code).toBe(AgentRuntimeErrorCode.MODEL_NOT_FOUND);
      expect(translated.statusCode).toBe(404);
    });

    it("should translate model_not_found code to MODEL_NOT_FOUND", () => {
      const error = createOpenAIError({
        status: 404,
        code: "model_not_found",
      });

      const translated = translateOpenAIError(error, createContext());

      expect(translated.code).toBe(AgentRuntimeErrorCode.MODEL_NOT_FOUND);
    });
  });

  describe("invalid request errors", () => {
    it("should translate 400 status to INVALID_REQUEST", () => {
      const error = createOpenAIError({
        status: 400,
        message: "Bad request",
      });

      const translated = translateOpenAIError(error, createContext());

      expect(translated.code).toBe(AgentRuntimeErrorCode.INVALID_REQUEST);
      expect(translated.statusCode).toBe(400);
    });

    it("should translate invalid_request_error code to INVALID_REQUEST", () => {
      const error = createOpenAIError({
        status: 400,
        code: "invalid_request_error",
      });

      const translated = translateOpenAIError(error, createContext());

      expect(translated.code).toBe(AgentRuntimeErrorCode.INVALID_REQUEST);
    });

    it("should translate context_length_exceeded to INVALID_REQUEST", () => {
      const error = createOpenAIError({
        status: 400,
        code: "context_length_exceeded",
        message: "Context length exceeded",
      });

      const translated = translateOpenAIError(error, createContext());

      expect(translated.code).toBe(AgentRuntimeErrorCode.INVALID_REQUEST);
      expect(translated.message).toBe("Context length exceeded");
    });
  });

  describe("content filter errors", () => {
    it("should translate content_policy_violation to CONTENT_FILTERED", () => {
      const error = createOpenAIError({
        status: 400,
        code: "content_policy_violation",
        message: "Content violates policy",
      });

      const translated = translateOpenAIError(error, createContext());

      expect(translated.code).toBe(AgentRuntimeErrorCode.CONTENT_FILTERED);
      expect(translated.message).toBe("Content violates policy");
    });
  });

  describe("credit/quota errors", () => {
    it("should translate insufficient_quota to INSUFFICIENT_CREDITS", () => {
      const error = createOpenAIError({
        status: 403,
        code: "insufficient_quota",
        message: "Insufficient quota",
      });

      const translated = translateOpenAIError(error, createContext());

      expect(translated.code).toBe(AgentRuntimeErrorCode.INSUFFICIENT_CREDITS);
    });
  });

  describe("timeout errors", () => {
    it("should translate 504 status to REQUEST_TIMEOUT", () => {
      const error = createOpenAIError({
        status: 504,
        message: "Gateway timeout",
      });

      const translated = translateOpenAIError(error, createContext());

      expect(translated.code).toBe(AgentRuntimeErrorCode.REQUEST_TIMEOUT);
      expect(translated.statusCode).toBe(504);
    });

    it("should translate timeout code to REQUEST_TIMEOUT", () => {
      const error = createOpenAIError({
        status: 504,
        code: "timeout",
      });

      const translated = translateOpenAIError(error, createContext());

      expect(translated.code).toBe(AgentRuntimeErrorCode.REQUEST_TIMEOUT);
    });
  });

  describe("internal server errors", () => {
    it("should translate 500 status to INTERNAL_ERROR", () => {
      const error = createOpenAIError({
        status: 500,
        message: "Internal server error",
      });

      const translated = translateOpenAIError(error, createContext());

      expect(translated.code).toBe(AgentRuntimeErrorCode.INTERNAL_ERROR);
      expect(translated.statusCode).toBe(500);
    });

    it("should translate 502 status to INTERNAL_ERROR", () => {
      const error = createOpenAIError({
        status: 502,
        message: "Bad gateway",
      });

      const translated = translateOpenAIError(error, createContext());

      expect(translated.code).toBe(AgentRuntimeErrorCode.INTERNAL_ERROR);
    });

    it("should translate 503 status to INTERNAL_ERROR", () => {
      const error = createOpenAIError({
        status: 503,
        message: "Service unavailable",
      });

      const translated = translateOpenAIError(error, createContext());

      expect(translated.code).toBe(AgentRuntimeErrorCode.INTERNAL_ERROR);
    });

    it("should translate server_error code to INTERNAL_ERROR", () => {
      const error = createOpenAIError({
        status: 500,
        code: "server_error",
      });

      const translated = translateOpenAIError(error, createContext());

      expect(translated.code).toBe(AgentRuntimeErrorCode.INTERNAL_ERROR);
    });
  });

  describe("unknown errors", () => {
    it("should default to INTERNAL_ERROR for unknown status codes", () => {
      const error = createOpenAIError({
        status: 418,
        message: "I'm a teapot",
      });

      const translated = translateOpenAIError(error, createContext());

      expect(translated.code).toBe(AgentRuntimeErrorCode.INTERNAL_ERROR);
      expect(translated.statusCode).toBe(418);
    });

    it("should default to INTERNAL_ERROR for non-OpenAI errors", () => {
      const error = new Error("Random error");

      const translated = translateOpenAIError(error, createContext());

      expect(translated.code).toBe(AgentRuntimeErrorCode.INTERNAL_ERROR);
      expect(translated.message).toBe("Random error");
      expect(translated.cause).toBe(error);
    });

    it("should handle non-Error objects", () => {
      const error = { message: "Plain object error" };

      const translated = translateOpenAIError(error, createContext());

      expect(translated.code).toBe(AgentRuntimeErrorCode.INTERNAL_ERROR);
      expect(translated.message).toBe("Unknown error occurred");
    });

    it("should handle null/undefined gracefully", () => {
      const translatedNull = translateOpenAIError(null, createContext());
      expect(translatedNull.code).toBe(AgentRuntimeErrorCode.INTERNAL_ERROR);

      const translatedUndefined = translateOpenAIError(undefined, createContext());
      expect(translatedUndefined.code).toBe(AgentRuntimeErrorCode.INTERNAL_ERROR);
    });
  });

  describe("metadata preservation", () => {
    it("should include error type in metadata", () => {
      const error = createOpenAIError({
        status: 400,
        type: "invalid_request_error",
      });

      const translated = translateOpenAIError(error, createContext());

      expect(translated.metadata.errorType).toBe("invalid_request_error");
    });

    it("should include param in metadata", () => {
      const error = createOpenAIError({
        status: 400,
        param: "messages",
      });

      const translated = translateOpenAIError(error, createContext());

      expect(translated.metadata.param).toBe("messages");
    });

    it("should include httpStatus in metadata", () => {
      const error = createOpenAIError({
        status: 429,
      });

      const translated = translateOpenAIError(error, createContext());

      expect(translated.metadata.httpStatus).toBe(429);
    });
  });

  describe("tenant and provider context", () => {
    it("should preserve providerId in translated error", () => {
      const error = createOpenAIError({ status: 500 });

      const translated = translateOpenAIError(error, createContext({ providerId: "openai" }));

      expect(translated.providerId).toBe("openai");
    });

    it("should preserve tenantId in translated error", () => {
      const error = createOpenAIError({ status: 500 });
      const tenantId = "test-tenant-456";

      const translated = translateOpenAIError(error, createContext({ tenantId }));

      expect(translated.tenantId).toBe(tenantId);
    });

    it("should work with custom providerId", () => {
      const error = createOpenAIError({ status: 500 });

      const translated = translateOpenAIError(
        error,
        createContext({ providerId: "openai-custom" }),
      );

      expect(translated.providerId).toBe("openai-custom");
    });
  });

  describe("error serialization", () => {
    it("should serialize to JSON with all metadata", () => {
      const error = createOpenAIError({
        status: 429,
        code: "rate_limit_exceeded",
        type: "rate_limit_error",
        message: "Rate limit exceeded",
      });

      const translated = translateOpenAIError(error, createContext());
      const json = translated.toJSON();

      expect(json.code).toBe(AgentRuntimeErrorCode.RATE_LIMIT_EXCEEDED);
      expect(json.providerId).toBe("openai");
      expect(json.tenantId).toBe("tenant-123");
      expect(json.statusCode).toBe(429);
      expect(json.metadata.errorType).toBe("rate_limit_error");
      expect(json.timestamp).toBeDefined();
    });
  });
});

describe("isOpenAIRateLimitError", () => {
  it("should return true for 429 status", () => {
    const error = createOpenAIError({ status: 429 });
    expect(isOpenAIRateLimitError(error)).toBe(true);
  });

  it("should return true for rate_limit_exceeded code", () => {
    const error = createOpenAIError({ code: "rate_limit_exceeded" });
    expect(isOpenAIRateLimitError(error)).toBe(true);
  });

  it("should return true for rate_limit_error type", () => {
    const error = createOpenAIError({ type: "rate_limit_error" });
    expect(isOpenAIRateLimitError(error)).toBe(true);
  });

  it("should return false for non-rate-limit errors", () => {
    const error = createOpenAIError({ status: 500 });
    expect(isOpenAIRateLimitError(error)).toBe(false);
  });

  it("should return false for non-OpenAI errors", () => {
    const error = new Error("Regular error");
    expect(isOpenAIRateLimitError(error)).toBe(false);
  });

  it("should return false for null/undefined", () => {
    expect(isOpenAIRateLimitError(null)).toBe(false);
    expect(isOpenAIRateLimitError(undefined)).toBe(false);
  });
});

describe("isOpenAIAuthenticationError", () => {
  it("should return true for 401 status", () => {
    const error = createOpenAIError({ status: 401 });
    expect(isOpenAIAuthenticationError(error)).toBe(true);
  });

  it("should return true for 403 status", () => {
    const error = createOpenAIError({ status: 403 });
    expect(isOpenAIAuthenticationError(error)).toBe(true);
  });

  it("should return true for invalid_api_key code", () => {
    const error = createOpenAIError({ code: "invalid_api_key" });
    expect(isOpenAIAuthenticationError(error)).toBe(true);
  });

  it("should return true for incorrect_api_key code", () => {
    const error = createOpenAIError({ code: "incorrect_api_key" });
    expect(isOpenAIAuthenticationError(error)).toBe(true);
  });

  it("should return true for api_key_expired code", () => {
    const error = createOpenAIError({ code: "api_key_expired" });
    expect(isOpenAIAuthenticationError(error)).toBe(true);
  });

  it("should return false for non-authentication errors", () => {
    const error = createOpenAIError({ status: 500 });
    expect(isOpenAIAuthenticationError(error)).toBe(false);
  });

  it("should return false for non-OpenAI errors", () => {
    const error = new Error("Regular error");
    expect(isOpenAIAuthenticationError(error)).toBe(false);
  });
});

describe("isOpenAIContentFilterError", () => {
  it("should return true for content_policy_violation code", () => {
    const error = createOpenAIError({ code: "content_policy_violation" });
    expect(isOpenAIContentFilterError(error)).toBe(true);
  });

  it("should return false for other error codes", () => {
    const error = createOpenAIError({ code: "invalid_request_error" });
    expect(isOpenAIContentFilterError(error)).toBe(false);
  });

  it("should return false for non-OpenAI errors", () => {
    const error = new Error("Regular error");
    expect(isOpenAIContentFilterError(error)).toBe(false);
  });
});
