import type {
  AgentInvocationContext,
  AgentRunInput,
  AgentRunResult,
  AgentToolCallRecord,
  IAgent,
  ITool,
} from "./interfaces";
import { ToolRegistry } from "./tools";

export interface RuleBasedAgentOptions {
  tools?: ITool[];
}

/**
 * Minimal non-LLM agent: echoes the goal and records optional tool calls.
 * Demonstrates {@link IAgent} + {@link ToolRegistry} wiring for Phase 2.
 */
export function createRuleBasedEchoAgent(options: RuleBasedAgentOptions = {}): IAgent {
  const registry = new ToolRegistry();
  for (const tool of options.tools ?? []) {
    registry.register(tool);
  }

  return {
    async run(input: AgentRunInput, ctx: AgentInvocationContext): Promise<AgentRunResult> {
      const steps: AgentToolCallRecord[] = [];

      if (input.context?.demoTool === "ping") {
        const ping = registry.get("ping");
        if (ping) {
          const result = await ping.execute({}, ctx);
          steps.push({ toolName: "ping", args: {}, result });
        }
      }

      const answer = steps.length > 0 ? `ok:${String(steps[0]?.result)}` : `echo:${input.goal}`;

      return { answer, steps };
    },
  };
}
