import { describe, it, expect } from "vitest";

import { AgentRuntimeError, AgentRuntimeErrorCode } from "../../errors/AgentRuntimeError";
import {
  translateBedrockError,
  isBedrockThrottlingError,
  isBedrockAccessDeniedError,
  isBedrockNotFoundError,
  isBedrockInternalError,
} from "./error-translator";

describe("Bedrock Error Translator", () => {
  const context = {
    providerId: "bedrock",
    modelId: "anthropic.claude-3-sonnet-20240229-v1:0",
  };

  describe("translateBedrockError", () => {
    it("should translate AccessDeniedException to TENANT_UNAUTHORIZED", () => {
      const mockError = {
        name: "AccessDeniedException",
        message: "User is not authorized to perform bedrock:InvokeModel",
        $fault: "client",
      };

      const translated = translateBedrockError(mockError, context);

      expect(translated.code).toBe(AgentRuntimeErrorCode.TENANT_UNAUTHORIZED);
      expect(translated.providerId).toBe("bedrock");
      expect(translated.statusCode).toBe(403);
      expect(translated.message).toContain("Access denied");
    });

    it("should translate ResourceNotFoundException to MODEL_NOT_FOUND", () => {
      const mockError = {
        name: "ResourceNotFoundException",
        message: "Model not found",
        $fault: "client",
      };

      const translated = translateBedrockError(mockError, context);

      expect(translated.code).toBe(AgentRuntimeErrorCode.MODEL_NOT_FOUND);
      expect(translated.providerId).toBe("bedrock");
      expect(translated.statusCode).toBe(404);
      expect(translated.message).toContain("not found");
    });

    it("should translate ThrottlingException to RATE_LIMIT_EXCEEDED", () => {
      const mockError = {
        name: "ThrottlingException",
        message: "Rate exceeded",
        $fault: "client",
      };

      const translated = translateBedrockError(mockError, context);

      expect(translated.code).toBe(AgentRuntimeErrorCode.RATE_LIMIT_EXCEEDED);
      expect(translated.providerId).toBe("bedrock");
      expect(translated.statusCode).toBe(429);
      expect(translated.message).toContain("throttled");
    });

    it("should translate ValidationException to INVALID_REQUEST", () => {
      const mockError = {
        name: "ValidationException",
        message: "Invalid request body",
        $fault: "client",
      };

      const translated = translateBedrockError(mockError, context);

      expect(translated.code).toBe(AgentRuntimeErrorCode.INVALID_REQUEST);
      expect(translated.providerId).toBe("bedrock");
      expect(translated.statusCode).toBe(400);
    });

    it("should translate InternalServerException to INTERNAL_ERROR", () => {
      const mockError = {
        name: "InternalServerException",
        message: "Internal server error",
        $fault: "server",
      };

      const translated = translateBedrockError(mockError, context);

      expect(translated.code).toBe(AgentRuntimeErrorCode.INTERNAL_ERROR);
      expect(translated.providerId).toBe("bedrock");
      expect(translated.statusCode).toBe(500);
    });

    it("should translate ModelStreamErrorException to INTERNAL_ERROR", () => {
      const mockError = {
        name: "ModelStreamErrorException",
        message: "Model stream error",
        $fault: "server",
      };

      const translated = translateBedrockError(mockError, context);

      expect(translated.code).toBe(AgentRuntimeErrorCode.INTERNAL_ERROR);
      expect(translated.providerId).toBe("bedrock");
      expect(translated.statusCode).toBe(500);
    });

    it("should pass through AgentRuntimeError unchanged", () => {
      const originalError = new AgentRuntimeError({
        code: AgentRuntimeErrorCode.AUTHENTICATION_FAILED,
        message: "Auth failed",
        providerId: "bedrock",
      });

      const translated = translateBedrockError(originalError, context);

      expect(translated).toBe(originalError);
      expect(translated.code).toBe(AgentRuntimeErrorCode.AUTHENTICATION_FAILED);
    });

    it("should handle unknown errors", () => {
      const mockError = new Error("Unknown error");

      const translated = translateBedrockError(mockError, context);

      expect(translated.code).toBe(AgentRuntimeErrorCode.INTERNAL_ERROR);
      expect(translated.providerId).toBe("bedrock");
      expect(translated.message).toBe("Unknown error");
    });

    it("should include modelId in metadata", () => {
      const mockError = {
        name: "ThrottlingException",
        message: "Rate exceeded",
      };

      const translated = translateBedrockError(mockError, context);

      expect(translated.metadata).toHaveProperty("modelId", context.modelId);
    });
  });

  describe("type guard functions", () => {
    it("should identify throttling errors", () => {
      const mockError = {
        name: "ThrottlingException",
        message: "Rate exceeded",
      };

      expect(isBedrockThrottlingError(mockError)).toBe(true);
    });

    it("should identify access denied errors", () => {
      const mockError = {
        name: "AccessDeniedException",
        message: "Access denied",
      };

      expect(isBedrockAccessDeniedError(mockError)).toBe(true);
    });

    it("should identify not found errors", () => {
      const mockError = {
        name: "ResourceNotFoundException",
        message: "Not found",
      };

      expect(isBedrockNotFoundError(mockError)).toBe(true);
    });

    it("should identify internal errors", () => {
      const mockError1 = {
        name: "InternalServerException",
        message: "Server error",
      };

      const mockError2 = {
        name: "ModelStreamErrorException",
        message: "Stream error",
      };

      expect(isBedrockInternalError(mockError1)).toBe(true);
      expect(isBedrockInternalError(mockError2)).toBe(true);
    });
  });
});
