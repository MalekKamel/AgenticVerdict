import type { TenantConfig } from "@agenticverdict/config";
import { LANGUAGE_NATIVE_NAMES } from "@agenticverdict/i18n";

import { estimateApproximateTokenCount } from "./render";

/**
 * Precedence for assembling model-facing text (highest authority first):
 * 1. **System policy** — safety, format, tool rules (caller-supplied; not modified here).
 * 2. **Tenant context** — tenant-safe profile from `TenantConfig` via `buildTenantPromptContext` (this module).
 * 3. **User task** — goal-specific instructions from the end user.
 * 4. **Tool context** — retrieved metrics summaries (short-lived; truncate aggressively).
 *
 * When trimming to a token budget, `buildTenantPromptContext` keeps **high-priority sections first**; **identity** and
 * **localization** may switch to compact one-line forms before they are dropped entirely. For layered assembly,
 * `assemblePromptLayers` trims tool text, then tenant text (see that function).
 */

export interface TenantPromptContextOptions {
  /** Soft cap for `estimateApproximateTokenCount` over the returned tenant block. */
  maxApproxTokens: number;
  /**
   * Smaller numbers drop first under pressure. Identity/localization use high priority.
   * Default ordering is set in `buildTenantPromptContext`.
   */
  sectionPriorities?: Partial<Record<PromptContextSectionKey, number>>;
}

export type PromptContextSectionKey =
  | "identity"
  | "localization"
  | "business"
  | "marketing_channels"
  | "kpis"
  | "features"
  | "ai_preferences";

export interface PromptContextSection {
  key: PromptContextSectionKey;
  /** Higher priority sections are preserved longer when trimming. */
  priority: number;
  text: string;
}

const DEFAULT_PRIORITY: Record<PromptContextSectionKey, number> = {
  identity: 100,
  localization: 95,
  business: 70,
  marketing_channels: 60,
  kpis: 55,
  features: 40,
  ai_preferences: 35,
};

function getLanguageName(languageCode: string): string {
  const normalized = languageCode.toLowerCase();
  for (const [key, value] of Object.entries(LANGUAGE_NATIVE_NAMES) as [string, string][]) {
    if (key.toLowerCase() === normalized) {
      return value;
    }
  }
  return "English";
}

function formatChannelSummary(config: TenantConfig): string {
  const lines = config.marketing.channels
    .filter((c) => c.enabled)
    .map((c) => `- ${c.platform}${c.label ? ` (${c.label})` : ""}`);
  return lines.length > 0 ? lines.join("\n") : "(no enabled channels configured)";
}

/**
 * Builds non-secret, tenant-scoped context suitable for system or developer messages.
 * Secrets (API keys, tokens) must never appear in `TenantConfig`; this function only serializes whitelisted fields.
 */
export function buildTenantPromptContextSections(config: TenantConfig): PromptContextSection[] {
  const priorities = DEFAULT_PRIORITY;

  const sections: PromptContextSection[] = [
    {
      key: "identity",
      priority: priorities.identity,
      text: `Tenant: ${config.tenantName} (id: ${config.tenantId})`,
    },
    {
      key: "localization",
      priority: priorities.localization,
      text: `Locale: language=${config.localization.language}, region=${config.localization.region}, timezone=${config.localization.timezone}, currency=${config.localization.currency}\nIMPORTANT: All analysis, insights, recommendations, and JSON field values must be written in ${getLanguageName(config.localization.language)}.`,
    },
  ];

  if (config.business) {
    const b = config.business;
    const parts: string[] = [];
    if (b.products.length > 0) {
      parts.push(`Products: ${b.products.join(", ")}`);
    }
    if (b.valueProps.length > 0) {
      parts.push(`Value props: ${b.valueProps.join(", ")}`);
    }
    if (b.differentiators.length > 0) {
      parts.push(`Differentiators: ${b.differentiators.join(", ")}`);
    }
    if (parts.length > 0) {
      sections.push({
        key: "business",
        priority: priorities.business,
        text: parts.join("\n"),
      });
    }
  }

  sections.push({
    key: "marketing_channels",
    priority: priorities.marketing_channels,
    text: `Enabled marketing channels:\n${formatChannelSummary(config)}`,
  });

  if (config.marketing.kpis && config.marketing.kpis.length > 0) {
    const kpiLine = config.marketing.kpis
      .map((k) => `${k.name}${k.unit !== undefined ? ` [${k.unit}]` : ""}`)
      .join("; ");
    sections.push({
      key: "kpis",
      priority: priorities.kpis,
      text: `KPIs: ${kpiLine}`,
    });
  }

  sections.push({
    key: "features",
    priority: priorities.features,
    text: `Feature flags: insights=${config.features.enableInsights}, verdict=${config.features.enableVerdict}`,
  });

  sections.push({
    key: "ai_preferences",
    priority: priorities.ai_preferences,
    text: `AI preferences: provider=${config.ai.primaryProvider}, defaultModel=${config.ai.defaultModel?.modelId || "none"}`,
  });

  return sections;
}

