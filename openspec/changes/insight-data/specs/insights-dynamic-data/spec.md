## ADDED Requirements

### Requirement: AI Models Endpoint
The system MUST expose a `trpc.ai.models` query endpoint that returns all available AI models grouped by registered provider, sourced from `SUPPORTED_MODELS` and `ProviderFactory.listProviders()`.

#### Scenario: Returns models grouped by provider
- **WHEN** an authenticated user queries `ai.models`
- **THEN** the response contains a `providers` array with each provider's `id`, `name`, and `models` list
- **AND** each model entry includes `value`, `label`, and `recommended` boolean fields

#### Scenario: Platform-wide data with auth gate
- **WHEN** any authenticated user queries `ai.models`
- **THEN** the same model list is returned regardless of tenant (models are platform-wide)
- **AND** the endpoint uses `authedProcedure` to require authentication

### Requirement: AI Defaults Endpoint
The system MUST expose a `trpc.ai.defaults` query endpoint that returns tenant-level AI configuration defaults (model, quality, detailLevel), sourced from `TenantConfig` with schema-level fallbacks.

#### Scenario: Returns tenant-specific defaults
- **WHEN** an authenticated user queries `ai.defaults`
- **THEN** the response contains `model`, `quality`, and `detailLevel` from the tenant's `TenantConfig`
- **AND** the endpoint uses `authedProcedureWithPermission` and `dbScoped()` for tenant scoping

#### Scenario: Falls back to schema defaults
- **WHEN** a tenant has no AI configuration stored in `TenantConfig`
- **THEN** the endpoint returns schema-level default values
- **AND** no error is returned

### Requirement: Connector Domains Endpoint
The system MUST expose a `trpc.connector.domains` query endpoint that returns business domains derived from the tenant's active connectors' `domainTags`, with connector counts per domain.

#### Scenario: Returns domains from active connectors
- **WHEN** an authenticated user queries `connector.domains`
- **THEN** the response contains a `domains` array with each domain's `value`, `label`, and `connectorCount`
- **AND** only domains with at least one active connector are included
- **AND** the endpoint uses `authedProcedureWithPermission` and `dbScoped()` for tenant scoping

#### Scenario: Falls back to full domain list when no connectors
- **WHEN** a tenant has no active connectors
- **THEN** the endpoint returns the full domain list from business-architecture §2.3 (Marketing, Finance, Analytics, SEO, Social, Local)
- **AND** each domain has `connectorCount` of 0

### Requirement: Tenant Config Endpoint
The system MUST expose a `trpc.tenant.config` query endpoint that returns tenant configuration including `shareLinkExpiryHours` and `defaultAiModel`, with an explicit allowlist of exposed fields.

#### Scenario: Returns tenant configuration
- **WHEN** an authenticated user queries `tenant.config`
- **THEN** the response contains `shareLinkExpiryHours`, `defaultAiModel`, and other whitelisted config fields
- **AND** the endpoint uses `authedProcedureWithPermission` and `dbScoped()` for tenant scoping
- **AND** sensitive fields (credentials, internal flags) are excluded from the response

#### Scenario: Share link expiry has server-side maximum
- **WHEN** tenant config specifies a `shareLinkExpiryHours` value
- **THEN** the returned value is capped at 720 hours (30 days) maximum
- **AND** the minimum returned value is 1 hour

### Requirement: Frontend API Hooks
The system MUST provide React Query hooks (`useAiModels`, `useAiDefaults`, `useConnectorDomains`, `useTenantConfig`) in `features/insights/api/insight-api.ts` that consume the corresponding tRPC endpoints with appropriate `staleTime` configuration.

#### Scenario: useAiModels caches for 30 minutes
- **WHEN** `useAiModels()` is called
- **THEN** the query uses `staleTime: 30 * 60 * 1000` (30 minutes)
- **AND** the data is shared across all components using the hook

#### Scenario: Other hooks cache for 5 minutes
- **WHEN** `useAiDefaults()`, `useConnectorDomains()`, or `useTenantConfig()` is called
- **THEN** each query uses `staleTime: 5 * 60 * 1000` (5 minutes)
- **AND** the data is shared across all components using the hook
