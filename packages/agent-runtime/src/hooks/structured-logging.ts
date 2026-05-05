import type {
  BeforeChatHook,
  OnChatCompleteHook,
  OnChatErrorHook,
  BeforeChatContext,
  OnChatCompleteContext,
  OnChatErrorContext,
} from "../types/hooks";

/**
 * Structured logging configuration.
 */
export interface StructuredLoggingHookConfig {
  /** Logger instance (Pino or compatible) */
  logger: {
    info: (message: string, ...args: unknown[]) => void;
    warn: (message: string, ...args: unknown[]) => void;
    error: (message: string, ...args: unknown[]) => void;
    debug: (message: string, ...args: unknown[]) => void;
  };
  /** Optional tenant ID for multi-tenant logging */
  tenantId: string;
  /** Log level for request lifecycle (default: 'debug') */
  requestLogLevel?: "debug" | "info" | "warn" | "error";
  /** Whether to include token usage in logs (default: true) */
  includeTokenUsage?: boolean;
  /** Whether to include duration in logs (default: true) */
  includeDuration?: boolean;
}

/**
 * Built-in hook for structured logging with tenant context.
 *
 * Features:
 * - Structured JSON logging with tenant metadata
 * - Request lifecycle tracking (start, complete, error)
 * - Token usage logging
 * - Duration tracking
 * - PII-safe logging (no request/response payloads by default)
 *
 * PII Safety:
 * - Only logs metadata (tenantId, providerId, modelId, requestId)
 * - No request/response payloads logged by default
 * - Token usage and duration are safe to log
 */
export class StructuredLoggingHook {
  private readonly config: Required<StructuredLoggingHookConfig>;

  constructor(config: StructuredLoggingHookConfig) {
    this.config = {
      ...config,
      requestLogLevel: config.requestLogLevel ?? "debug",
      includeTokenUsage: config.includeTokenUsage ?? true,
      includeDuration: config.includeDuration ?? true,
    };
  }

  /**
   * Create the beforeChat hook for logging request start.
   */
  createBeforeChatHook(): BeforeChatHook {
    return (context: BeforeChatContext) => {
      const { tenantId, providerId, modelId, requestId } = context;

      this.config.logger[this.config.requestLogLevel](
        `[AI Request] Starting request ${requestId}`,
        {
          event: "ai_request_start",
          tenant_id: tenantId,
          provider_id: providerId,
          model_id: modelId,
          request_id: requestId,
          timestamp: new Date(context.startedAt).toISOString(),
        },
      );
    };
  }

  /**
   * Create the onChatComplete hook for logging successful completion.
   */
  createOnChatCompleteHook(): OnChatCompleteHook {
    return (context: OnChatCompleteContext) => {
      const { tenantId, providerId, modelId, requestId, durationMs, tokenUsage } = context;

      const logData: Record<string, unknown> = {
        event: "ai_request_complete",
        tenant_id: tenantId,
        provider_id: providerId,
        model_id: modelId,
        request_id: requestId,
        status: "success",
      };

      if (this.config.includeDuration) {
        logData.duration_ms = durationMs;
      }

      if (this.config.includeTokenUsage && tokenUsage) {
        logData.token_usage = {
          prompt_tokens: tokenUsage.promptTokens,
          completion_tokens: tokenUsage.completionTokens,
          total_tokens: tokenUsage.totalTokens,
        };
      }

      this.config.logger.info(
        `[AI Request] Completed request ${requestId} in ${durationMs}ms`,
        logData,
      );
    };
  }

  /**
   * Create the onChatError hook for logging errors.
   */
  createOnChatErrorHook(): OnChatErrorHook {
    return (context: OnChatErrorContext) => {
      const { tenantId, providerId, modelId, requestId, error, durationMs } = context;

      const logData: Record<string, unknown> = {
        event: "ai_request_error",
        tenant_id: tenantId,
        provider_id: providerId,
        model_id: modelId,
        request_id: requestId,
        status: "error",
        error_message: error instanceof Error ? error.message : String(error),
      };

      if (this.config.includeDuration) {
        logData.duration_ms = durationMs;
      }

      // Add error stack trace in debug mode
      if (error instanceof Error && error.stack) {
        logData.error_stack = error.stack;
      }

      this.config.logger.error(
        `[AI Request] Failed request ${requestId} after ${durationMs}ms`,
        logData,
      );
    };
  }
}

/**
 * Factory function to create a structured logging hook.
 */
export function createStructuredLoggingHook(
  config: StructuredLoggingHookConfig,
): StructuredLoggingHook {
  return new StructuredLoggingHook(config);
}
