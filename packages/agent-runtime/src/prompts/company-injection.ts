import type { CompanyConfig } from "@agenticverdict/config";

import { estimateApproximateTokenCount } from "./render";

/**
 * Precedence for assembling model-facing text (highest authority first):
 * 1. **System policy** — safety, format, tool rules (caller-supplied; not modified here).
 * 2. **Company context** — tenant-safe profile from `CompanyConfig` via `buildCompanyPromptContext` (this module).
 * 3. **User task** — goal-specific instructions from the end user.
 * 4. **Tool context** — retrieved metrics summaries (short-lived; truncate aggressively).
 *
 * When trimming to a token budget, `buildCompanyPromptContext` keeps **high-priority sections first**; **identity** and
 * **localization** may switch to compact one-line forms before they are dropped entirely. For layered assembly,
 * `assemblePromptLayers` trims tool text, then company text (see that function).
 */

export interface CompanyPromptContextOptions {
  /** Soft cap for `estimateApproximateTokenCount` over the returned company block. */
  maxApproxTokens: number;
  /**
   * Smaller numbers drop first under pressure. Identity/localization use high priority.
   * Default ordering is set in `buildCompanyPromptContext`.
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

function formatChannelSummary(config: CompanyConfig): string {
  const lines = config.marketing.channels
    .filter((c) => c.enabled)
    .map((c) => `- ${c.platform}${c.label ? ` (${c.label})` : ""}`);
  return lines.length > 0 ? lines.join("\n") : "(no enabled channels configured)";
}

/**
 * Builds non-secret, tenant-scoped context suitable for system or developer messages.
 * Secrets (API keys, tokens) must never appear in `CompanyConfig`; this function only serializes whitelisted fields.
 */
export function buildCompanyPromptContextSections(config: CompanyConfig): PromptContextSection[] {
  const priorities = DEFAULT_PRIORITY;

  const sections: PromptContextSection[] = [
    {
      key: "identity",
      priority: priorities.identity,
      text: `Company: ${config.companyName} (id: ${config.companyId})`,
    },
    {
      key: "localization",
      priority: priorities.localization,
      text: `Locale: language=${config.localization.language}, region=${config.localization.region}, timezone=${config.localization.timezone}, currency=${config.localization.currency}`,
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
    text: `AI preferences: provider=${config.ai.provider}, primaryModel=${config.ai.primaryModel}`,
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
 * Returns a single newline-joined company context block respecting `maxApproxTokens`, dropping lowest-priority
 * sections first until the estimate fits.
 */
function compactSection(
  config: CompanyConfig,
  section: PromptContextSection,
): PromptContextSection | undefined {
  if (section.key === "identity") {
    return { ...section, text: `Company: ${config.companyName}` };
  }
  if (section.key === "localization") {
    return {
      ...section,
      text: `Locale: ${config.localization.language}/${config.localization.region}`,
    };
  }
  return undefined;
}

export function buildCompanyPromptContext(
  config: CompanyConfig,
  options: CompanyPromptContextOptions,
): {
  text: string;
  sectionsIncluded: PromptContextSectionKey[];
  sectionsDropped: PromptContextSectionKey[];
} {
  const sections = applyPriorityOverrides(
    buildCompanyPromptContextSections(config),
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
  companyContext: string;
  userTask: string;
  toolContext?: string;
  maxApproxTokensTotal: number;
}

/**
 * Concatenates layers in documented precedence and trims only `toolContext`, then `companyContext` (by whole string)
 * to satisfy `maxApproxTokensTotal`. System policy and user task are never truncated here.
 */
export function assemblePromptLayers(input: AssembledPromptLayersInput): {
  systemMessage: string;
  userMessage: string;
  approxTokens: { system: number; user: number; total: number };
  truncation: { toolContextTrimmed: boolean; companyContextTrimmed: boolean };
} {
  const tool = input.toolContext ?? "";
  const company = input.companyContext;
  const user = input.userTask;

  let toolUsed = tool;
  let companyUsed = company;

  const buildSystem = (): string =>
    [input.systemPolicy, companyUsed].filter((x) => x.length > 0).join("\n\n");

  const buildUser = (): string => {
    const head = toolUsed.length > 0 ? `Context:\n${toolUsed}\n\n` : "";
    return `${head}Task:\n${user}`;
  };

  const totalTokens = (): number =>
    estimateApproximateTokenCount(buildSystem()) + estimateApproximateTokenCount(buildUser());

  let toolTrimmed = false;
  let companyTrimmed = false;

  while (totalTokens() > input.maxApproxTokensTotal) {
    if (toolUsed.length > 0) {
      toolUsed = toolUsed.slice(0, Math.max(0, Math.floor(toolUsed.length * 0.7)));
      toolTrimmed = true;
      continue;
    }
    if (companyUsed.length > 0) {
      companyUsed = companyUsed.slice(0, Math.max(0, Math.floor(companyUsed.length * 0.7)));
      companyTrimmed = true;
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
    truncation: { toolContextTrimmed: toolTrimmed, companyContextTrimmed: companyTrimmed },
  };
}
