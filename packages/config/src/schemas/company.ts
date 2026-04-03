import { z } from "zod";

import type { PlatformType } from "@agenticverdict/types";

const platformTypeSchema = z.enum([
  "meta",
  "ga4",
  "gsc",
  "gbp",
  "tiktok",
]) as z.ZodType<PlatformType>;

export const platformConfigSchema = z.object({
  platform: platformTypeSchema,
  enabled: z.boolean(),
});

export const companyConfigSchema = z.object({
  companyId: z.string().uuid(),
  companyName: z.string().min(1),
  localization: z.object({
    language: z.enum(["ar", "en", "fr"]),
    region: z.string().min(1),
    timezone: z.string().min(1),
    currency: z.string().min(1),
  }),
  marketing: z.object({
    channels: z.array(platformConfigSchema),
    kpis: z
      .array(
        z.object({
          id: z.string().min(1),
          name: z.string().min(1),
        }),
      )
      .optional(),
  }),
  ai: z.object({
    primaryModel: z.string().min(1),
    provider: z.enum(["anthropic", "openai"]),
  }),
  features: z.object({
    enableInsights: z.boolean(),
    enableVerdict: z.boolean(),
  }),
  business: z
    .object({
      products: z.array(z.string()),
      valueProps: z.array(z.string()),
      differentiators: z.array(z.string()),
    })
    .optional(),
});

export type CompanyConfig = z.infer<typeof companyConfigSchema>;
export type PlatformConfig = z.infer<typeof platformConfigSchema>;
