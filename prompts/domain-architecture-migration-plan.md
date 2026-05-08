# Domain Architecture Migration — Implementation Plan

## Context

The `BusinessDomain` entity has been implemented as a first-class, tenant-scoped database model with hierarchy support, AI provider configuration inheritance, and dedicated tRPC routers (`ai-domains`). The legacy connector wizard at `dashboard/connectors/add` still treats `domain` as a free-text string input (`ConnectorAddPage.tsx:325-330`), bypassing the new domain architecture entirely.

## Objective

Produce a comprehensive, file-level implementation plan that migrates every occurrence of the legacy string-based `domain` field to the new `BusinessDomain` architecture across the full stack.

## Scope

### 1. Audit & Inventory

- Identify all files that reference the legacy `domain: string` pattern (frontend forms, backend schemas, API payloads, database columns, types, and tests).
- Map each reference to its replacement in the new architecture (`BusinessDomain.id`, `business-domains.repository.ts`, `ai-domains` tRPC router, etc.).

### 2. Frontend Migration

- Replace the free-text domain `TextInput` in `ConnectorAddPage.tsx` with a domain selector component (dropdown, autocomplete, or domain picker) backed by `useAiDomains` hooks.
- Update `ConnectorConfig` interface: change `domain: string` → `domainId: string | null`.
- Update all downstream connector wizard steps (confirm summary, API calls) to use `domainId`.
- Ensure the domain selector respects tenant scope and displays inheritance indicators where applicable.

### 3. Backend Migration

- Update connector creation/update tRPC endpoints and service layer to accept `domainId` instead of `domain` string.
- Validate `domainId` against `business-domains.repository.ts` with tenant isolation.
- Update database schema if the connectors table still stores `domain` as a string column — migrate to `domain_id` FK referencing `business_domains`.

### 4. Data Migration

- Define a Drizzle migration strategy for any existing `domain` string columns → `domain_id` foreign keys.
- Handle backfill: map existing string values to matching `BusinessDomain` records or set to `NULL` where no match exists.

### 5. Testing

- Unit tests for updated connector services with `domainId` validation.
- Integration tests for connector creation flow with domain selection.
- E2E test covering the full wizard: platform → auth → domain selection → confirm.
- Tenant isolation tests verifying domain access is scoped correctly.

## Deliverable

Write the implementation plan to a single markdown file. The plan must include:

1. **File inventory** — every file to be modified, with current state and target state.
2. **Change sequence** — ordered steps with dependencies (database → backend → frontend → tests).
3. **Code snippets** — representative before/after examples for key changes.
4. **Migration script** — Drizzle migration outline for the string-to-FK column change.
5. **Risk assessment** — breaking changes, rollback strategy, and feature flag considerations.

## Constraints

- Maintain multi-tenant isolation on every change (tenant context propagation, RLS, tenant-scoped queries).
- Preserve backward compatibility during the transition — the connector creation API must not break existing integrations.
- Follow the project's command order: lint → typecheck → test → build.
- Zero `any` types; strict TypeScript mode.
