## Context

The insights feature is one of the core dashboard surfaces in AgenticVerdict, allowing users to create, edit, list, and view AI-generated insights from connected data sources. The current implementation in `apps/frontend/src/features/insights/` was built quickly with hardcoded values for AI models, business domains, form defaults, and UI strings.

Current state issues:

- 8 hardcoded data arrays duplicated across create/edit pages
- 60+ hardcoded English strings across 10+ component files
- 4 structural bugs (hook-in-loop, unscoped queries, no-op callbacks, loose schema types)
- No tenant-level customization of defaults or configuration
- No i18n support — blocks internationalization roadmap

The backend already has the infrastructure needed: `SUPPORTED_MODELS` map, `ProviderFactory`, `TenantConfig` table, and connector domain tags. This change wires them up through new tRPC endpoints and refactors the frontend to consume them.

## Goals / Non-Goals

**Goals:**

- Eliminate all hardcoded static data from insights frontend components
- Serve AI models, defaults, domains, and tenant config via authenticated tRPC endpoints
- Migrate all UI strings to i18n keys under `insights` namespace
- Fix structural bugs (hook-in-loop, unscoped queries, no-op callbacks, loose types)
- Maintain full backward compatibility — no breaking changes to existing insight CRUD operations
- Enforce multi-tenancy: all new endpoints use `authedProcedureWithPermission` + `dbScoped()`

**Non-Goals:**

- No changes to the insight generation pipeline or AI provider integration
- No new database schema changes (uses existing `TenantConfig` and connector tables)
- No changes to the report generation or delivery mechanism
- No redesign of the insight wizard UI — only data source and i18n changes
- No changes to existing tRPC endpoint signatures (only additions)

## Decisions

### 1. Four separate tRPC endpoints vs. single config endpoint

**Decision:** Create four focused endpoints (`ai.models`, `ai.defaults`, `connector.domains`, `tenant.config`) rather than a single `/insights/config` endpoint.

**Rationale:** Each endpoint has different caching characteristics (models: 30min, others: 5min), different tenant scoping rules (models are platform-wide, others are tenant-scoped), and different authorization needs. Separate endpoints enable optimal React Query `staleTime` configuration and avoid over-fetching.

**Alternatives considered:** Single config endpoint would simplify frontend calls but would force uniform caching and couple unrelated data sources.

### 2. i18n namespace: `insights` vs. `features.insights`

**Decision:** Use `insights` as the i18n namespace (flat, not nested under `features`).

**Rationale:** The existing codebase uses flat namespaces (e.g., `useTranslations("common")`, `useTranslations("dashboard")`). The `insights` namespace aligns with this convention and keeps key paths short: `insights.create.steps.basicInfo.nameLabel`.

### 3. Validation error codes vs. i18n-aware validation

**Decision:** Keep `validation.ts` returning error code strings (e.g., `"NAME_REQUIRED"`), map to i18n keys at display time in form components.

**Rationale:** Validation logic should remain pure and locale-agnostic. The mapping layer in form components can use `t()` to translate codes to localized messages. This follows the existing pattern in the codebase and keeps validation testable without i18n setup.

### 4. Prop-driven dropdown options vs. schema-derived options

**Decision:** Parent components derive options from schema enums and pass as props to step components (e.g., `detailLevelOptions`, `frequencyOptions`, `formatOptions`).

**Rationale:** Step components become pure presentation components, improving testability and reusability. Schema enums remain the single source of truth. This avoids duplicating option lists in both schemas and UI components.

### 5. `connector.domains` derivation strategy

**Decision:** Derive domains from tenant's active connectors' `domainTags` field, aggregating and counting connectors per domain.

**Rationale:** This ensures the domain list always reflects what the tenant actually has connected, preventing users from selecting domains with no available data. The backend already stores `domainTags` on connectors.

## Risks / Trade-offs

| Risk                                                     | Impact                                | Mitigation                                                                                               |
| -------------------------------------------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| New endpoints add latency to wizard load                 | UX degradation if endpoints are slow  | Use React Query `staleTime` for aggressive caching; parallelize independent queries                      |
| i18n migration misses strings                            | Partial localization, inconsistent UX | Audit against the 60+ string inventory from the implementation plan; add lint rule for hardcoded strings |
| `connector.domains` returns empty for new tenants        | Wizard shows no domain options        | Fallback to full domain list from business-architecture §2.3 when no active connectors exist             |
| Tightening `selectedMetrics` schema breaks existing data | Validation errors on legacy insights  | Run data migration or add backward-compatible parsing layer if existing records have non-string metrics  |
| `tenant.config` endpoint exposes sensitive config        | Information leak                      | Explicitly whitelist config fields in response; never return internal flags or credentials               |

## Migration Plan

**Deployment order:**

1. Deploy backend endpoints first (backward-compatible additions)
2. Deploy frontend with new hooks alongside existing hardcoded values (feature flag optional)
3. Switch pages to use hooks, remove hardcoded constants
4. Deploy i18n keys and updated components
5. Remove fallback hardcoded values after verification

**Rollback:** All changes are additive. Rollback = revert frontend to use hardcoded values; backend endpoints can remain (unused).

**Open Questions:**

- Should `ai.defaults` fall back to schema defaults when `TenantConfig` has no AI settings? (Assumed yes)
- Should `shareLinkExpiryHours` have a server-side maximum to prevent abuse? (Recommend 30-day cap)
