/**
 * Shared test scenario types for orchestrator and scenario runner.
 * Canonical source for scenario category and mock data scenario enums.
 */

export const SCENARIO_CATEGORIES = [
  "generation",
  "integration",
  "delivery",
  "scheduling",
  "system",
] as const;
export type ScenarioCategory = (typeof SCENARIO_CATEGORIES)[number];

export const MOCK_SCENARIOS = ["normal", "high-volume", "zero-conversions", "error"] as const;
export type MockDataScenario = (typeof MOCK_SCENARIOS)[number];
