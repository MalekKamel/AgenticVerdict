import { z } from "zod";

import { aiConfigSchema } from "./ai";
import { featureFlagsConfigSchema } from "./feature-flags";
import { localizationConfigSchema } from "./localization";
import { b2bKpiProfileSchema } from "./marketing-b2b";
import { kpiConfigSchema, platformConfigSchema } from "./platform";

export const companyConfigSchema = z.object({
  companyId: z.string().uuid(),
  companyName: z.string().min(1),
  localization: localizationConfigSchema,
  marketing: z.object({
    channels: z.array(platformConfigSchema),
    kpis: z.array(kpiConfigSchema).optional(),
    b2bKpiProfile: b2bKpiProfileSchema.optional(),
  }),
  ai: aiConfigSchema,
  features: featureFlagsConfigSchema,
  business: z
    .object({
      products: z.array(z.string()),
      valueProps: z.array(z.string()),
      differentiators: z.array(z.string()),
    })
    .optional(),
});

export type CompanyConfig = z.infer<typeof companyConfigSchema>;
