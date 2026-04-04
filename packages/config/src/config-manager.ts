import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { configValidationErrorFromZod } from "./config-errors";
import { deepMergeConfig, readCompanyConfigMergeFromEnv } from "./env-merge";
import { companyConfigSchema, type CompanyConfig } from "./schemas/company";

export interface ConfigManagerOptions {
  /** Root directory containing `<companyId>.json` files. */
  configDir?: string;
  /** Time-to-live for cached entries in milliseconds (default five minutes). */
  defaultTtlMs?: number;
  /** Injected clock for tests. */
  now?: () => number;
}

export interface LoadCompanyConfigOptions {
  /** Skip cache for this read. */
  bypassCache?: boolean;
}

interface CacheEntry {
  config: CompanyConfig;
  expiresAt: number;
}

export function resolveConfigDir(explicit?: string): string {
  if (explicit) {
    return path.isAbsolute(explicit) ? explicit : path.join(process.cwd(), explicit);
  }
  const fromEnv = process.env.COMPANY_CONFIG_DIR;
  if (fromEnv) {
    return path.isAbsolute(fromEnv) ? fromEnv : path.join(process.cwd(), fromEnv);
  }
  const candidates = [
    path.join(process.cwd(), "configs", "companies"),
    path.join(process.cwd(), "..", "..", "configs", "companies"),
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }
  return candidates[0] ?? path.join(process.cwd(), "configs", "companies");
}

const DEFAULT_TTL_MS = 300_000;

export class ConfigManager {
  private readonly resolvedConfigDir: string;
  private readonly ttlMs: number;
  private readonly now: () => number;
  private readonly cache = new Map<string, CacheEntry>();

  constructor(options: ConfigManagerOptions = {}) {
    this.resolvedConfigDir = resolveConfigDir(options.configDir);
    this.ttlMs = options.defaultTtlMs ?? DEFAULT_TTL_MS;
    this.now = options.now ?? (() => Date.now());
  }

  getConfigDir(): string {
    return this.resolvedConfigDir;
  }

  invalidate(companyId?: string): void {
    if (companyId === undefined) {
      this.cache.clear();
      return;
    }
    this.cache.delete(companyId);
  }

  /**
   * Loads `<companyId>.json`, applies environment merge patches, validates, and caches.
   */
  async loadCompanyConfig(
    companyId: string,
    options: LoadCompanyConfigOptions = {},
  ): Promise<CompanyConfig> {
    const now = this.now();
    if (!options.bypassCache) {
      const hit = this.cache.get(companyId);
      if (hit && hit.expiresAt > now) {
        return hit.config;
      }
    }

    const filePath = path.join(this.resolvedConfigDir, `${companyId}.json`);
    const raw = await readFile(filePath, "utf-8");
    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(raw) as unknown;
    } catch (cause) {
      throw new Error(`Failed to parse JSON configuration at ${filePath}`, { cause });
    }

    if (typeof parsedJson !== "object" || parsedJson === null || Array.isArray(parsedJson)) {
      throw new Error(`Configuration file ${filePath} must contain a JSON object`);
    }

    const base = parsedJson as Record<string, unknown>;
    const envPatch = readCompanyConfigMergeFromEnv(companyId);
    const merged = envPatch ? deepMergeConfig(base, envPatch) : base;

    const validated = companyConfigSchema.safeParse(merged);
    if (!validated.success) {
      throw configValidationErrorFromZod(validated.error);
    }

    if (validated.data.companyId !== companyId) {
      throw new Error(
        `Configuration file ${filePath} has companyId ${validated.data.companyId} but expected ${companyId}`,
      );
    }

    if (!options.bypassCache && this.ttlMs > 0) {
      this.cache.set(companyId, {
        config: validated.data,
        expiresAt: now + this.ttlMs,
      });
    }

    return validated.data;
  }
}

let defaultManager: ConfigManager | undefined;

const managersByResolvedDir = new Map<string, ConfigManager>();

export function getDefaultConfigManager(): ConfigManager {
  defaultManager ??= new ConfigManager();
  return defaultManager;
}

function getManagerForConfigDir(configDir: string): ConfigManager {
  const resolved = resolveConfigDir(configDir);
  let manager = managersByResolvedDir.get(resolved);
  if (!manager) {
    manager = new ConfigManager({ configDir: resolved });
    managersByResolvedDir.set(resolved, manager);
  }
  return manager;
}

/**
 * Loads using the default {@link ConfigManager}, or a directory-scoped manager when `configDir` is set.
 */
export async function loadCompanyConfig(
  companyId: string,
  options: LoadCompanyConfigOptions & Pick<ConfigManagerOptions, "configDir"> = {},
): Promise<CompanyConfig> {
  const { configDir, ...loadOpts } = options;
  const manager =
    configDir !== undefined ? getManagerForConfigDir(configDir) : getDefaultConfigManager();
  return manager.loadCompanyConfig(companyId, loadOpts);
}

export function clearCompanyConfigCache(): void {
  getDefaultConfigManager().invalidate();
  for (const manager of managersByResolvedDir.values()) {
    manager.invalidate();
  }
  managersByResolvedDir.clear();
}
