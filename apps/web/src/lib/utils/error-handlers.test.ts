/**
 * Unit Tests: Error Handler Utilities
 *
 * Tests for error handler utilities and hooks.
 *
 * @see T095-T096: Error handler unit tests
 */

import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  createAuthError,
  createNetworkError,
  createRateLimitError,
  createServerError,
  type ContextualError,
} from "../types/errors";
import {
  getAuthErrorMessage,
  getNetworkErrorMessage,
  getRateLimitErrorMessage,
  getServerErrorMessage,
  handleError,
  logError,
  isOffline,
} from "./error-handlers";

vi.mock("@/i18n/react", () => ({
  useTranslations: () => (key: string) => key,
}));

describe("Error Handler Utilities", () => {
  describe("Network Error Detection", () => {
    it("should detect offline status", () => {
      // Mock navigator.onLine
      Object.defineProperty(window.navigator, "onLine", {
        writable: true,
        value: false,
      });

      expect(isOffline()).toBe(true);

      Object.defineProperty(window.navigator, "onLine", {
        writable: true,
        value: true,
      });

      expect(isOffline()).toBe(false);
    });

    it("should return online when navigator is unavailable", () => {
      const originalNavigator = window.navigator;
      Object.defineProperty(window, "navigator", {
        configurable: true,
        enumerable: true,
        value: undefined,
      });

      // When navigator is unavailable, assume online for safety
      expect(isOffline()).toBe(false);

      Object.defineProperty(window, "navigator", {
        configurable: true,
        enumerable: true,
        value: originalNavigator,
      });
    });
  });

  describe("Error Message Generation", () => {
    const t = (key: string) => key;

    it("should generate network error messages", () => {
      const offlineError = createNetworkError("NETWORK_OFFLINE");
      const message = getNetworkErrorMessage(offlineError, t);
      expect(message).toBe("errors.network.offline");

      const timeoutError = createNetworkError("NETWORK_TIMEOUT");
      const timeoutMessage = getNetworkErrorMessage(timeoutError, t);
      expect(timeoutMessage).toBe("errors.network.timeout");
    });

    it("should generate server error messages", () => {
      const internalError = createServerError("SERVER_INTERNAL_ERROR", 500);
      const message = getServerErrorMessage(internalError, t);
      expect(message).toContain("errors.server.internalError");
      expect(message).toContain("errors.common.contactSupport");

      const badGatewayError = createServerError("SERVER_BAD_GATEWAY", 502, {
        contactSupport: true,
      });
      const badGatewayMessage = getServerErrorMessage(badGatewayError, t);
      expect(badGatewayMessage).toContain("errors.server.badGateway");
      expect(badGatewayMessage).toContain("errors.common.contactSupport");
    });

    it("should generate auth error messages", () => {
      const invalidCredentialsError = createAuthError("AUTH_INVALID_CREDENTIALS");
      const message = getAuthErrorMessage(invalidCredentialsError, t);
      expect(message).toBe("auth.login.errors.invalidCredentials");

      const sessionExpiredError = createAuthError("AUTH_SESSION_EXPIRED");
      const sessionMessage = getAuthErrorMessage(sessionExpiredError, t);
      expect(sessionMessage).toBe("errors.auth.sessionExpired");
    });

    it("should generate rate limit error messages", () => {
      const rateLimitError = createRateLimitError("RATE_LIMIT_EXCEEDED", 60);
      const message = getRateLimitErrorMessage(rateLimitError, t);
      expect(message).toBe("errors.rateLimit.exceeded");
    });
  });

  describe("Handle Error", () => {
    const t = (key: string) => key;

    it("should handle network errors", () => {
      const error = createNetworkError("NETWORK_OFFLINE");
      const result = handleError(error, t);

      expect(result.message).toBe("errors.network.offline");
      expect(result.retryable).toBe(true);
      expect(result.shouldRedirect).toBe(false);
      expect(result.contactSupport).toBe(false);
      expect(result.severity).toBe("medium");
    });

    it("should handle server errors", () => {
      const error = createServerError("SERVER_INTERNAL_ERROR", 500);
      const result = handleError(error, t);

      expect(result.message).toContain("errors.server.internalError");
      expect(result.retryable).toBe(true);
      expect(result.shouldRedirect).toBe(false);
      expect(result.contactSupport).toBe(true);
      expect(result.severity).toBe("high");
    });

    it("should handle auth errors", () => {
      const error = createAuthError("AUTH_INVALID_CREDENTIALS");
      const result = handleError(error, t);

      expect(result.message).toBe("auth.login.errors.invalidCredentials");
      expect(result.retryable).toBe(false);
      expect(result.shouldRedirect).toBe(false);
      expect(result.contactSupport).toBe(false);
      expect(result.severity).toBe("medium");
    });

    it("should handle auth errors with redirect", () => {
      const error = createAuthError("AUTH_SESSION_EXPIRED", {
        shouldRedirect: true,
        redirectPath: "/auth/login",
      });
      const result = handleError(error, t);

      expect(result.message).toBe("errors.auth.sessionExpired");
      expect(result.retryable).toBe(true);
      expect(result.shouldRedirect).toBe(true);
      expect(result.redirectPath).toBe("/auth/login");
      expect(result.contactSupport).toBe(false);
      expect(result.severity).toBe("medium");
    });

    it("should handle rate limit errors", () => {
      const error = createRateLimitError("RATE_LIMIT_EXCEEDED", 60);
      const result = handleError(error, t);

      expect(result.message).toBe("errors.rateLimit.exceeded");
      expect(result.retryable).toBe(true);
      expect(result.retryDelay).toBe(60000); // 60 seconds in ms
      expect(result.shouldRedirect).toBe(false);
      expect(result.contactSupport).toBe(false);
      expect(result.severity).toBe("low");
    });

    it("should handle generic Error instances", () => {
      const error = new Error("Something went wrong");
      const result = handleError(error, t);

      expect(result.message).toBe("Something went wrong");
      expect(result.retryable).toBe(false);
      expect(result.shouldRedirect).toBe(false);
      expect(result.contactSupport).toBe(true);
      expect(result.severity).toBe("medium");
    });

    it("should handle string errors", () => {
      const error = "String error message";
      const result = handleError(error, t);

      expect(result.message).toBe("String error message");
      expect(result.retryable).toBe(false);
      expect(result.shouldRedirect).toBe(false);
      expect(result.contactSupport).toBe(true);
      expect(result.severity).toBe("medium");
    });

    it("should handle unknown errors", () => {
      const error = { custom: "error" };
      const result = handleError(error, t);

      // Unknown objects are treated as server errors
      expect(result.message).toContain("errors.server.internalError");
      expect(result.retryable).toBe(true); // Server errors are retryable
      expect(result.shouldRedirect).toBe(false);
      expect(result.contactSupport).toBe(true);
      expect(result.severity).toBe("high"); // Server errors are high severity
    });
  });

  describe("Error Logging", () => {
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
    let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
    let consoleLogSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
      consoleWarnSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });

    it("should log critical errors with console.error", () => {
      const error = createServerError("SERVER_INTERNAL_ERROR", 500);
      const context: ContextualError = {
        error,
        context: {
          severity: "critical",
          component: "LoginForm",
          action: "login",
        },
      };

      logError(context);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[Error]",
        expect.objectContaining({
          code: "SERVER_INTERNAL_ERROR",
          context: expect.objectContaining({
            severity: "critical",
            component: "LoginForm",
            action: "login",
          }),
        }),
      );
    });

    it("should log high severity errors with console.error", () => {
      const error = createAuthError("AUTH_ACCOUNT_LOCKED");
      const context: ContextualError = {
        error,
        context: {
          severity: "high",
          component: "LoginForm",
          action: "login",
        },
      };

      logError(context);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[Error]",
        expect.objectContaining({
          code: "AUTH_ACCOUNT_LOCKED",
          context: expect.objectContaining({
            severity: "high",
          }),
        }),
      );
    });

    it("should log medium severity errors with console.warn", () => {
      const error = createAuthError("AUTH_INVALID_CREDENTIALS");
      const context: ContextualError = {
        error,
        context: {
          severity: "medium",
          component: "LoginForm",
          action: "login",
        },
      };

      logError(context);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "[Warning]",
        expect.objectContaining({
          code: "AUTH_INVALID_CREDENTIALS",
          context: expect.objectContaining({
            severity: "medium",
          }),
        }),
      );
    });

    it("should log low severity errors with console.log", () => {
      const error = createRateLimitError("RATE_LIMIT_EXCEEDED", 60);
      const context: ContextualError = {
        error,
        context: {
          severity: "low",
          component: "LoginForm",
          action: "login",
        },
      };

      logError(context);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        "[Info]",
        expect.objectContaining({
          code: "RATE_LIMIT_EXCEEDED",
          context: expect.objectContaining({
            severity: "low",
          }),
        }),
      );
    });

    it("should include user and tenant context in logs", () => {
      const error = createAuthError("AUTH_INVALID_CREDENTIALS");
      const context: ContextualError = {
        error,
        context: {
          severity: "medium",
          userId: "user-123",
          tenantId: "tenant-456",
          requestId: "request-789",
          component: "LoginForm",
          action: "login",
        },
      };

      logError(context);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "[Warning]",
        expect.objectContaining({
          context: expect.objectContaining({
            userId: "user-123",
            tenantId: "tenant-456",
            requestId: "request-789",
          }),
        }),
      );
    });

    it("should include error details in logs", () => {
      const error = createServerError("SERVER_INTERNAL_ERROR", 500, {
        details: { stackTrace: "Error: Stack trace" },
      });
      const context: ContextualError = {
        error,
        context: {
          severity: "high",
          component: "LoginForm",
        },
      };

      logError(context);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[Error]",
        expect.objectContaining({
          details: { stackTrace: "Error: Stack trace" },
        }),
      );
    });
  });

  describe("Error Handler Hook", () => {
    it("should provide handleError function", () => {
      const { result } = renderHook(() => {
        // This would use useErrorHandler in a real test
        // but for now we're testing the underlying logic
        return {
          handleError: (error: unknown, t: (key: string) => string) => handleError(error, t),
        };
      });

      const t = (key: string) => key;
      const error = createNetworkError("NETWORK_OFFLINE");
      const result_error = result.current.handleError(error, t);

      expect(result_error.message).toBe("errors.network.offline");
      expect(result_error.retryable).toBe(true);
    });
  });
});

