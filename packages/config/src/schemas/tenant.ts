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
      insights: z
        .object({
          types: z
            .array(
              z.object({
                id: z.string(),
                name: z.string(),
                description: z.string().optional(),
                category: z.string().optional(),
                defaultPeriod: z.string().optional(),
              }),
            )
            .default([]),
          metricClasses: z
            .array(
              z.object({
                id: z.string(),
                name: z.string(),
                unit: z.string().optional(),
              }),
            )
            .default([]),
          periods: z
            .array(
              z.object({
                id: z.string(),
                name: z.string(),
                durationDays: z.number().optional(),
              }),
            )
            .default([]),
          domains: z
            .array(
              z.object({
                id: z.string(),
                name: z.string(),
                color: z.string().optional(),
              }),
            )
            .default([]),
          detailLevelOptions: z
            .array(
              z.object({
                value: z.string(),
                labelKey: z.string(),
                order: z.number().optional(),
              }),
            )
            .default([]),
          frequencyOptions: z
            .array(
              z.object({
                value: z.string(),
                labelKey: z.string(),
                order: z.number().optional(),
              }),
            )
            .default([]),
          formatOptions: z
            .array(
              z.object({
                value: z.string(),
                labelKey: z.string(),
                order: z.number().optional(),
              }),
            )
            .default([]),
        })
        .default({
          types: [],
          metricClasses: [],
          periods: [],
          domains: [],
          detailLevelOptions: [],
          frequencyOptions: [],
          formatOptions: [],
        }),
    })
    .optional(),
});

export type TenantConfig = z.infer<typeof tenantConfigSchema>;
