import { z } from "zod";

export const localizationConfigSchema = z.object({
  language: z.enum(["ar", "en", "fr"]),
  region: z.string().min(1),
  timezone: z.string().min(1),
  currency: z.string().min(1),
});

export type LocalizationConfig = z.infer<typeof localizationConfigSchema>;
