import type { AgentInvocationContext, ITool } from "./interfaces";

export type ToolHandler = (
  args: Readonly<Record<string, unknown>>,
  ctx: AgentInvocationContext,
) => Promise<unknown>;

export interface ToolDefinition {
  name: string;
  description: string;
  execute: ToolHandler;
}

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
