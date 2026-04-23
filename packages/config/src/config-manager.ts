import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { configValidationErrorFromZod } from "./config-errors";
import { deepMergeConfig, readTenantConfigMergeFromEnv } from "./env-merge";
import { tenantConfigSchema, type TenantConfig } from "./schemas/tenant";

export interface ConfigManagerOptions {
  /** Root directory containing `<tenantId>.json` files. */
  configDir?: string;
  /** Time-to-live for cached entries in milliseconds (default five minutes). */
  defaultTtlMs?: number;
  /** Injected clock for tests. */
  now?: () => number;
}

export interface LoadTenantConfigOptions {
  /** Skip cache for this read. */
  bypassCache?: boolean;
}

interface CacheEntry {
  config: TenantConfig;
  expiresAt: number;
}

export function resolveConfigDir(explicit?: string): string {
  if (explicit) {
    return path.isAbsolute(explicit) ? explicit : path.join(process.cwd(), explicit);
  }
  const fromEnv = process.env.TENANT_CONFIG_DIR;
  if (fromEnv) {
    return path.isAbsolute(fromEnv) ? fromEnv : path.join(process.cwd(), fromEnv);
  }
  const candidates = [
    path.join(process.cwd(), "configs", "tenants"),
    path.join(process.cwd(), "..", "..", "configs", "tenants"),
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }
  return candidates[0] ?? path.join(process.cwd(), "configs", "tenants");
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

  invalidate(tenantId?: string): void {
    if (tenantId === undefined) {
      this.cache.clear();
      return;
    }
    this.cache.delete(tenantId);
  }

  /**
   * Loads `<tenantId>.json`, applies environment merge patches, validates, and caches.
   */
  async loadTenantConfig(
    tenantId: string,
    options: LoadTenantConfigOptions = {},
  ): Promise<TenantConfig> {
    const now = this.now();
    if (!options.bypassCache) {
      const hit = this.cache.get(tenantId);
      if (hit && hit.expiresAt > now) {
        return hit.config;
      }
    }

    const filePath = path.join(this.resolvedConfigDir, `${tenantId}.json`);
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
    const envPatch = readTenantConfigMergeFromEnv(tenantId);
    const merged = envPatch ? deepMergeConfig(base, envPatch) : base;

    const validated = tenantConfigSchema.safeParse(merged);
    if (!validated.success) {
      throw configValidationErrorFromZod(validated.error);
    }

    if (validated.data.tenantId !== tenantId) {
      throw new Error(
        `Configuration file ${filePath} has tenantId ${validated.data.tenantId} but expected ${tenantId}`,
      );
    }

    if (!options.bypassCache && this.ttlMs > 0) {
      this.cache.set(tenantId, {
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
export async function loadTenantConfig(
  tenantId: string,
  options: LoadTenantConfigOptions & Pick<ConfigManagerOptions, "configDir"> = {},
): Promise<TenantConfig> {
  const { configDir, ...loadOpts } = options;
  const manager =
    configDir !== undefined ? getManagerForConfigDir(configDir) : getDefaultConfigManager();
  return manager.loadTenantConfig(tenantId, loadOpts);
}

export function clearTenantConfigCache(): void {
  getDefaultConfigManager().invalidate();
  for (const manager of managersByResolvedDir.values()) {
    manager.invalidate();
  }
  managersByResolvedDir.clear();
}