function applyPriorityOverrides(
  sections: PromptContextSection[],
  overrides: Partial<Record<PromptContextSectionKey, number>>,
): PromptContextSection[] {
  if (Object.keys(overrides).length === 0) {
    return sections;
  }
  return sections.map((s) =>
    overrides[s.key] !== undefined ? { ...s, priority: overrides[s.key]! } : s,
  );
}

/**
 * Returns a single newline-joined tenant context block respecting `maxApproxTokens`, dropping lowest-priority
 * sections first until the estimate fits.
 */
function compactSection(
  config: TenantConfig,
  section: PromptContextSection,
): PromptContextSection | undefined {
  if (section.key === "identity") {
    return { ...section, text: `Tenant: ${config.tenantName}` };
  }
  if (section.key === "localization") {
    return {
      ...section,
      text: `Locale: ${config.localization.language}/${config.localization.region}\nIMPORTANT: All output must be written in ${getLanguageName(config.localization.language)}.`,
    };
  }
  return undefined;
}

export function buildTenantPromptContext(
  config: TenantConfig,
  options: TenantPromptContextOptions,
): {
  text: string;
  sectionsIncluded: PromptContextSectionKey[];
  sectionsDropped: PromptContextSectionKey[];
} {
  const sections = applyPriorityOverrides(
    buildTenantPromptContextSections(config),
    options.sectionPriorities ?? {},
  );
  /** Greedily keep highest-priority sections first until the approximate token budget is exhausted. */
  const byPriorityDesc = [...sections].sort((a, b) => b.priority - a.priority);

  const included: PromptContextSection[] = [];
  const dropped: PromptContextSectionKey[] = [];

  for (const s of byPriorityDesc) {
    const tryAdd = (candidateSection: PromptContextSection): boolean => {
      const candidate = [...included, candidateSection].map((x) => x.text).join("\n\n");
      return estimateApproximateTokenCount(candidate) <= options.maxApproxTokens;
    };

    if (tryAdd(s)) {
      included.push(s);
    } else {
      const shrunk = compactSection(config, s);
      if (shrunk !== undefined && tryAdd(shrunk)) {
        included.push(shrunk);
      } else {
        dropped.push(s.key);
      }
    }
  }

  const orderedIncluded = [...included].sort((a, b) => b.priority - a.priority);
  const text = orderedIncluded.map((s) => s.text).join("\n\n");

  return {
    text,
    sectionsIncluded: orderedIncluded.map((s) => s.key),
    sectionsDropped: dropped,
  };
}

export interface AssembledPromptLayersInput {
  systemPolicy: string;
  tenantContext: string;
  userTask: string;
  toolContext?: string;
  maxApproxTokensTotal: number;
}

/**
 * Concatenates layers in documented precedence and trims only `toolContext`, then `tenantContext` (by whole string)
 * to satisfy `maxApproxTokensTotal`. System policy and user task are never truncated here.
 */
export function assemblePromptLayers(input: AssembledPromptLayersInput): {
  systemMessage: string;
  userMessage: string;
  approxTokens: { system: number; user: number; total: number };
  truncation: { toolContextTrimmed: boolean; tenantContextTrimmed: boolean };
} {
  const tool = input.toolContext ?? "";
  const tenant = input.tenantContext;
  const user = input.userTask;

  let toolUsed = tool;
  let tenantUsed = tenant;

  const buildSystem = (): string =>
    [input.systemPolicy, tenantUsed].filter((x) => x.length > 0).join("\n\n");

  const buildUser = (): string => {
    const head = toolUsed.length > 0 ? `Context:\n${toolUsed}\n\n` : "";
    return `${head}Task:\n${user}`;
  };

  const totalTokens = (): number =>
    estimateApproximateTokenCount(buildSystem()) + estimateApproximateTokenCount(buildUser());

  let toolTrimmed = false;
  let tenantTrimmed = false;

  while (totalTokens() > input.maxApproxTokensTotal) {
    if (toolUsed.length > 0) {
      toolUsed = toolUsed.slice(0, Math.max(0, Math.floor(toolUsed.length * 0.7)));
      toolTrimmed = true;
      continue;
    }
    if (tenantUsed.length > 0) {
      tenantUsed = tenantUsed.slice(0, Math.max(0, Math.floor(tenantUsed.length * 0.7)));
      tenantTrimmed = true;
      continue;
    }
    break;
  }

  const systemMessage = buildSystem();
  const userMessage = buildUser();

  const sysT = estimateApproximateTokenCount(systemMessage);
  const usrT = estimateApproximateTokenCount(userMessage);

  return {
    systemMessage,
    userMessage,
    approxTokens: { system: sysT, user: usrT, total: sysT + usrT },
    truncation: { toolContextTrimmed: toolTrimmed, tenantContextTrimmed: tenantTrimmed },
  };
}
