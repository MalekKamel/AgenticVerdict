import { z } from "zod";

import {
  tenantAIConfigSchema,
  defaultTenantAIConfig,
} from "@agenticverdict/core/tenant/config-schema";

// Re-export the comprehensive TenantAIConfig schema from core
export const aiConfigSchema = tenantAIConfigSchema;

export type AiConfig = z.infer<typeof aiConfigSchema>;

// Re-export default config for convenience
export { defaultTenantAIConfig };
