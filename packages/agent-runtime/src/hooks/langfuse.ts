import { Langfuse } from "langfuse";
import type {
  BeforeChatHook,
  OnChatCompleteHook,
  OnChatErrorHook,
  BeforeChatContext,
  OnChatCompleteContext,
  OnChatErrorContext,
} from "../types/hooks";
import { AgentRuntimeError } from "../errors";

/**
 * Langfuse tracing configuration.
 */
export interface LangfuseHookConfig {
  /** Langfuse public key */
  publicKey: string;
  /** Langfuse secret key */
  secretKey: string;
  /** Langfuse base URL (defaults to cloud) */
  baseUrl?: string;
  /** Optional tenant ID for multi-tenant tracing */
  tenantId: string;
  /** Optional logger */
  logger?: {
    warn: (message: string, ...args: unknown[]) => void;
    error: (message: string, ...args: unknown[]) => void;
    info: (message: string, ...args: unknown[]) => void;
    debug: (message: string, ...args: unknown[]) => void;
  };
  /** Whether to include request/response payloads in traces (default: false for PII safety) */
  includePayloads?: boolean;
  /** Optional release/tracing version */
  release?: string;
  /** Optional environment name */
  environment?: string;
}

/**
 * Context for tracking a Langfuse trace.
 */
interface TraceContext {
  /** Langfuse trace ID */
  traceId: string;
  /** Langfuse span ID */
  spanId: string;
  /** Start time in milliseconds */
  startTime: number;
}

/**
 * Built-in hook for Langfuse tracing.
 *
 * Features:
 * - Automatic trace span creation for each request
 * - Token usage recording
 * - Error tracking in traces
 * - Tenant-scoped metadata (PII-safe)
 * - Optional payload inclusion (disabled by default for security)
 * - Support for traces, spans, generations, and events
 *
 * PII Safety:
 * - Tenant IDs are included as metadata (required for multi-tenant tracing)
 * - Request/response payloads excluded by default
 * - Can be enabled via config for debugging (not recommended for production)
 */
export class LangfuseTracingHook {
  private readonly client: Langfuse;
  private readonly config: LangfuseHookConfig;
  private readonly traceMap = new Map<string, TraceContext>();
  private readonly includePayloads: boolean;

  constructor(config: LangfuseHookConfig) {
    this.config = config;
    this.includePayloads = config.includePayloads ?? false;

    this.client = new Langfuse({
      publicKey: config.publicKey,
      secretKey: config.secretKey,
      baseUrl: config.baseUrl,
      release: config.release,
      environment: config.environment,
    });

    this.config.logger?.info(`[LangfuseTracing] Initialized for tenant: ${config.tenantId}`);
  }

  /**
   * Flush all pending traces to Langfuse.
   * Should be called before process exit.
   */
  async shutdown(): Promise<void> {
    await this.client.shutdownAsync();
    this.config.logger?.info("[LangfuseTracing] Shutdown complete");
  }

  /**
   * Create the beforeChat hook for starting a trace.
   */
  createBeforeChatHook(): BeforeChatHook {
    return async (context: BeforeChatContext) => {
      const { tenantId, providerId, modelId, requestId, payload } = context;

      try {
        const startTime = Date.now();

        // Create a new Langfuse trace
        const trace = this.client.trace({
          id: requestId,
          name: `chat.${providerId}.${modelId}`,
          userId: tenantId,
          metadata: {
            tenantId,
            providerId,
            modelId,
            requestId,
          },
          tags: [`provider:${providerId}`, `model:${modelId}`, `tenant:${tenantId}`],
          input: (this.includePayloads ? payload : { requestId }) as Record<string, unknown>,
        });

        // Create a span for the LLM generation
        const span = trace.span({
          name: `generation.${providerId}`,
          startTime: new Date(startTime),
          metadata: {
            provider: providerId,
            model: modelId,
          },
        });

        // Store trace context for later completion
        this.traceMap.set(requestId, {
          traceId: trace.id,
          spanId: span.id,
          startTime,
        });

        this.config.logger?.debug(`[LangfuseTracing] Started trace for request ${requestId}`);
      } catch (error) {
        this.config.logger?.error(
          `[LangfuseTracing] Failed to start trace for request ${requestId}:`,
          error,
        );
        // Don't throw - tracing errors shouldn't block main operation
      }
    };
  }

