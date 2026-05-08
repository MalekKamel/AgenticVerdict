import type {
  BeforeChatHook,
  OnChatCompleteHook,
  OnChatErrorHook,
  BeforeChatContext,
  OnChatCompleteContext,
  OnChatErrorContext,
  ConditionalHook,
  HookContext,
} from "../types/hooks";
import { createPinoLogger } from "@agenticverdict/observability";

const logger = createPinoLogger("agent-runtime");

/**
 * Compose multiple beforeChat hooks into a single hook.
 * Hooks execute in order - if any throws, remaining hooks are skipped.
 *
 * @param hooks - Array of hooks to compose
 * @returns Single composed hook
 */
export function composeBeforeChatHooks(
  ...hooks: Array<BeforeChatHook | ConditionalHook<BeforeChatHook>>
): BeforeChatHook {
  return async (context: BeforeChatContext): Promise<void> => {
    for (const hookOrConditional of hooks) {
      const hook = isConditionalHook(hookOrConditional)
        ? hookOrConditional.hook
        : hookOrConditional;

      const condition = isConditionalHook(hookOrConditional)
        ? hookOrConditional.condition
        : undefined;

      // Check condition if provided
      if (condition) {
        try {
          const shouldExecute = await Promise.resolve(condition(context));
          if (!shouldExecute) {
            continue;
          }
        } catch {
          // Skip hook if condition fails
          continue;
        }
      }

      await hook(context);
    }
  };
}

/**
 * Compose multiple onChatComplete hooks into a single hook.
 * All hooks execute even if some fail (errors are logged but don't block).
 *
 * @param hooks - Array of hooks to compose
 * @returns Single composed hook
 */
export function composeOnChatCompleteHooks(
  ...hooks: Array<OnChatCompleteHook | ConditionalHook<OnChatCompleteHook>>
): OnChatCompleteHook {
  return async (context: OnChatCompleteContext): Promise<void> => {
    const errors: unknown[] = [];

    for (const hookOrConditional of hooks) {
      const hook = isConditionalHook(hookOrConditional)
        ? hookOrConditional.hook
        : hookOrConditional;

      const condition = isConditionalHook(hookOrConditional)
        ? hookOrConditional.condition
        : undefined;

      // Check condition if provided
      if (condition) {
        try {
          const shouldExecute = await Promise.resolve(condition(context));
          if (!shouldExecute) {
            continue;
          }
        } catch {
          // Skip hook if condition fails
          continue;
        }
      }

      try {
        await hook(context);
      } catch (error) {
        errors.push(error);
      }
    }

    // If any hooks failed, throw aggregated error
    if (errors.length > 0) {
      logger.warn({ errors }, "Some onChatComplete hooks failed");
    }
  };
}

/**
 * Compose multiple onChatError hooks into a single hook.
 * All hooks execute even if some fail (errors are logged but don't block).
 *
 * @param hooks - Array of hooks to compose
 * @returns Single composed hook
 */
export function composeOnChatErrorHooks(
  ...hooks: Array<OnChatErrorHook | ConditionalHook<OnChatErrorHook>>
): OnChatErrorHook {
  return async (context: OnChatErrorContext): Promise<void> => {
    const errors: unknown[] = [];

    for (const hookOrConditional of hooks) {
      const hook = isConditionalHook(hookOrConditional)
        ? hookOrConditional.hook
        : hookOrConditional;

      const condition = isConditionalHook(hookOrConditional)
        ? hookOrConditional.condition
        : undefined;

      // Check condition if provided
      if (condition) {
        try {
          const shouldExecute = await Promise.resolve(condition(context));
          if (!shouldExecute) {
            continue;
          }
        } catch {
          // Skip hook if condition fails
          continue;
        }
      }

      try {
        await hook(context);
      } catch (error) {
        errors.push(error);
      }
    }

    // If any hooks failed, throw aggregated error
    if (errors.length > 0) {
      logger.warn({ errors }, "Some onChatError hooks failed");
    }
  };
}

/**
 * Type guard to check if something is a ConditionalHook.
 */
function isConditionalHook<T extends BeforeChatHook | OnChatCompleteHook | OnChatErrorHook>(
  hookOrConditional: T | ConditionalHook<T>,
): hookOrConditional is ConditionalHook<T> {
  return typeof hookOrConditional === "object" && "hook" in hookOrConditional;
}

/**
 * Create a conditional hook wrapper.
 *
 * @param hook - The hook to wrap
 * @param condition - Condition function that determines if hook should execute
 * @param optional - Whether the hook is optional (default: false)
 * @returns Conditional hook
 */
export function createConditionalHook<
  T extends BeforeChatHook | OnChatCompleteHook | OnChatErrorHook,
>(
  hook: T,
  condition: (context: HookContext) => boolean | Promise<boolean>,
  optional: boolean = false,
): ConditionalHook<T> {
  return {
    hook,
    condition,
    optional,
  };
}
