import { z } from "zod";

/** Connectors that support mock adapters (aligned with `ConnectorType`). */
export const mockAdapterConnectorSchema = z.enum(["meta", "ga4", "gsc", "gbp", "tiktok"]);

export const runtimeConfigSchema = z.object({
  adapters: z.object({
    mocks: z.object({
      enabled: z.boolean(),
      connectors: z.array(mockAdapterConnectorSchema),
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
