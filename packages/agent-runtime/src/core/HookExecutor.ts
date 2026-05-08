import type {
  HookContext,
  BeforeChatContext,
  OnChatCompleteContext,
  OnChatErrorContext,
  BeforeChatHook,
  OnChatCompleteHook,
  OnChatErrorHook,
  HookRegistry,
  ConditionalHook,
  HookExecutionResult,
  ChatHook,
} from "../types/hooks";
import { AgentRuntimeError, AgentRuntimeErrorCode } from "../errors";

/**
 * Executes lifecycle hooks at appropriate points in the request lifecycle.
 *
 * Features:
 * - Executes hooks in registration order
 * - Supports conditional hooks
 * - Handles hook errors gracefully (logs but doesn't block unless configured)
 * - Tracks execution metrics
 */
export class HookExecutor {
  private readonly registry: HookRegistry;
  private readonly logger?: {
    warn: (message: string, ...args: unknown[]) => void;
    error: (message: string, ...args: unknown[]) => void;
    debug: (message: string, ...args: unknown[]) => void;
  };

  constructor(
    registry: HookRegistry,
    options?: {
      logger?: HookExecutor["logger"];
    },
  ) {
    this.registry = registry;
    this.logger = options?.logger;
  }

  /**
   * Execute all registered beforeChat hooks.
   * Throws if any non-optional hook throws an error.
   */
  async executeBeforeChat(context: BeforeChatContext): Promise<void> {
    const results: HookExecutionResult[] = [];

    for (const [index, hookOrConditional] of this.registry.beforeChat.entries()) {
      const hookName = `beforeChat-${index}`;

      try {
        const shouldExecute = await this.shouldExecuteHook(hookOrConditional, context);

        if (!shouldExecute) {
          results.push({
            hookName,
            success: true,
            durationMs: 0,
            skipped: true,
            skipReason: "Condition not met",
          });
          continue;
        }

        const startTime = Date.now();
        const hook = this.getHookFunction(hookOrConditional);

        await (hook as (ctx: typeof context) => Promise<void>)(context);

        const durationMs = Date.now() - startTime;
        results.push({ hookName, success: true, durationMs });

        this.logger?.debug(`Hook ${hookName} executed successfully in ${durationMs}ms`);
      } catch (error) {
        const isOptional =
          this.isConditionalHook(hookOrConditional) && hookOrConditional.optional === true;

        if (isOptional) {
          this.logger?.warn(`Optional hook ${hookName} failed:`, error);
          results.push({
            hookName,
            success: false,
            durationMs: 0,
            error,
          });
        } else {
          this.logger?.error(`Required hook ${hookName} failed:`, error);
          throw AgentRuntimeError.fromError({
            code: AgentRuntimeErrorCode.HOOK_EXECUTION_FAILED,
            providerId: context.providerId,
            tenantId: context.tenantId,
            cause: error,
            metadata: { hookName, hookType: "beforeChat" },
          });
        }
      }
    }
  }

  /**
   * Execute all registered onChatComplete hooks.
   * Errors are logged but don't throw (main operation already succeeded).
   */
  async executeOnChatComplete(context: OnChatCompleteContext): Promise<HookExecutionResult[]> {
    const results: HookExecutionResult[] = [];

    for (const [index, hookOrConditional] of this.registry.onChatComplete.entries()) {
      const hookName = `onChatComplete-${index}`;

      try {
        const shouldExecute = await this.shouldExecuteHook(hookOrConditional, context);

        if (!shouldExecute) {
          results.push({
            hookName,
            success: true,
            durationMs: 0,
            skipped: true,
            skipReason: "Condition not met",
          });
          continue;
        }

        const startTime = Date.now();
        const hook = this.getHookFunction(hookOrConditional);

        await (hook as (ctx: typeof context) => Promise<void>)(context);

        const durationMs = Date.now() - startTime;
        results.push({ hookName, success: true, durationMs });

        this.logger?.debug(`Hook ${hookName} executed successfully in ${durationMs}ms`);
      } catch (error) {
        this.logger?.error(`Hook ${hookName} failed (non-blocking):`, error);
        results.push({
          hookName,
          success: false,
          durationMs: 0,
          error,
        });
      }
    }

    return results;
  }

  /**
   * Execute all registered onChatError hooks.
   * Errors are logged but don't throw (original error takes precedence).
   */
  async executeOnChatError(context: OnChatErrorContext): Promise<HookExecutionResult[]> {
    const results: HookExecutionResult[] = [];

    for (const [index, hookOrConditional] of this.registry.onChatError.entries()) {
      const hookName = `onChatError-${index}`;

      try {
        const shouldExecute = await this.shouldExecuteHook(hookOrConditional, context);

        if (!shouldExecute) {
          results.push({
            hookName,
            success: true,
            durationMs: 0,
            skipped: true,
            skipReason: "Condition not met",
          });
          continue;
        }

        const startTime = Date.now();
        const hook = this.getHookFunction(hookOrConditional);

        await (hook as (ctx: typeof context) => Promise<void>)(context);

        const durationMs = Date.now() - startTime;
        results.push({ hookName, success: true, durationMs });

        this.logger?.debug(`Hook ${hookName} executed successfully in ${durationMs}ms`);
      } catch (error) {
        this.logger?.error(`Hook ${hookName} failed (non-blocking):`, error);
        results.push({
          hookName,
          success: false,
          durationMs: 0,
          error,
        });
      }
    }

    return results;
  }

  /**
   * Check if a hook should be executed based on its condition.
   */
  private async shouldExecuteHook(
    hookOrConditional: ChatHook | ConditionalHook<ChatHook>,
    context: HookContext,
  ): Promise<boolean> {
    if (this.isConditionalHook(hookOrConditional)) {
      const conditional = hookOrConditional as ConditionalHook<ChatHook>;
      if (conditional.condition) {
        try {
          return await Promise.resolve(conditional.condition(context));
        } catch (error) {
          this.logger?.warn(`Hook condition failed:`, error);
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Extract the hook function from a hook or conditional hook.
   */
  private getHookFunction(hookOrConditional: ChatHook | ConditionalHook<ChatHook>): ChatHook {
    if (this.isConditionalHook(hookOrConditional)) {
      return (hookOrConditional as ConditionalHook<ChatHook>).hook;
    }
    return hookOrConditional as ChatHook;
  }

  /**
   * Type guard to check if something is a ConditionalHook.
   */
  private isConditionalHook(
    hookOrConditional: ChatHook | ConditionalHook<ChatHook>,
  ): hookOrConditional is ConditionalHook<ChatHook> {
    return typeof hookOrConditional === "object" && "hook" in hookOrConditional;
  }
}

/**
 * Factory function to create a HookExecutor with typed hook registration.
 */
export function createHookExecutor(options?: {
  beforeChat?: Array<BeforeChatHook | ConditionalHook<BeforeChatHook>>;
  onChatComplete?: Array<OnChatCompleteHook | ConditionalHook<OnChatCompleteHook>>;
  onChatError?: Array<OnChatErrorHook | ConditionalHook<OnChatErrorHook>>;
  logger?: {
    warn: (message: string, ...args: unknown[]) => void;
    error: (message: string, ...args: unknown[]) => void;
    debug: (message: string, ...args: unknown[]) => void;
  };
}): HookExecutor {
  const registry: HookRegistry = {
    beforeChat: options?.beforeChat ?? [],
    onChatComplete: options?.onChatComplete ?? [],
    onChatError: options?.onChatError ?? [],
  };

  return new HookExecutor(registry, { logger: options?.logger });
}
