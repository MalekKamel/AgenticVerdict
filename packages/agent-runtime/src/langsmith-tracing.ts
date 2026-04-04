import type { RunnableConfig } from "@langchain/core/runnables";

import type { AgentLlmEnv } from "./llm-env";

/**
 * Applies LangSmith settings to `process.env` in the form LangChain reads for automatic tracing.
 * Call once during process startup (API/worker bootstrap) when you want traces for all runs.
 * Does not log keys or project names.
 *
 * **PII:** Do not place tenant identifiers, emails, or raw marketing payloads in LangChain
 * `metadata` / tags. Use opaque correlation IDs approved by your security policy.
 */
export function applyLangSmithTracingToProcess(env: AgentLlmEnv): void {
  if (!env.langsmithTracingEnabled || env.langsmithApiKey === undefined) {
    return;
  }
  process.env.LANGCHAIN_TRACING_V2 = "true";
  process.env.LANGCHAIN_API_KEY = env.langsmithApiKey;
  if (env.langsmithProject !== undefined) {
    process.env.LANGCHAIN_PROJECT = env.langsmithProject;
  }
}

/**
 * RunnableConfig fragment with **non-sensitive** tags/metadata for LangSmith cost and usage views.
 * Omit tenant-scoped values unless they are hashed or explicitly approved for export.
 */
export function buildSafeLlmRunnableConfig(options: {
  agentRole: "verdict" | "insights" | "analysis";
  provider: "anthropic" | "openai";
  correlationId?: string;
}): Pick<RunnableConfig, "tags" | "metadata"> {
  const tags = [
    "package:agent-runtime",
    `agent-role:${options.agentRole}`,
    `provider:${options.provider}`,
  ];
  const metadata: Record<string, string> = {
    agentRole: options.agentRole,
    provider: options.provider,
  };
  if (options.correlationId !== undefined) {
    metadata.correlationId = options.correlationId;
  }
  return { tags, metadata };
}
