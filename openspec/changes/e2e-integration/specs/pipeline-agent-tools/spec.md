## ADDED Requirements

### Requirement: Analysis agent tools
The analysis agent SHALL receive the following tools: `get_tenant_profile`, `get_business_rules`, `get_config`, `fetch_meta_metrics`, `fetch_ga4_metrics`, `fetch_gsc_metrics`, `fetch_gbp_metrics`, `fetch_tiktok_metrics`, `calculate_metrics`, and `compute_b2b_kpis_from_snapshots`. All tools SHALL be functional and return correct data for the current tenant context.

#### Scenario: Analysis agent receives platform fetch tools
- **WHEN** the analysis agent is initialized
- **THEN** it receives fetch tools for all platforms configured in the insight's connector selection

#### Scenario: Analysis agent receives tenant context tools
- **WHEN** the analysis agent is initialized
- **THEN** it receives `get_tenant_profile`, `get_business_rules`, and `get_config` tools with the current tenant's data

#### Scenario: Analysis agent receives metric calculation tools
- **WHEN** the analysis agent is initialized
- **THEN** it receives `calculate_metrics` and `compute_b2b_kpis_from_snapshots` tools

### Requirement: Insights agent tools
The insights agent SHALL receive the following tools: `get_config`, `analyze_trends`, and `statistical_analysis`. All tools SHALL operate on the structured analysis output from the previous pipeline stage.

#### Scenario: Insights agent receives analysis tools
- **WHEN** the insights agent is initialized
- **THEN** it receives `analyze_trends` and `statistical_analysis` tools configured with the analysis stage output

### Requirement: Verdict agent tools
The verdict agent SHALL receive the following tools: `get_tenant_profile`, `get_business_rules`, `generate_summary`, and `format_report`. All tools SHALL operate on the structured insights output from the previous pipeline stage.

#### Scenario: Verdict agent receives summary tools
- **WHEN** the verdict agent is initialized
- **THEN** it receives `generate_summary` and `format_report` tools configured with the insights stage output

### Requirement: Tool registry integration
The `createPipelineAgentTools()` function SHALL accept `platformDeps` and `tenantContextDeps` from options and use `createPhase4ToolRegistry()` to create tools per stage. Platform dependencies SHALL filter available platform fetch tools based on the insight's connector selection.

#### Scenario: Tools filtered by platform selection
- **WHEN** an insight is configured with only GA4 and Meta connectors
- **THEN** the analysis agent receives only `fetch_ga4_metrics` and `fetch_meta_metrics` (not GSC, GBP, or TikTok)

#### Scenario: Tenant context injected into tools
- **WHEN** tools are created with tenant context dependencies
- **THEN** all tools receive the correct tenant ID and can access tenant-scoped data

### Requirement: Agent configuration options usage
The `createPipelineAgentConfig()` function SHALL use all provided options: `tenantName` SHALL appear in the system message, `promptVars` SHALL be injected into agent variables, `templateVersion` SHALL be used for prompt template selection, `platformDeps` SHALL influence tool availability, and `tenantContextDeps` SHALL influence tenant-specific configuration.

#### Scenario: Tenant name in system message
- **WHEN** agent config is created with `tenantName: "Acme Corp"`
- **THEN** the system message includes "Acme Corp" for personalized analysis

#### Scenario: Prompt vars injected
- **WHEN** agent config is created with `promptVars: { industry: "retail", focus: "conversion" }`
- **THEN** the agent variables include these values for context-aware prompting
