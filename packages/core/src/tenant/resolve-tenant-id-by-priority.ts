import { isTenantUuid as isCoreTenantUuid } from "../tenant-resolution";

export function isTenantUuid(value: string | null | undefined): value is string {
  return isCoreTenantUuid(value);
}

export function resolveTenantIdByPriority(
  ...candidates: Array<string | null | undefined>
): string | undefined {
  for (const candidate of candidates) {
    if (isTenantUuid(candidate)) {
      return candidate.trim();
    }
  }
  return undefined;
}
