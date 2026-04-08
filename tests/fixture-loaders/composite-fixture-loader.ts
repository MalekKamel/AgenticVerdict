import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export interface FixtureLayer {
  /** Path relative to the fixtures root (e.g. `base/tenants/default-en-ltr.json`). */
  readonly relativePath: string;
  /** Lower merges first; higher priority wins on conflicts. */
  readonly priority: number;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Deep-merge JSON-like objects; arrays and primitives from `override` replace `base`.
 */
export function deepMergeRecords(
  base: Record<string, unknown>,
  override: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(override)) {
    const existing = out[key];
    if (isPlainObject(existing) && isPlainObject(value)) {
      out[key] = deepMergeRecords(existing, value);
    } else {
      out[key] = value;
    }
  }
  return out;
}

export function defaultFixturesRoot(): string {
  const moduleDir = dirname(fileURLToPath(import.meta.url));
  return join(moduleDir, "..", "fixtures");
}

async function readJsonFixture(fullPath: string): Promise<Record<string, unknown>> {
  const raw = await readFile(fullPath, "utf8");
  const parsed: unknown = JSON.parse(raw);
  if (!isPlainObject(parsed)) {
    throw new Error(`Fixture must be a JSON object: ${fullPath}`);
  }
  return parsed;
}

/**
 * Layered JSON fixture loader for tenant / report static data (E2E Phase 2).
 */
export class CompositeFixtureLoader {
  constructor(private readonly fixturesRoot: string) {}

  get root(): string {
    return this.fixturesRoot;
  }

  async loadJsonRelative(relativePath: string): Promise<Record<string, unknown>> {
    const fullPath = join(this.fixturesRoot, relativePath);
    return readJsonFixture(fullPath);
  }

  /**
   * Merge layers in ascending priority order (low → high).
   */
  async loadMerged(layers: readonly FixtureLayer[]): Promise<Record<string, unknown>> {
    const sorted = [...layers].sort((a, b) => a.priority - b.priority);
    let merged: Record<string, unknown> = {};
    for (const layer of sorted) {
      const data = await this.loadJsonRelative(layer.relativePath);
      merged = deepMergeRecords(merged, data);
    }
    return merged;
  }
}
