import { z } from "zod";

/** Optional JSON beside the app or in userData; overrides Vite-baked `VITE_PUBLIC_API_URL` in the renderer. */
export const desktopRuntimeConfigSchema = z.object({
  apiBaseUrl: z.string().url().optional(),
});

export type DesktopRuntimeConfig = z.infer<typeof desktopRuntimeConfigSchema>;
