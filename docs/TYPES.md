# Type Ownership Map

**Purpose:** Each concept has exactly **one canonical definition** in `@agenticverdict/types`. All other packages must import from there — never redefine, re-export, or alias.

## Canonical Type Locations

| Concept             | File                      | Type                                   | Const                                   | Schema                     |
| ------------------- | ------------------------- | -------------------------------------- | --------------------------------------- | -------------------------- |
| Connector platforms | `connector-types.ts`      | `ConnectorType`                        | `CONNECTOR_PLATFORMS`                   | `connectorTypeSchema`      |
| Sync frequency      | `connector-types.ts`      | `SyncFrequency`                        | `SYNC_FREQUENCIES`                      | `syncFrequencySchema`      |
| Insight types       | `insight.ts`              | `InsightType`                          | `INSIGHT_TYPES`                         | `insightTypeSchema`        |
| Insight status      | `insight.ts`              | `InsightStatus`                        | `INSIGHT_STATUSES`                      | `insightStatusSchema`      |
| DB run status       | `insight.ts`              | `InsightDbRunStatus`                   | `DB_RUN_STATUSES`                       | `insightDbRunStatusSchema` |
| Schedule frequency  | `insight-templates.ts`    | `ScheduleFrequency`                    | `SCHEDULE_FREQUENCIES`                  | `scheduleFrequencySchema`  |
| Pipeline status     | `pipeline-execution.ts`   | `PipelineStatus`                       | `PIPELINE_STATUSES`                     | `pipelineStatusSchema`     |
| AI provider types   | `ai-providers.ts`         | `AiProviderType`                       | `AI_PROVIDER_TYPES`                     | `aiProviderTypeSchema`     |
| AI provider status  | `ai-providers.ts`         | `AiProviderStatus`                     | `AI_PROVIDER_STATUSES`                  | `aiProviderStatusSchema`   |
| Config scope        | `ai-providers.ts`         | `ConfigScope`                          | `CONFIG_SCOPES`                         | `configScopeSchema`        |
| Cost tier           | `ai-providers.ts`         | `CostTier`                             | `COST_TIER`                             | `costTierSchema`           |
| Text direction      | `common.ts`               | `TextDirection`                        | —                                       | `textDirectionSchema`      |
| Sort direction      | `common.ts`               | `SortDirection`                        | `SORT_DIRECTIONS`                       | `sortDirectionSchema`      |
| Report formats      | `reports.ts`              | `ReportFormat`                         | `REPORT_FORMATS`                        | —                          |
| Verdict types       | `verdict.ts`              | `VerdictType`                          | `VERDICT_TYPES`                         | `verdictTypeSchema`        |
| Test scenarios      | `@agenticverdict/testing` | `ScenarioCategory`, `MockDataScenario` | `SCENARIO_CATEGORIES`, `MOCK_SCENARIOS` | —                          |

## Rules

1. **Never** define `z.enum([...])` with 3+ values inline — use a named constant.
2. **Never** define `"a" | "b" | "c"` unions with 3+ variants inline — import the type.
3. **Always** derive types from `as const` arrays: `type X = (typeof CONST)[number]`.
4. **Always** derive `z.enum` from the same const: `z.enum(CONST)`.
5. **No re-exports or aliases** — consumers import directly from `@agenticverdict/types`.

## Package-Specific Notes

- `@agenticverdict/config`: Imports `AiProviderType` and `aiProviderTypeSchema` directly from `@agenticverdict/types`.
- `@agenticverdict/agent-runtime`: Uses `Extract<AiProviderType, ...>` for implemented providers subset.
- `@agenticverdict/i18n`: Re-exports `TextDirection` from its own `rtl.ts` (canonical source is `@agenticverdict/types/common.ts`).
- `@agenticverdict/testing`: Owns test-only types (`ScenarioCategory`, `MockDataScenario`).
- `@agenticverdict/database`: Re-exports type-only aliases from `@agenticverdict/types` for schema convenience (e.g., `SyncFrequency` as `AlertTimeWindow` equivalent).

## Removed Aliases (Cleanup)

| Removed                                     | Was In                               | Replaced By                                  |
| ------------------------------------------- | ------------------------------------ | -------------------------------------------- |
| `ProviderTypeSchema` / `ProviderType`       | `config/schemas/provider-config.ts`  | `aiProviderTypeSchema` / `AiProviderType`    |
| `alertTimeWindowSchema` / `AlertTimeWindow` | `types/budget-alerts.ts`             | `syncFrequencySchema` / `SyncFrequency`      |
| `connectorAdapterTypes`                     | `data-connectors/adapter-factory.ts` | `CONNECTOR_PLATFORMS`                        |
| `ReportTextDirection`                       | `i18n/document-direction.ts`         | `TextDirection`                              |
| `dataSourcePlatformSchema`                  | `types/verdict.ts`                   | `connectorTypeSchema`                        |
| Orchestrator re-exports of scenario types   | `tests/orchestrator/index.ts`        | Direct import from `@agenticverdict/testing` |
