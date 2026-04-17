# Security scanning backlog (SAST / DAST / pen-test)

**Date:** 2026-04-17  
**Status:** Scheduling and ownership — not yet fully automated in CI.

## Goals

| Track        | Objective                                                              | Suggested owner     | Cadence                                   |
| ------------ | ---------------------------------------------------------------------- | ------------------- | ----------------------------------------- |
| **SAST**     | Static analysis on PRs or `main` (TypeScript/JavaScript; secrets scan) | Platform / security | Weekly minimum on `main`                  |
| **DAST**     | Dynamic scan against **staging** (auth-aware flows as available)       | Security / QA       | Before major releases                     |
| **Pen-test** | Third-party assessment of tenant boundaries and API surface            | Security            | Annual + after major architecture changes |

## Quick wins (optional)

- Enable **CodeQL** or **Semgrep** for JavaScript/TypeScript in GitHub Actions (informational → blocking once noise is low).
- Add **OWASP ZAP** baseline against staging URL in a scheduled workflow (authenticated crawl deferred until stable test accounts exist).
- **CSP:** `script-src` and `style-src` use a **shared per-request nonce** in production (`apps/frontend/src/start.ts`, `apps/frontend/src/lib/csp.ts`); **`style-src-attr 'unsafe-inline'`** covers React inline **`style`** attributes. Optional follow-up: **`strict-dynamic`**, `hash-` sources for pinned inline scripts, lab DAST against staging, or replacing inline styles with classes to drop **`style-src-attr`** where feasible.

## Compliance note

Link internal compliance requirements (if any) to the same tickets so calendar slots and severity thresholds stay aligned with org policy.
