import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { companyConfigSchema, type CompanyConfig } from "./schemas/company";

const memoryCache = new Map<string, CompanyConfig>();

export interface LoadCompanyConfigOptions {
  /** Root directory containing `<companyId>.json` files. */
  configDir?: string;
  /** Skip in-memory cache (useful for tests). */
  bypassCache?: boolean;
}

function resolveConfigDir(explicit?: string): string {
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

/**
 * Loads and validates a company configuration from disk (`<companyId>.json`).
 * Results are cached in memory unless `bypassCache` is true.
 */
export async function loadCompanyConfig(
  companyId: string,
  options: LoadCompanyConfigOptions = {},
): Promise<CompanyConfig> {
  if (!options.bypassCache && memoryCache.has(companyId)) {
    const cached = memoryCache.get(companyId);
    if (cached) {
      return cached;
    }
  }

  const dir = resolveConfigDir(options.configDir);
  const filePath = path.join(dir, `${companyId}.json`);
  const raw = await readFile(filePath, "utf-8");
  const parsedJson: unknown = JSON.parse(raw);
  const validated = companyConfigSchema.parse(parsedJson);

  if (validated.companyId !== companyId) {
    throw new Error(
      `Configuration file ${filePath} has companyId ${validated.companyId} but expected ${companyId}`,
    );
  }

  if (!options.bypassCache) {
    memoryCache.set(companyId, validated);
  }

  return validated;
}

export function clearCompanyConfigCache(): void {
  memoryCache.clear();
}
