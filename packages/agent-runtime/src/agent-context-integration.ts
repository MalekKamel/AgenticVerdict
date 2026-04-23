import { requireTenantContext } from "@agenticverdict/core";

import type { AgentInvocationContext } from "./interfaces";
import { assemblePromptLayers, buildTenantPromptContext } from "./prompts/index";
import type { AgentFactoryConfig } from "./agent-config";

export class AgentTenantContextError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AgentTenantContextError";
  }
}

/**
 * Ensures the agent job invocation matches the active Phase 0 tenant scope so tools and memory
 * cannot accidentally run under a mismatched tenant.
 */
export function assertInvocationMatchesActiveTenant(ctx: AgentInvocationContext): void {
  const tenant = requireTenantContext();
  if (tenant.tenantId !== ctx.tenantId) {
    throw new AgentTenantContextError(
      "Agent invocation tenantId does not match active tenant context (possible cross-tenant mix-up).",
    );
  }
}

export interface BuildFactoryTurnPromptInput {
  factoryConfig: AgentFactoryConfig;
  goal: string;
  /** Optional short-lived tool/metrics blob; trimmed first under budget pressure. */
  toolContext?: string;
}

/**
 * Builds trimmed system + user messages for one agent turn using tenant `TenantConfig` from ALS
 * and the factory-level policy and token budgets.
 */
export function buildFactoryTurnPromptLayers(
  input: BuildFactoryTurnPromptInput,
): ReturnType<typeof assemblePromptLayers> {
  const tenant = requireTenantContext();
  const tenantPromptContext = buildTenantPromptContext(tenant.config, {
    maxApproxTokens: input.factoryConfig.tenantContextMaxApproxTokens,
  });

  const defaultPolicy =
    "You are a marketing analytics assistant. Stay tenant-scoped, avoid secrets in replies, and be concise.";

  return assemblePromptLayers({
    systemPolicy: input.factoryConfig.systemPolicy ?? defaultPolicy,
    tenantContext: tenantPromptContext.text,
    userTask: input.goal,
    toolContext: input.toolContext,
    maxApproxTokensTotal: input.factoryConfig.maxAssembledPromptApproxTokens,
  });
}
