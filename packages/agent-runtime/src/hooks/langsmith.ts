import { Client, Run } from "langsmith";
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
 * LangSmith tracing configuration.
 */
export interface LangSmithHookConfig {
  /** LangSmith API key */
  apiKey: string;
  /** LangSmith project name */
  projectName: string;
  /** Optional API URL (defaults to LangSmith cloud) */
  apiUrl?: string;
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
}

/**
 * Context for tracking a LangSmith run.
 */
interface RunContext {
  /** LangSmith run ID */
  runId: string;
  /** Start time in milliseconds */
  startTime: number;
}

/**
 * Built-in hook for LangSmith tracing.
 *
 * Features:
 * - Automatic trace span creation for each request
 * - Token usage recording
 * - Error tracking in traces
 * - Tenant-scoped metadata (PII-safe)
 * - Optional payload inclusion (disabled by default for security)
 *
 * PII Safety:
 * - Tenant IDs are included as metadata (required for multi-tenant tracing)
 * - Request/response payloads excluded by default
 * - Can be enabled via config for debugging (not recommended for production)
 */
export class LangSmithTracingHook {
  private readonly client: Client;
  private readonly config: LangSmithHookConfig;
  private readonly runMap = new Map<string, RunContext>();
  private readonly includePayloads: boolean;

  constructor(config: LangSmithHookConfig) {
    this.config = config;
    this.includePayloads = config.includePayloads ?? false;

    this.client = new Client({
      apiKey: config.apiKey,
      apiUrl: config.apiUrl,
    });

    this.config.logger?.info(`[LangSmithTracing] Initialized for project: ${config.projectName}`);
  }

  /**
   * Create the beforeChat hook for starting a trace.
   */
  createBeforeChatHook(): BeforeChatHook {
    return async (context: BeforeChatContext) => {
      const { tenantId, providerId, modelId, requestId, payload } = context;

      try {
        const startTime = Date.now();

        // Start a new LangSmith run
        const runData = {
          name: `chat.${providerId}.${modelId}`,
          run_type: "llm" as const,
          inputs: (this.includePayloads ? payload : { requestId }) as Record<string, unknown>,
          metadata: {
            tenant_id: tenantId,
            provider_id: providerId,
            model_id: modelId,
            request_id: requestId,
          },
          tags: [`provider:${providerId}`, `model:${modelId}`, `tenant:${tenantId}`],
          project_name: this.config.projectName,
        };

        const runResult = await this.client.createRun(runData);

        // Store run context for later completion
        this.runMap.set(requestId, {
          runId: runResult.id,
          startTime,
        });

        this.config.logger?.debug(`[LangSmithTracing] Started trace for request ${requestId}`);
      } catch (error) {
        this.config.logger?.error(
          `[LangSmithTracing] Failed to start trace for request ${requestId}:`,
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
      const { requestId, response, durationMs, tokenUsage } = context;

      try {
        const runContext = this.runMap.get(requestId);
        if (!runContext) {
          this.config.logger?.warn(`[LangSmithTracing] No trace found for request ${requestId}`);
          return;
        }

        // Prepare outputs
        const outputs = this.includePayloads ? { response } : {};

        // Add token usage if available
        if (tokenUsage) {
          const runUpdate: Partial<Run> = {
            outputs,
            end_time: new Date(runContext.startTime + durationMs).toISOString(),
            extra: {
              metadata: {
                prompt_tokens: tokenUsage.promptTokens,
                completion_tokens: tokenUsage.completionTokens,
                total_tokens: tokenUsage.totalTokens,
                duration_ms: durationMs,
              },
            },
          };

          await this.client.updateRun(runContext.runId, runUpdate);
        } else {
          await this.client.updateRun(runContext.runId, {
            outputs,
            end_time: new Date(runContext.startTime + durationMs).toISOString(),
          });
        }

        // Clean up run map
        this.runMap.delete(requestId);

        this.config.logger?.debug(
          `[LangSmithTracing] Completed trace for request ${requestId} (${durationMs}ms)`,
        );
      } catch (error) {
        this.config.logger?.error(
          `[LangSmithTracing] Failed to complete trace for request ${requestId}:`,
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
      const { requestId, error, durationMs } = context;

      try {
        const runContext = this.runMap.get(requestId);
        if (!runContext) {
          this.config.logger?.warn(`[LangSmithTracing] No trace found for request ${requestId}`);
          return;
        }

        // Extract error information
        const errorInfo = this.extractErrorInfo(error);

        // Update run with error
        await this.client.updateRun(runContext.runId, {
          end_time: new Date(runContext.startTime + durationMs).toISOString(),
          error: errorInfo.message,
          extra: {
            metadata: {
              error_code: errorInfo.code,
              error_status_code: errorInfo.statusCode,
              duration_ms: durationMs,
            },
          },
        });

        // Clean up run map
        this.runMap.delete(requestId);

        this.config.logger?.debug(
          `[LangSmithTracing] Recorded error in trace for request ${requestId}`,
        );
      } catch (traceError) {
        this.config.logger?.error(
          `[LangSmithTracing] Failed to record error in trace for request ${requestId}:`,
          traceError,
        );
        // Don't throw - tracing errors shouldn't affect error handling
      }
    };
  }

  /**
   * Extract error information for LangSmith recording.
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
 * Factory function to create a LangSmith tracing hook.
 */
export function createLangSmithTracingHook(config: LangSmithHookConfig): LangSmithTracingHook {
  return new LangSmithTracingHook(config);
}
