/**
 * Unit Tests: Error Type Definitions
 *
 * Tests for error type definitions and utility functions.
 *
 * @see T095-T096: Error component unit tests
 */

import { describe, expect, it } from "vitest";
import {
  createAuthError,
  createNetworkError,
  createRateLimitError,
  createServerError,
  getErrorTranslationKey,
  getRedirectPath,
  getRetryDelay,
  isAuthError,
  isNetworkError,
  isRateLimitError,
  isRetryable,
  isServerError,
  requiresRedirect,
  toAppError,
  type AppError,
  type NetworkError,
  type AuthError,
  type ServerError,
  type RateLimitError,
  type NetworkErrorCode,
  type AuthErrorCode,
  type ServerErrorCode,
  type RateLimitErrorCode,
} from "./errors";

describe("Error Type Definitions", () => {
  describe("Type Guards", () => {
    it("should identify network errors", () => {
      const error: NetworkError = {
        type: "network",
        code: "NETWORK_OFFLINE",
        message: "Network offline",
        isOffline: true,
        retryable: true,
        timestamp: "2024-01-01T00:00:00Z",
      };

      expect(isNetworkError(error)).toBe(true);
      expect(isAuthError(error)).toBe(false);
      expect(isServerError(error)).toBe(false);
      expect(isRateLimitError(error)).toBe(false);
    });

    it("should identify auth errors", () => {
      const error: AuthError = {
        type: "auth",
        code: "AUTH_INVALID_CREDENTIALS",
        message: "Invalid credentials",
        shouldRedirect: false,
        timestamp: "2024-01-01T00:00:00Z",
      };

      expect(isAuthError(error)).toBe(true);
      expect(isNetworkError(error)).toBe(false);
      expect(isServerError(error)).toBe(false);
      expect(isRateLimitError(error)).toBe(false);
    });

    it("should identify server errors", () => {
      const error: ServerError = {
        type: "server",
        code: "SERVER_INTERNAL_ERROR",
        statusCode: 500,
        message: "Internal server error",
        contactSupport: true,
        timestamp: "2024-01-01T00:00:00Z",
      };

      expect(isServerError(error)).toBe(true);
      expect(isNetworkError(error)).toBe(false);
      expect(isAuthError(error)).toBe(false);
      expect(isRateLimitError(error)).toBe(false);
    });

    it("should identify rate limit errors", () => {
      const error: RateLimitError = {
        type: "rate_limit",
        code: "RATE_LIMIT_EXCEEDED",
        retryAfter: 60,
        requestCount: 100,
        maxRequests: 100,
        windowSize: 60,
        message: "Rate limit exceeded",
        timestamp: "2024-01-01T00:00:00Z",
      };

      expect(isRateLimitError(error)).toBe(true);
      expect(isNetworkError(error)).toBe(false);
      expect(isAuthError(error)).toBe(false);
      expect(isServerError(error)).toBe(false);
    });
  });

  describe("Error Creators", () => {
    it("should create network error with defaults", () => {
      const error = createNetworkError("NETWORK_OFFLINE");

      expect(error.type).toBe("network");
      expect(error.code).toBe("NETWORK_OFFLINE");
      expect(error.isOffline).toBe(true);
      expect(error.retryable).toBe(true);
      expect(error.timestamp).toBeDefined();
    });

    it("should create network error with custom options", () => {
      const error = createNetworkError("NETWORK_TIMEOUT", {
        isOffline: false,
        retryable: true,
        retryAfter: 5000,
      });

      expect(error.type).toBe("network");
      expect(error.code).toBe("NETWORK_TIMEOUT");
      expect(error.isOffline).toBe(false);
      expect(error.retryable).toBe(true);
      expect(error.retryAfter).toBe(5000);
    });

    it("should create auth error with defaults", () => {
      const error = createAuthError("AUTH_INVALID_CREDENTIALS");

      expect(error.type).toBe("auth");
      expect(error.code).toBe("AUTH_INVALID_CREDENTIALS");
      expect(error.shouldRedirect).toBe(false);
      expect(error.timestamp).toBeDefined();
    });

    it("should create auth error with redirect", () => {
      const error = createAuthError("AUTH_SESSION_EXPIRED", {
        shouldRedirect: true,
        redirectPath: "/auth/login",
        preservePath: true,
      });

      expect(error.type).toBe("auth");
      expect(error.code).toBe("AUTH_SESSION_EXPIRED");
      expect(error.shouldRedirect).toBe(true);
      expect(error.redirectPath).toBe("/auth/login");
      expect(error.preservePath).toBe(true);
    });

    it("should create server error with defaults", () => {
      const error = createServerError("SERVER_INTERNAL_ERROR", 500);

      expect(error.type).toBe("server");
      expect(error.code).toBe("SERVER_INTERNAL_ERROR");
      expect(error.statusCode).toBe(500);
      expect(error.contactSupport).toBe(true);
      expect(error.timestamp).toBeDefined();
    });

    it("should create server error with custom options", () => {
      const error = createServerError("SERVER_SERVICE_UNAVAILABLE", 503, {
        contactSupport: false,
        contactInfo: "support@example.com",
      });

      expect(error.type).toBe("server");
      expect(error.code).toBe("SERVER_SERVICE_UNAVAILABLE");
      expect(error.statusCode).toBe(503);
      expect(error.contactSupport).toBe(false);
      expect(error.contactInfo).toBe("support@example.com");
    });

    it("should create rate limit error with defaults", () => {
      const error = createRateLimitError("RATE_LIMIT_EXCEEDED", 60);

      expect(error.type).toBe("rate_limit");
      expect(error.code).toBe("RATE_LIMIT_EXCEEDED");
      expect(error.retryAfter).toBe(60);
      expect(error.timestamp).toBeDefined();
    });

    it("should create rate limit error with custom options", () => {
      const error = createRateLimitError("RATE_LIMIT_TOO_MANY_REQUESTS", 120, {
        requestCount: 150,
        maxRequests: 100,
        windowSize: 60,
      });

      expect(error.type).toBe("rate_limit");
      expect(error.code).toBe("RATE_LIMIT_TOO_MANY_REQUESTS");
      expect(error.retryAfter).toBe(120);
      expect(error.requestCount).toBe(150);
      expect(error.maxRequests).toBe(100);
      expect(error.windowSize).toBe(60);
    });
  });

  describe("Error Utility Functions", () => {
    it("should get translation key for network error", () => {
      const error: NetworkError = {
        type: "network",
        code: "NETWORK_OFFLINE",
        message: "Network offline",
        isOffline: true,
        retryable: true,
        timestamp: "2024-01-01T00:00:00Z",
      };

      const key = getErrorTranslationKey(error);
      expect(key).toBe("errors.network.offline");
    });

    it("should get translation key for auth error", () => {
      const error: AuthError = {
        type: "auth",
        code: "AUTH_INVALID_CREDENTIALS",
        message: "Invalid credentials",
        shouldRedirect: false,
        timestamp: "2024-01-01T00:00:00Z",
      };

      const key = getErrorTranslationKey(error);
      expect(key).toBe("errors.auth.invalidCredentials");
    });

    it("should get translation key for server error", () => {
      const error: ServerError = {
        type: "server",
        code: "SERVER_INTERNAL_ERROR",
        statusCode: 500,
        message: "Internal server error",
        contactSupport: true,
        timestamp: "2024-01-01T00:00:00Z",
      };

      const key = getErrorTranslationKey(error);
      expect(key).toBe("errors.server.internalError");
    });

    it("should get translation key for rate limit error", () => {
      const error: RateLimitError = {
        type: "rate_limit",
        code: "RATE_LIMIT_EXCEEDED",
        retryAfter: 60,
        requestCount: 100,
        maxRequests: 100,
        windowSize: 60,
        message: "Rate limit exceeded",
        timestamp: "2024-01-01T00:00:00Z",
      };

      const key = getErrorTranslationKey(error);
      expect(key).toBe("errors.rateLimit.exceeded");
    });

    it("should determine if error is retryable", () => {
      const networkError = createNetworkError("NETWORK_OFFLINE");
      expect(isRetryable(networkError)).toBe(true);

      const rateLimitError = createRateLimitError("RATE_LIMIT_EXCEEDED", 60);
      expect(isRetryable(rateLimitError)).toBe(true);

      const serverError5xx = createServerError("SERVER_INTERNAL_ERROR", 500);
      expect(isRetryable(serverError5xx)).toBe(true);

      const authError = createAuthError("AUTH_INVALID_CREDENTIALS");
      expect(isRetryable(authError)).toBe(false);
    });

    it("should get retry delay for retryable errors", () => {
      const networkError = createNetworkError("NETWORK_TIMEOUT", {
        retryAfter: 3000,
      });
      expect(getRetryDelay(networkError)).toBe(3000);

      const rateLimitError = createRateLimitError("RATE_LIMIT_EXCEEDED", 60);
      expect(getRetryDelay(rateLimitError)).toBe(60000); // 60 seconds in ms

      const serverError = createServerError("SERVER_INTERNAL_ERROR", 500);
      expect(getRetryDelay(serverError)).toBe(2000); // Default 2 seconds

      const authError = createAuthError("AUTH_INVALID_CREDENTIALS");
      expect(getRetryDelay(authError)).toBe(0);
    });

    it("should determine if error requires redirect", () => {
      const sessionExpiredError = createAuthError("AUTH_SESSION_EXPIRED", {
        shouldRedirect: true,
        redirectPath: "/auth/login",
      });
      expect(requiresRedirect(sessionExpiredError)).toBe(true);

      const invalidCredentialsError = createAuthError("AUTH_INVALID_CREDENTIALS");
      expect(requiresRedirect(invalidCredentialsError)).toBe(false);
    });

    it("should get redirect path for auth errors", () => {
      const sessionExpiredError = createAuthError("AUTH_SESSION_EXPIRED", {
        shouldRedirect: true,
        redirectPath: "/auth/login",
      });
      expect(getRedirectPath(sessionExpiredError)).toBe("/auth/login");

      const invalidCredentialsError = createAuthError("AUTH_INVALID_CREDENTIALS");
      expect(getRedirectPath(invalidCredentialsError)).toBeUndefined();
    });
  });

  describe("toAppError", () => {
    it("should convert Error instance to AppError", () => {
      const error = new Error("Something went wrong");
      const appError = toAppError(error);

      expect(appError.type).toBe("server");
      expect(appError.code).toBe("SERVER_INTERNAL_ERROR");
      expect(appError.message).toBe("Something went wrong");
    });

    it("should convert string error to AppError", () => {
      const error = "String error message";
      const appError = toAppError(error);

      expect(appError.type).toBe("server");
      expect(appError.code).toBe("SERVER_INTERNAL_ERROR");
      expect(appError.message).toBe("String error message");
    });

    it("should convert unknown object to AppError", () => {
      const error = { custom: "error" };
      const appError = toAppError(error);

      expect(appError.type).toBe("server");
      expect(appError.code).toBe("SERVER_INTERNAL_ERROR");
    });

    it("should return AppError as-is", () => {
      const originalError: AppError = createNetworkError("NETWORK_OFFLINE");
      const appError = toAppError(originalError);

      expect(appError).toBe(originalError);
    });

    it("should handle null and undefined", () => {
      const nullError = toAppError(null);
      expect(nullError.type).toBe("server");
      expect(nullError.code).toBe("SERVER_INTERNAL_ERROR");

      const undefinedError = toAppError(undefined);
      expect(undefinedError.type).toBe("server");
      expect(undefinedError.code).toBe("SERVER_INTERNAL_ERROR");
    });
  });

  describe("Error Type Safety", () => {
    it("should have correct structure for network error", () => {
      const error: NetworkError = {
        type: "network",
        code: "NETWORK_OFFLINE",
        message: "Network offline",
        isOffline: true,
        retryable: true,
        timestamp: "2024-01-01T00:00:00Z",
      };

      // Type assertion checks
      expect(error.type).toBe("network");
      expect(error.isOffline).toBeDefined();
      expect(error.retryable).toBeDefined();
    });

    it("should have correct structure for auth error", () => {
      const error: AuthError = {
        type: "auth",
        code: "AUTH_INVALID_CREDENTIALS",
        message: "Invalid credentials",
        shouldRedirect: false,
        timestamp: "2024-01-01T00:00:00Z",
      };

      // Type assertion checks
      expect(error.type).toBe("auth");
      expect(error.shouldRedirect).toBeDefined();
      expect(error.redirectPath).toBeUndefined();
    });

    it("should have correct structure for server error", () => {
      const error: ServerError = {
        type: "server",
        code: "SERVER_INTERNAL_ERROR",
        statusCode: 500,
        message: "Internal server error",
        contactSupport: true,
        timestamp: "2024-01-01T00:00:00Z",
      };

      // Type assertion checks
      expect(error.type).toBe("server");
      expect(error.statusCode).toBeDefined();
      expect(error.contactSupport).toBeDefined();
    });

    it("should have correct structure for rate limit error", () => {
      const error: RateLimitError = {
        type: "rate_limit",
        code: "RATE_LIMIT_EXCEEDED",
        retryAfter: 60,
        requestCount: 100,
        maxRequests: 100,
        windowSize: 60,
        message: "Rate limit exceeded",
        timestamp: "2024-01-01T00:00:00Z",
      };

      // Type assertion checks
      expect(error.type).toBe("rate_limit");
      expect(error.retryAfter).toBeDefined();
      expect(error.requestCount).toBeDefined();
      expect(error.maxRequests).toBeDefined();
      expect(error.windowSize).toBeDefined();
    });
  });

  describe("Translation Key Mapping", () => {
    it("should map all network error codes", () => {
      const codes: NetworkErrorCode[] = [
        "NETWORK_OFFLINE",
        "NETWORK_TIMEOUT",
        "NETWORK_CONNECTION_FAILED",
        "NETWORK_SERVER_UNREACHABLE",
      ];

      codes.forEach((code) => {
        const error = createNetworkError(code);
        const key = getErrorTranslationKey(error);
        expect(key).toMatch(/^errors\.network\./);
      });
    });

    it("should map all auth error codes", () => {
      const codes: AuthErrorCode[] = [
        "AUTH_INVALID_CREDENTIALS",
        "AUTH_SESSION_EXPIRED",
        "AUTH_TOKEN_INVALID",
        "AUTH_TOKEN_EXPIRED",
        "AUTH_UNAUTHORIZED",
        "AUTH_FORBIDDEN",
        "AUTH_EMAIL_NOT_VERIFIED",
        "AUTH_ACCOUNT_LOCKED",
        "AUTH_TOO_MANY_ATTEMPTS",
      ];

      codes.forEach((code) => {
        const error = createAuthError(code);
        const key = getErrorTranslationKey(error);
        expect(key).toMatch(/^errors\.auth\./);
      });
    });

    it("should map all server error codes", () => {
      const codes: ServerErrorCode[] = [
        "SERVER_INTERNAL_ERROR",
        "SERVER_BAD_GATEWAY",
        "SERVER_SERVICE_UNAVAILABLE",
        "SERVER_GATEWAY_TIMEOUT",
        "SERVER_NOT_IMPLEMENTED",
      ];

      codes.forEach((code) => {
        const error = createServerError(code, 500);
        const key = getErrorTranslationKey(error);
        expect(key).toMatch(/^errors\.server\./);
      });
    });

    it("should map all rate limit error codes", () => {
      const codes: RateLimitErrorCode[] = ["RATE_LIMIT_EXCEEDED", "RATE_LIMIT_TOO_MANY_REQUESTS"];

      codes.forEach((code) => {
        const error = createRateLimitError(code, 60);
        const key = getErrorTranslationKey(error);
        expect(key).toMatch(/^errors\.rateLimit\./);
      });
    });
  });
});
