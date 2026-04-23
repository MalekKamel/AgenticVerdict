import { configValidationErrorFromZod } from "./config-errors";
import { tenantConfigSchema, type TenantConfig } from "./schemas/tenant";

/**
 * Validates an untrusted payload (e.g. request body or admin import) against {@link tenantConfigSchema}.
 */
export function parseTenantConfigPayload(raw: unknown): TenantConfig {
  const result = tenantConfigSchema.safeParse(raw);
  if (!result.success) {
    throw configValidationErrorFromZod(result.error);
  }
  return result.data;
}

/**
 * Framework-agnostic guard: run before app listen / job start when config is assembled at runtime.
 */
export function assertValidTenantConfig(raw: unknown): asserts raw is TenantConfig {
  const result = tenantConfigSchema.safeParse(raw);
  if (!result.success) {
    throw configValidationErrorFromZod(result.error);
  }
}