  /**
   * Create the onChatComplete hook for ending a trace.
   */
  createOnChatCompleteHook(): OnChatCompleteHook {
    return async (context: OnChatCompleteContext) => {
      const { providerId, modelId, requestId, response, durationMs, tokenUsage } = context;

      try {
        const traceContext = this.traceMap.get(requestId);
        if (!traceContext) {
          this.config.logger?.warn(`[LangfuseTracing] No trace found for request ${requestId}`);
          return;
        }

        // Update span with generation data
        const span = this.client.span({
          id: traceContext.spanId,
          endTime: new Date(traceContext.startTime + durationMs),
          metadata: {
            durationMs,
            provider: providerId,
            model: modelId,
          },
        });

        // Create a generation for the LLM output
        span.generation({
          name: `generation.${modelId}`,
          model: modelId,
          modelParameters: {
            provider: providerId,
          },
          startTime: new Date(traceContext.startTime),
          endTime: new Date(traceContext.startTime + durationMs),
          input: {} as Record<string, unknown>,
          output: (this.includePayloads ? { response } : {}) as Record<string, unknown>,
          usage: tokenUsage
            ? {
                input: tokenUsage.promptTokens,
                output: tokenUsage.completionTokens,
                total: tokenUsage.totalTokens,
                unit: "TOKENS",
              }
            : undefined,
        });

        // Update trace with completion
        this.client.trace({
          id: traceContext.traceId,
          output: (this.includePayloads ? { response } : {}) as Record<string, unknown>,
        });

        // Clean up trace map
        this.traceMap.delete(requestId);

        this.config.logger?.debug(
          `[LangfuseTracing] Completed trace for request ${requestId} (${durationMs}ms)`,
        );
      } catch (error) {
        this.config.logger?.error(
          `[LangfuseTracing] Failed to complete trace for request ${requestId}:`,
          error,
        );
        // Don't throw - tracing errors shouldn't affect main operation
      }
    };
  }

  /**
   * Create the onChatError hook for recording errors in traces.
   */
  createOnChatErrorHook(): OnChatErrorHook {
    return async (context: OnChatErrorContext) => {
      const { providerId, modelId, requestId, error, durationMs } = context;

      try {
        const traceContext = this.traceMap.get(requestId);
        if (!traceContext) {
          this.config.logger?.warn(`[LangfuseTracing] No trace found for request ${requestId}`);
          return;
        }

        // Extract error information
        const errorInfo = this.extractErrorInfo(error);

        // Update span with error
        this.client.span({
          id: traceContext.spanId,
          endTime: new Date(traceContext.startTime + durationMs),
          level: "ERROR",
          statusMessage: errorInfo.message,
          metadata: {
            errorCode: errorInfo.code,
            errorStatusCode: errorInfo.statusCode,
            durationMs,
            provider: providerId,
            model: modelId,
          },
        });

        // Update trace with error
        this.client.trace({
          id: traceContext.traceId,
          metadata: {
            errorMessage: errorInfo.message,
          },
        });

        // Clean up trace map
        this.traceMap.delete(requestId);

        this.config.logger?.debug(
          `[LangfuseTracing] Recorded error in trace for request ${requestId}`,
        );
      } catch (traceError) {
        this.config.logger?.error(
          `[LangfuseTracing] Failed to record error in trace for request ${requestId}:`,
          traceError,
        );
        // Don't throw - tracing errors shouldn't affect error handling
      }
    };
  }

  /**
   * Extract error information for Langfuse recording.
   */
  private extractErrorInfo(error: unknown): {
    message: string;
    code?: string;
    statusCode?: number;
  } {
    if (error instanceof AgentRuntimeError) {
      return {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
      };
    }

    if (error instanceof Error) {
      return {
        message: error.message,
      };
    }

    return {
      message: String(error),
    };
  }
}

/**
 * Factory function to create a Langfuse tracing hook.
 */
export function createLangfuseTracingHook(config: LangfuseHookConfig): LangfuseTracingHook {
  return new LangfuseTracingHook(config);
}