describe("Error Handler Integration", () => {
  const t = (key: string) => key;

  it("should handle complete error flow with context", () => {
    const error = createAuthError("AUTH_INVALID_CREDENTIALS");
    const context = {
      severity: "medium" as const,
      component: "LoginForm",
      action: "login",
      userId: "user-123",
    };

    const result = handleError(error, t);

    expect(result).toMatchObject({
      message: "auth.login.errors.invalidCredentials",
      retryable: false,
      shouldRedirect: false,
      contactSupport: false,
      severity: context.severity,
    });
  });

  it("should handle error with redirect flow", () => {
    const error = createAuthError("AUTH_SESSION_EXPIRED", {
      shouldRedirect: true,
      redirectPath: "/auth/login",
      preservePath: true,
    });

    const result = handleError(error, t);

    expect(result.shouldRedirect).toBe(true);
    expect(result.redirectPath).toBe("/auth/login");
    expect(result.retryable).toBe(true);
  });

  it("should handle retryable error flow", () => {
    const error = createRateLimitError("RATE_LIMIT_EXCEEDED", 120, {
      requestCount: 150,
      maxRequests: 100,
      windowSize: 60,
    });

    const result = handleError(error, t);

    expect(result.retryable).toBe(true);
    expect(result.retryDelay).toBe(120000); // 120 seconds in ms
    expect(result.severity).toBe("low");
  });
});
