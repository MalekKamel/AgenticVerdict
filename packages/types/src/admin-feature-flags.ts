import { z } from "zod";

export const featureFlagAdminRowSchema = z.object({
  flagKey: z.string(),
  type: z.string(),
  description: z.string().nullable(),
  defaultValue: z.unknown(),
  resolvedValue: z.unknown(),
});

export type FeatureFlagAdminRow = z.infer<typeof featureFlagAdminRowSchema>;

export const featureFlagAdminListOutputSchema = z.array(featureFlagAdminRowSchema);
