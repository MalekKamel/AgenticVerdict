import { z } from "zod";

import { aiConfigSchema } from "./ai";
import { tenantUiSchema } from "./tenant-ui";
import { featureFlagsConfigSchema } from "./feature-flags";
import { localizationConfigSchema } from "./localization";
import { b2bKpiProfileSchema } from "./marketing-b2b";
import { kpiConfigSchema, platformConfigSchema } from "./platform";

export const tenantConfigSchema = z.object({
  tenantId: z.string().uuid(),
  tenantName: z.string().min(1),
  localization: localizationConfigSchema,
  marketing: z.object({
    channels: z.array(platformConfigSchema),
    kpis: z.array(kpiConfigSchema).optional(),
    b2bKpiProfile: b2bKpiProfileSchema.optional(),
  }),
  ai: aiConfigSchema,
  features: featureFlagsConfigSchema,
  ui: tenantUiSchema.optional(),
  business: z
    .object({
      products: z.array(z.string()),
      valueProps: z.array(z.string()),
      differentiators: z.array(z.string()),
    })
    .optional(),
});

export type TenantConfig = z.infer<typeof tenantConfigSchema>;
