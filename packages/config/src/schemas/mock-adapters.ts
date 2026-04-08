import { z } from "zod";

const binaryFlagSchema = z
  .enum(["0", "1"])
  .optional()
  .transform((value) => (value === undefined ? undefined : value === "1"));
const mockScenarioSchema = z.enum(["normal", "high-volume", "zero-conversions", "error"]);

export const mockAdapterEnvSchema = z.object({
  AGENTICVERDICT_USE_MOCK_ADAPTERS: binaryFlagSchema,
  AGENTICVERDICT_MOCK_META: binaryFlagSchema,
  AGENTICVERDICT_MOCK_GA4: binaryFlagSchema,
  AGENTICVERDICT_MOCK_GSC: binaryFlagSchema,
  AGENTICVERDICT_MOCK_GBP: binaryFlagSchema,
  AGENTICVERDICT_MOCK_TIKTOK: binaryFlagSchema,
  AGENTICVERDICT_MOCK_SEED: z
    .string()
    .optional()
    .transform((value) => (value ? Number.parseInt(value, 10) : undefined)),
  AGENTICVERDICT_MOCK_SCENARIO: mockScenarioSchema.optional(),
});

export type MockAdapterScenarioEnv = z.infer<typeof mockScenarioSchema>;
export type MockAdapterEnv = z.infer<typeof mockAdapterEnvSchema>;

export function parseMockAdapterEnv(env: NodeJS.ProcessEnv = process.env): MockAdapterEnv {
  return mockAdapterEnvSchema.parse(env) as MockAdapterEnv;
}
