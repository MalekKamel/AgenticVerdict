import { z } from "zod";

export const featureFlagsConfigSchema = z.object({
  enableInsights: z.boolean(),
  enableVerdict: z.boolean(),
});

export type FeatureFlagsConfig = z.infer<typeof featureFlagsConfigSchema>;
