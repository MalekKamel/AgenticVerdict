import { configValidationErrorFromZod } from "./config-errors";
import { companyConfigSchema, type CompanyConfig } from "./schemas/company";

/**
 * Validates an untrusted payload (e.g. request body or admin import) against {@link companyConfigSchema}.
 */
export function parseCompanyConfigPayload(raw: unknown): CompanyConfig {
  const result = companyConfigSchema.safeParse(raw);
  if (!result.success) {
    throw configValidationErrorFromZod(result.error);
  }
  return result.data;
}

/**
 * Framework-agnostic guard: run before app listen / job start when config is assembled at runtime.
 */
export function assertValidCompanyConfig(raw: unknown): asserts raw is CompanyConfig {
  const result = companyConfigSchema.safeParse(raw);
  if (!result.success) {
    throw configValidationErrorFromZod(result.error);
  }
}
