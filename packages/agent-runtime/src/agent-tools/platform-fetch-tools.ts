import type {
  DateRangeIso,
  NormalizedPlatformSnapshot,
  PlatformAdapter,
} from "@agenticverdict/platform-adapters";
import { parseNormalizedPlatformSnapshot } from "@agenticverdict/platform-adapters";
import type { PlatformType } from "@agenticverdict/types";

import type { AgentInvocationContext, ITool } from "../interfaces";
import { defineTool } from "../tools";
import { AgentToolError } from "./agent-tool-error";
import { dateRangeToolInputSchema, parseToolArgs } from "./agent-tool-schemas";

export interface PlatformFetchToolDeps {
  getAdapter(platform: PlatformType): PlatformAdapter;
  /** Optional hook to attach credentials before fetch (required for adapters that gate on authenticate). */
  authenticateAdapter?: (adapter: PlatformAdapter) => Promise<void>;
}

function createSinglePlatformTool(
  platform: PlatformType,
  name: string,
  description: string,
  deps: PlatformFetchToolDeps,
): ITool {
  return defineTool({
    name,
    description,
    execute: async (args, ctx: AgentInvocationContext) => {
      void ctx;
      const range = parseToolArgs(dateRangeToolInputSchema, args);
      if (range.startInclusive > range.endInclusive) {
        throw new AgentToolError(
          "validation_failed",
          "startInclusive must be on or before endInclusive",
        );
      }
      const adapter = deps.getAdapter(platform);
      try {
        if (deps.authenticateAdapter) {
          await deps.authenticateAdapter(adapter);
        }
        const raw = await adapter.fetchMetrics(range);
        const normalized = adapter.normalizeData(raw, range);
        const checked = parseNormalizedPlatformSnapshot(normalized);
        if (!checked.success) {
          throw new AgentToolError(
            "execution_failed",
            "Normalized platform snapshot failed schema validation",
            {
              cause: checked.error,
            },
          );
        }
        return checked.data;
      } catch (err) {
        if (err instanceof AgentToolError) {
          throw err;
        }
        throw new AgentToolError("execution_failed", "Platform metrics fetch failed", {
          cause: err,
        });
      }
    },
  });
}

export interface ParallelNormalizedPlatformFetchResult {
  platform: PlatformType;
  snapshot: NormalizedPlatformSnapshot;
}

/**
 * Fetches and normalizes several platforms concurrently (tasks.md 6.6 parallelization).
 * Each adapter errors independently; the first rejection fails the aggregate promise.
 */
export async function fetchNormalizedSnapshotsForPlatformsParallel(
  platforms: readonly PlatformType[],
  range: DateRangeIso,
  deps: PlatformFetchToolDeps,
): Promise<ParallelNormalizedPlatformFetchResult[]> {
  return Promise.all(
    platforms.map(async (platform): Promise<ParallelNormalizedPlatformFetchResult> => {
      const adapter = deps.getAdapter(platform);
      try {
        if (deps.authenticateAdapter) {
          await deps.authenticateAdapter(adapter);
        }
        const raw = await adapter.fetchMetrics(range);
        const normalized = adapter.normalizeData(raw, range);
        const checked = parseNormalizedPlatformSnapshot(normalized);
        if (!checked.success) {
          throw new AgentToolError(
            "execution_failed",
            "Normalized platform snapshot failed schema validation",
            {
              cause: checked.error,
            },
          );
        }
        return { platform, snapshot: checked.data };
      } catch (err) {
        if (err instanceof AgentToolError) {
          throw err;
        }
        throw new AgentToolError("execution_failed", "Platform metrics fetch failed", {
          cause: err,
        });
      }
    }),
  );
}

export function createPlatformFetchTools(deps: PlatformFetchToolDeps): ITool[] {
  return [
    createSinglePlatformTool(
      "meta",
      "fetch_meta_metrics",
      "Fetch Meta Ads metrics for a date range via the Phase 1 adapter (normalized snapshot).",
      deps,
    ),
    createSinglePlatformTool(
      "ga4",
      "fetch_ga4_metrics",
      "Fetch GA4 metrics for a date range via the Phase 1 adapter (normalized snapshot).",
      deps,
    ),
    createSinglePlatformTool(
      "gsc",
      "fetch_gsc_metrics",
      "Fetch Google Search Console metrics for a date range via the Phase 1 adapter (normalized snapshot).",
      deps,
    ),
    createSinglePlatformTool(
      "gbp",
      "fetch_gbp_metrics",
      "Fetch Google Business Profile metrics for a date range via the Phase 1 adapter (normalized snapshot).",
      deps,
    ),
    createSinglePlatformTool(
      "tiktok",
      "fetch_tiktok_metrics",
      "Fetch TikTok Ads metrics for a date range via the Phase 1 adapter (normalized snapshot).",
      deps,
    ),
  ];
}
