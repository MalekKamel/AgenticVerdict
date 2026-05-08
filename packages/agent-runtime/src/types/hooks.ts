/**
 * Lifecycle hook types for provider runtime operations.
 *
 * Hooks enable cross-cutting concerns like billing, tracing, and logging
 * without coupling the provider implementation to specific concerns.
 */

/**
 * Context passed to all lifecycle hooks.
 * Provides tenant isolation and request tracing metadata.
 */
export interface HookContext {
  /** Tenant identifier for isolation and billing */
  tenantId: string;
  /** Provider identifier (e.g., 'openai', 'anthropic') */
  providerId: string;
  /** Model identifier (e.g., 'gpt-4o', 'claude-3-5-sonnet') */
  modelId: string;
  /** Unique request identifier for tracing */
  requestId: string;
  /** Unix timestamp when the request started */
  startedAt: number;
}

/**
 * Context for beforeChat hook.
 */
export interface BeforeChatContext extends HookContext {
  /** Chat completion request payload */
  payload: unknown;
}

/**
 * Context for onChatComplete hook.
 */
export interface OnChatCompleteContext extends HookContext {
  /** Chat completion response */
  response: unknown;
  /** Duration in milliseconds */
  durationMs: number;
  /** Token usage statistics if available */
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Context for onChatError hook.
 */
export interface OnChatErrorContext extends HookContext {
  /** Error that occurred */
  error: unknown;
  /** Duration in milliseconds until error */
  durationMs: number;
}

/**
 * Hook that runs before a chat completion request.
 * Can be used for:
 * - Budget checking
 * - Request validation
 * - PII redaction
 * - Trace span creation
 *
 * @throws {Error} May throw to block the request (e.g., budget exceeded)
 */
export type BeforeChatHook = (context: BeforeChatContext) => Promise<void> | void;

/**
 * Hook that runs after a successful chat completion.
 * Can be used for:
 * - Cost tracking and billing
 * - Token usage recording
 * - Trace span completion
 * - Structured logging
 */
export type OnChatCompleteHook = (context: OnChatCompleteContext) => Promise<void> | void;

/**
 * Hook that runs when a chat completion fails.
 * Can be used for:
 * - Error logging
 * - Alert triggering
 * - Trace span error recording
 * - Metrics collection
 */
export type OnChatErrorHook = (context: OnChatErrorContext) => Promise<void> | void;

/**
 * Union of all hook types.
 */
export type ChatHook = BeforeChatHook | OnChatCompleteHook | OnChatErrorHook;

/**
 * Registry of all hooks for a provider runtime.
 */
export interface HookRegistry {
  /** Hooks to run before chat completion */
  beforeChat: Array<BeforeChatHook | ConditionalHook<BeforeChatHook>>;
  /** Hooks to run after successful chat completion */
  onChatComplete: Array<OnChatCompleteHook | ConditionalHook<OnChatCompleteHook>>;
  /** Hooks to run when chat completion fails */
  onChatError: Array<OnChatErrorHook | ConditionalHook<OnChatErrorHook>>;
}

/**
 * Configuration for a conditional hook.
 * Allows hooks to only execute when certain conditions are met.
 */
export interface ConditionalHook<T extends ChatHook> {
  /** The hook function to execute */
  hook: T;
  /** Condition function - hook only runs if this returns true */
  condition?: (context: HookContext) => boolean | Promise<boolean>;
  /** Whether this hook is optional (errors won't block execution) */
  optional?: boolean;
}

/**
 * Result of executing a hook.
 */
export interface HookExecutionResult {
  /** Hook identifier or name */
  hookName: string;
  /** Whether execution was successful */
  success: boolean;
  /** Duration in milliseconds */
  durationMs: number;
  /** Error if execution failed */
  error?: unknown;
  /** Whether the hook was skipped (e.g., condition not met) */
  skipped?: boolean;
  /** Skip reason if applicable */
  skipReason?: string;
}
