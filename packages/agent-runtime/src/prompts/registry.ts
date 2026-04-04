import { PRODUCTION_PROMPT_TEMPLATES } from "./library";
import { PromptTemplateError } from "./types";
import type { PromptTemplateRecord } from "./types";
import { promptTemplateRecordSchema } from "./types";

function compareSemverDesc(a: string, b: string): number {
  const pa = a.split(".").map((x) => {
    const n = Number.parseInt(x, 10);
    return Number.isFinite(n) ? n : 0;
  });
  const pb = b.split(".").map((x) => {
    const n = Number.parseInt(x, 10);
    return Number.isFinite(n) ? n : 0;
  });
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const da = pa[i] ?? 0;
    const db = pb[i] ?? 0;
    if (da !== db) {
      return db - da;
    }
  }
  return 0;
}

function buildRegistry(records: readonly PromptTemplateRecord[]): {
  byKey: ReadonlyMap<string, PromptTemplateRecord>;
  byId: ReadonlyMap<string, readonly PromptTemplateRecord[]>;
} {
  const byKey = new Map<string, PromptTemplateRecord>();
  const byId = new Map<string, PromptTemplateRecord[]>();

  for (const raw of records) {
    const r = promptTemplateRecordSchema.parse(raw);
    const key = `${r.id}@${r.version}`;
    if (byKey.has(key)) {
      throw new Error(`Duplicate prompt template key "${key}"`);
    }
    byKey.set(key, r);
    const list = byId.get(r.id);
    if (list) {
      list.push(r);
    } else {
      byId.set(r.id, [r]);
    }
  }

  for (const [id, list] of byId) {
    list.sort((x, y) => compareSemverDesc(x.version, y.version));
    byId.set(id, list);
  }

  return { byKey, byId };
}

const { byKey: PROMPT_REGISTRY_BY_KEY, byId: PROMPT_REGISTRY_BY_ID } = buildRegistry(
  PRODUCTION_PROMPT_TEMPLATES,
);

export function listPromptTemplateIds(): string[] {
  return [...PROMPT_REGISTRY_BY_ID.keys()].sort();
}

/** Newest-first version history for a template id. */
export function getPromptTemplateHistory(templateId: string): readonly PromptTemplateRecord[] {
  const list = PROMPT_REGISTRY_BY_ID.get(templateId);
  if (!list || list.length === 0) {
    throw new PromptTemplateError(`Unknown prompt template id "${templateId}"`, "unknown_template");
  }
  return list;
}

/**
 * Resolves a template by id and optional semver. Without `version`, selects the latest registered version.
 */
export function resolvePromptTemplate(templateId: string, version?: string): PromptTemplateRecord {
  const history = PROMPT_REGISTRY_BY_ID.get(templateId);
  if (!history || history.length === 0) {
    throw new PromptTemplateError(`Unknown prompt template id "${templateId}"`, "unknown_template");
  }
  if (version === undefined) {
    const latest = history[0];
    if (!latest) {
      throw new PromptTemplateError(
        `Unknown prompt template id "${templateId}"`,
        "unknown_template",
      );
    }
    return latest;
  }
  const key = `${templateId}@${version}`;
  const hit = PROMPT_REGISTRY_BY_KEY.get(key);
  if (!hit) {
    throw new PromptTemplateError(
      `Unknown prompt template version "${templateId}@${version}"`,
      "unknown_template",
    );
  }
  return hit;
}

export function listPromptTemplatesByType(
  type: PromptTemplateRecord["type"],
): readonly PromptTemplateRecord[] {
  return PRODUCTION_PROMPT_TEMPLATES.filter((t) => t.type === type);
}
