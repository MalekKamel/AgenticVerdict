import {
  ThrottlingException,
  AccessDeniedException,
  ResourceNotFoundException,
  InternalServerException,
  ModelStreamErrorException,
  ValidationException,
} from "@aws-sdk/client-bedrock-runtime";

import { AgentRuntimeError, AgentRuntimeErrorCode } from "../../errors/AgentRuntimeError";

interface BedrockErrorContext {
  providerId: string;
  modelId?: string;
}

export function translateBedrockError(
  error: unknown,
  context: BedrockErrorContext,
): AgentRuntimeError {
  const errorName =
    typeof error === "object" && error !== null && "name" in error
      ? (error as Record<string, unknown>).name
      : null;

  if (error instanceof AccessDeniedException || errorName === "AccessDeniedException") {
    return new AgentRuntimeError({
      code: AgentRuntimeErrorCode.TENANT_UNAUTHORIZED,
      message: "Access denied to Bedrock model. Verify IAM permissions and credentials.",
      providerId: context.providerId,
      statusCode: 403,
      cause: error,
      metadata: {
        modelId: context.modelId,
        awsErrorCode: errorName,
      },
    });
  }

  if (error instanceof ResourceNotFoundException || errorName === "ResourceNotFoundException") {
    return new AgentRuntimeError({
      code: AgentRuntimeErrorCode.MODEL_NOT_FOUND,
      message: `The requested Bedrock model "${context.modelId}" was not found or is not available in your region.`,
      providerId: context.providerId,
      statusCode: 404,
      cause: error,
      metadata: {
        modelId: context.modelId,
        awsErrorCode: errorName,
      },
    });
  }

  if (error instanceof ThrottlingException || errorName === "ThrottlingException") {
    return new AgentRuntimeError({
      code: AgentRuntimeErrorCode.RATE_LIMIT_EXCEEDED,
      message:
        "Bedrock request throttled due to rate limits. Consider implementing retry with backoff.",
      providerId: context.providerId,
      statusCode: 429,
      cause: error,
      metadata: {
        modelId: context.modelId,
        awsErrorCode: errorName,
      },
    });
  }

  if (error instanceof ValidationException || errorName === "ValidationException") {
    return new AgentRuntimeError({
      code: AgentRuntimeErrorCode.INVALID_REQUEST,
      message: "Invalid request parameters for Bedrock model",
      providerId: context.providerId,
      statusCode: 400,
      cause: error,
      metadata: {
        modelId: context.modelId,
        awsErrorCode: errorName,
      },
    });
  }

  if (
    error instanceof ModelStreamErrorException ||
    error instanceof InternalServerException ||
    errorName === "ModelStreamErrorException" ||
    errorName === "InternalServerException"
  ) {
    return new AgentRuntimeError({
      code: AgentRuntimeErrorCode.INTERNAL_ERROR,
      message: "Bedrock service encountered an internal error",
      providerId: context.providerId,
      statusCode: 500,
      cause: error,
      metadata: {
        modelId: context.modelId,
        awsErrorCode: errorName,
      },
    });
  }

  if (error instanceof AgentRuntimeError) {
    return error;
  }

  return new AgentRuntimeError({
    code: AgentRuntimeErrorCode.INTERNAL_ERROR,
    message: error instanceof Error ? error.message : "Unknown Bedrock error occurred",
    providerId: context.providerId,
    statusCode: 500,
    cause: error,
    metadata: {
      modelId: context.modelId,
    },
  });
}

export function isBedrockThrottlingError(error: unknown): boolean {
  return (
    error instanceof ThrottlingException ||
    (typeof error === "object" &&
      error !== null &&
      "name" in error &&
      error.name === "ThrottlingException")
  );
}

export function isBedrockAccessDeniedError(error: unknown): boolean {
  return (
    error instanceof AccessDeniedException ||
    (typeof error === "object" &&
      error !== null &&
      "name" in error &&
      error.name === "AccessDeniedException")
  );
}

export function isBedrockNotFoundError(error: unknown): boolean {
  return (
    error instanceof ResourceNotFoundException ||
    (typeof error === "object" &&
      error !== null &&
      "name" in error &&
      error.name === "ResourceNotFoundException")
  );
}

export function isBedrockInternalError(error: unknown): boolean {
  return (
    error instanceof InternalServerException ||
    error instanceof ModelStreamErrorException ||
    (typeof error === "object" &&
      error !== null &&
      "name" in error &&
      (error.name === "InternalServerException" || error.name === "ModelStreamErrorException"))
  );
}
