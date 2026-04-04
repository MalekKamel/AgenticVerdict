# Multi-tenancy architecture (application layer)

**Phase:** 0 — Foundation  
**Task mapping:** 0.34 (architecture), coordinates with 0.35–0.43  
**Last updated:** 2026-04-04

## Goals

- Propagate **who the tenant is** and **validated `CompanyConfig`** through each request or job without threading parameters through every call site.
- Combine **application context** with **PostgreSQL RLS** so isolation is defense in depth: missing or wrong context should not silently read another tenant’s rows.

## Components

### 1. Tenant context (`@agenticverdict/core`)

- **`AsyncLocalStorage`** holds a `TenantContext` for the current async continuation:
  - `tenantId` — UUID string, aligned with `companies.id` and `CompanyConfig.companyId`.
  - `config` — validated `CompanyConfig` for this tenant.
  - `requestId` — correlation id for logs and tracing.
  - `userId` — optional authenticated subject.
- **Entering context:** `runWithTenantContext(ctx, fn)` (and helpers that capture/re-enter context across async boundaries).
- **Reading context:** `getTenantContext()`, `requireTenantContext()`.

### 2. Resolution (HTTP / workers)

Resolution is **ordered** and should stay consistent across services:

1. **Headers** — `x-tenant-id` or `x-company-id` (UUID). Intended for internal services and local development; only honor from trusted networks or after gateway authentication in production.
2. **JWT claims** — after the platform verifies the token, pass claims into `resolveTenantIdentity`. Supported claim names include `tenant_id`, `company_id`, and optional namespaced keys.
3. **Subdomain** — left-most labels relative to configured **base domains** (e.g. `acme` for `acme.app.example.com`). Subdomains yield a **slug token**, not a UUID; the host must call `resolveSlugToTenantId` (typically a DB lookup on `companies.slug`) before loading config.

After a UUID is known:

- Load `CompanyConfig` via `ConfigManager` (or equivalent) — implement `CompanyConfigLoader` in the caller.
- Optionally verify **`companies.active`** with a tenant-scoped query inside `dbScoped` (tenant can read their own row under RLS).
- Install context with `runWithTenantContext` for the remainder of the handler.

**Invalid or missing tenant:** respond with **401** (unauthenticated / no tenant) or **403** (forbidden / inactive / mismatch) using `TenantSecurityError` metadata (`httpStatus`, `code`).

### 3. Database access (`@agenticverdict/database`)

- **`dbScoped(db, fn)`** opens a transaction and sets `set_config('app.current_tenant_id', …, true)` to match `getTenantContext().tenantId`.
- All tenant-owned tables use RLS policies on `app.current_tenant_id` (see migrations).
- **Provisioning:** insert the `companies` row with `id = companyConfig.companyId` inside `runWithTenantContext` + `dbScoped` so RLS `WITH CHECK` on `companies` succeeds.
- **Deactivation:** update `companies.active` inside the same pattern; middleware should treat `active === false` as **403** after resolution.

### 4. Cache isolation (Redis / CDN keys)

- Never use a bare marketing key (e.g. `metrics:2024-01`) in shared Redis.
- Prefix every key with a tenant namespace, e.g. `t:{tenantId}:{segment}:…` via `tenantScopedCacheKey` in `@agenticverdict/database`.
- L1 caches in memory should be keyed by `tenantId` as part of the map key or cache key factory.

### 5. Tenant-specific data routing

- Handlers and jobs should assume **no** cross-tenant queries: load resources only through `dbScoped` (or a future repository layer that always calls it).
- When a row includes `company_id`, call **`assertResourceCompanyId`** (or equivalent) before returning or mutating it so application code fails fast even if a policy were misconfigured.

## Threat model notes

- **Header spoofing:** treat tenant headers as trusted only behind an API gateway that strips or overwrites them for external clients.
- **JWT:** resolve tenant only from **verified** claims; do not decode untrusted JWT bodies without signature verification.
- **Subdomain:** validate slug → UUID mapping server-side; never trust the slug alone as authentication.

## Related code

- `packages/core/src/tenant-context.ts` — AsyncLocalStorage and `TenantContext`.
- `packages/core/src/tenant-resolution.ts` — identity resolution from headers, JWT, host.
- `packages/core/src/tenant-request-context.ts` — config load + optional active check.
- `packages/core/src/tenant-propagation.ts` — re-enter context after async hops.
- `packages/core/src/tenant-data-access.ts` — resource `company_id` checks.
- `packages/database/src/db-scoped.ts` — RLS session variable.
- `packages/database/src/tenant-provisioning.ts` / `tenant-lifecycle.ts` — provision and activate/deactivate.
