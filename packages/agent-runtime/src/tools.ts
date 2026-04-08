import type { AgentInvocationContext, ITool } from "./interfaces";
import { AgentToolError } from "./agent-tools/agent-tool-error";

export type ToolHandler = (
  args: Readonly<Record<string, unknown>>,
  ctx: AgentInvocationContext,
) => Promise<unknown>;

export interface ToolDefinition {
  name: string;
  description: string;
  execute: ToolHandler;
}

export type ToolResultErrorCode =
  | "PLATFORM_AUTH_FAILED"
  | "PLATFORM_RATE_LIMITED"
  | "PLATFORM_TIMEOUT"
  | "PLATFORM_UNAVAILABLE"
  | "INVALID_INPUT"
  | "DATA_TRANSFORM_FAILED"
  | "CACHE_ERROR"
  | "UNKNOWN_ERROR";

export interface ToolResultError {
  code: ToolResultErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

export type ToolResult<T> =
  | { success: true; data: T; executionTime: number }
  | {
      success: false;
      error: ToolResultError;
      retryable: boolean;
      partialResults?: T;
      executionTime: number;
    };

export function defineTool(def: ToolDefinition): ITool {
  return {
    name: def.name,
    description: def.description,
    execute: def.execute,
  };
}

export class ToolRegistry {
  private readonly tools = new Map<string, ITool>();

  register(tool: ITool): void {
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool "${tool.name}" is already registered`);
    }
    this.tools.set(tool.name, tool);
  }

  get(name: string): ITool | undefined {
    return this.tools.get(name);
  }

  list(): ITool[] {
    return [...this.tools.values()];
  }
}

function classifyToolError(error: unknown): { error: ToolResultError; retryable: boolean } {
  if (error instanceof AgentToolError) {
    if (error.code === "validation_failed") {
      return {
        error: { code: "INVALID_INPUT", message: error.message },
        retryable: false,
      };
    }
    if (error.code === "tenant_context_required") {
      return {
        error: { code: "DATA_TRANSFORM_FAILED", message: error.message },
        retryable: false,
      };
    }
  }
  if (error instanceof Error) {
    return {
      error: { code: "UNKNOWN_ERROR", message: error.message },
      retryable: true,
    };
  }
  return {
    error: { code: "UNKNOWN_ERROR", message: "Unknown tool error" },
    retryable: true,
  };
}

export async function executeToolWithResult<T = unknown>(
  tool: ITool,
  args: Readonly<Record<string, unknown>>,
  ctx: AgentInvocationContext,
): Promise<ToolResult<T>> {
  const start = Date.now();
  try {
    const data = (await tool.execute(args, ctx)) as T;
    return { success: true, data, executionTime: Date.now() - start };
  } catch (error) {
    const classified = classifyToolError(error);
    return {
      success: false,
      error: classified.error,
      retryable: classified.retryable,
      executionTime: Date.now() - start,
    };
  }
}
