import { z } from "zod";

/** Platforms that support mock adapters (aligned with `PlatformType`). */
export const mockAdapterPlatformSchema = z.enum(["meta", "ga4", "gsc", "gbp", "tiktok"]);

export const runtimeConfigSchema = z.object({
  adapters: z.object({
    mocks: z.object({
      enabled: z.boolean(),
      platforms: z.array(mockAdapterPlatformSchema),
      scenarios: z.record(z.string()).optional(),
    }),
  }),
  features: z.object({
    enableNewReportGenerator: z.boolean().optional(),
    enableAdvancedAnalytics: z.boolean().optional(),
  }),
  experiments: z.record(z.string()).optional(),
});

export type RuntimeConfig = z.infer<typeof runtimeConfigSchema>;
