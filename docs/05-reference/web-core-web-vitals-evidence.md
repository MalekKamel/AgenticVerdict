# Core Web Vitals — lab evidence (Lighthouse CI)

**Date:** 2026-04-17  
**Related:** `apps/frontend/lighthouserc.cjs`, `.github/workflows/web-lighthouse-ci.yml`

## Purpose

Provide an **automated lab check** on the production web bundle for Core Web Vitals–related signals (LCP, TBT as INP proxy, CLS) and accessibility, tied to `main` / manual dispatch.

RUM (real user monitoring) remains optional via `VITE_PUBLIC_TELEMETRY_INGEST_URL` and client web-vitals forwarding; this document covers **lab** evidence only.

## Thresholds (Lighthouse assertions)

Configured in `apps/frontend/lighthouserc.cjs` (warn-level for perf categories to avoid flaky main-branch failures on shared runners):

| Signal / category        | Assertion                               |
| ------------------------ | --------------------------------------- |
| Performance score        | ≥ 0.50 (warn)                           |
| Accessibility score      | ≥ 0.85 (error)                          |
| Best practices / SEO     | ≥ 0.80 (warn)                           |
| First Contentful Paint   | ≤ 4000 ms (warn)                        |
| Largest Contentful Paint | ≤ 4000 ms (warn)                        |
| Total Blocking Time      | ≤ 800 ms (warn, rough INP proxy in lab) |
| Cumulative Layout Shift  | ≤ 0.25 (warn)                           |

Tune assertions after baseline runs; prefer **staging** verification for CSP and third-party assets.

## CI artifacts

`.github/workflows/web-lighthouse-ci.yml` uploads the full `.lighthouseci` directory (JSON + HTML when produced by `@lhci/cli`) plus a best-effort HTML-only artifact for quick review in the Actions UI.

## How to run locally

```bash
pnpm --filter @agenticverdict/web build
cd apps/frontend && npx --yes @lhci/cli@0.14.0 autorun
```

The config starts the Nitro server from `.output/server/index.mjs` and probes English home and login URLs.
