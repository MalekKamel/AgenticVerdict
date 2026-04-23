# Frontend Auth SEO Tenant Tenant Runtime Implementation Plan

## Objective

Ensure auth-route SEO metadata under `apps/frontend/src/routes/$locale/auth` uses tenant-aware runtime tenant identity instead of hardcoded locale-brand strings, aligned with `TenantConfig.tenantName` in `packages/config/src/schemas/tenant.ts`.

## Business and Multi-Tenant Context

- The product is multi-tenant and configuration-driven; brand identity must come from tenant configuration, not static frontend content.
- Auth routes are public-entry surfaces and can be reached before authenticated tenant context is fully established.
- SEO metadata must remain localized while still representing the current tenant brand whenever tenant context is available.

## Current-State Analysis

### Existing architecture

- Auth route metadata is centralized through `buildAuthSeoHead(matches, routeKey)`.
- The `/$locale` route loader provides localized message bundles used by auth metadata generation.
- Tenant identity already exists in frontend runtime patterns (`TenantProvider`, `x-tenant-id` forwarding, tenant branding query path).

### Gap

- `auth.seo.*` locale strings were authored with hardcoded `Masafh` literals.
- SEO builder consumed these strings as static values with no tenant-aware interpolation.

## Design Principles

1. **Centralized metadata generation**: keep all auth route `<head>` behavior in one utility.
2. **Runtime-first tenant branding**: prefer tenant-derived `tenantName` from config at request time.
3. **Localized templates**: keep translations language-specific while replacing brand literals with `{brand}` placeholder tokens.
4. **Safe fallback chain**: avoid null/empty values and prevent broken SEO output.

## Implemented Runtime Flow

1. `/$locale` loader calls `fetchCurrentTenantTenantName()`.
2. Server function reads tenant context from:
   - request header `x-tenant-id` (primary), then
   - `VITE_PUBLIC_DEFAULT_TENANT_ID` (fallback).
3. Server function loads tenant config via `loadTenantConfig(tenantId)` and returns `tenantName`.
4. Loader returns `{ locale, messages, tenantName }`.
5. `buildAuthSeoHead` resolves brand name with fallback order:
   - `loaderData.tenantName`
   - `messages.auth.layout.brandName`
   - `"AgenticVerdict"`
6. SEO strings use `{brand}` interpolation in title/description.

## Files Changed

- `apps/frontend/src/lib/tenant/fetch-current-tenant-name.ts` (new)
- `apps/frontend/src/routes/$locale/route.tsx`
- `apps/frontend/src/lib/auth/build-auth-seo-head.ts`
- `apps/frontend/messages/en.json`
- `apps/frontend/messages/ar.json`
- `apps/frontend/messages/fr.json`
- `apps/frontend/src/lib/auth/build-auth-seo-head.test.ts` (new)
- `apps/frontend/src/vite-env.d.ts`

## Risk Assessment and Mitigations

- **Missing tenant id on public routes**  
  Mitigation: fallback to locale brand name, then platform default.

- **Unresolved placeholder token leaks**  
  Mitigation: interpolation implemented centrally in SEO builder; tests verify substitution behavior.

- **Config read failures (missing file/invalid tenant)**  
  Mitigation: server function catches failures and returns undefined to trigger fallback chain.

- **Locale regressions**  
  Mitigation: `i18n:validate` run after key-content changes.

## Verification Checklist

- [x] Frontend typecheck passes.
- [x] Locale key validation passes.
- [x] Unit tests cover runtime tenant-name precedence and fallback behavior for auth SEO builder.
- [x] Auth route metadata remains centralized with `robots: noindex, nofollow`.

## Validation Evidence

- `pnpm --filter @agenticverdict/frontend run typecheck` -> pass
- `pnpm --filter @agenticverdict/frontend run i18n:validate` -> pass
- `pnpm --filter @agenticverdict/frontend exec vitest run src/lib/auth/build-auth-seo-head.test.ts` -> pass

## Follow-Up Recommendations

1. Add an integration test for SSR/public-request header propagation of `x-tenant-id` into auth page head tags.
2. Consider exposing a dedicated public tenant bootstrap endpoint to avoid filesystem config reads from frontend server functions in future deployment topologies.
3. Gradually migrate non-SEO hardcoded brand references in `auth.legal.*` content to the same `{brand}` strategy where appropriate.
