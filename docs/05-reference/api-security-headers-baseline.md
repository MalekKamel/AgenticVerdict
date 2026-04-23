# API security headers baseline

## Scope

This baseline applies to `apps/api` HTTP responses served by Fastify.

## Current baseline

- Middleware: `@fastify/helmet` registered globally in `apps/api/src/server.ts`
- Enabled defaults:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: SAMEORIGIN`
  - `Referrer-Policy` (helmet default)
  - Additional helmet hardening headers per upstream defaults
- CSP behavior:
  - API does **not** emit `Content-Security-Policy` headers.
  - CSP is owned by web HTML rendering (`apps/frontend/src/start.ts`), not API JSON routes.

## Environment notes

- HSTS is enabled in production and disabled in non-production to avoid local HTTPS confusion.
- `crossOriginEmbedderPolicy` is disabled for API compatibility.

## Verification

- Integration test: `apps/api/src/integration/api-health-metrics.integration.test.ts`
- Local check:
  - `pnpm --filter @agenticverdict/api exec vitest run src/integration/api-health-metrics.integration.test.ts`
