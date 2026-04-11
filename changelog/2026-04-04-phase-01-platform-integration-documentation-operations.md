# Changelog entry: Phase 01 — Documentation and operations readiness (Execution Phase 8)

**Date:** 2026-04-04  
**Scope:** Phase 1 (Platform Integration) — [Execution Phase 8 — Documentation and operations readiness](specs/00-core/01-connectors/EXECUTION-PLAN.md) (`tasks.md` Work Stream 4 Tasks 4.1–4.3; aligns with [acceptance-criteria.md §4](specs/00-core/01-connectors/acceptance-criteria.md)).

This change adds a dedicated **`operations/`** documentation set under the Phase 01 docs folder: **API reference** for `@agenticverdict/platform-adapters`, **usage examples** (TypeScript plus Python HTTP probes), **error code catalog**, **per-platform authentication guides**, **OpenAPI 3.0** for Next.js `/api/health*` routes, and **operational runbooks** (deployment, monitoring, incident response, troubleshooting, disaster recovery) together with **architecture / data-flow** and **performance benchmark** references tied to the Phase 01 integration test package. CI validates the OpenAPI file with **Redocly CLI** via a new root script. It does **not** stand up a separate published docs site, generate OpenAPI for future Fastify/tRPC APIs, or automate vendor OAuth flows.

---

## Summary

- **`specs/00-core/01-connectors/operations/`** — index [README.md](specs/00-core/01-connectors/operations/README.md) linking all deliverables.
- **API & developer docs** — [API-REFERENCE.md](specs/00-core/01-connectors/operations/API-REFERENCE.md), [USAGE-EXAMPLES.md](specs/00-core/01-connectors/operations/USAGE-EXAMPLES.md), [ERROR-CODES.md](specs/00-core/01-connectors/operations/ERROR-CODES.md), [AUTHENTICATION-GUIDES.md](specs/00-core/01-connectors/operations/AUTHENTICATION-GUIDES.md).
- **OpenAPI** — [openapi/platform-adapters-health.yaml](specs/00-core/01-connectors/operations/openapi/platform-adapters-health.yaml); validated by **`pnpm run lint:openapi`** (`@redocly/cli`).
- **Ops** — [RUNBOOK-DEPLOYMENT.md](specs/00-core/01-connectors/operations/RUNBOOK-DEPLOYMENT.md), [MONITORING-GUIDE.md](specs/00-core/01-connectors/operations/MONITORING-GUIDE.md), [INCIDENT-RESPONSE.md](specs/00-core/01-connectors/operations/INCIDENT-RESPONSE.md), [TROUBLESHOOTING.md](specs/00-core/01-connectors/operations/TROUBLESHOOTING.md), [DISASTER-RECOVERY.md](specs/00-core/01-connectors/operations/DISASTER-RECOVERY.md).
- **Architecture & performance** — [ARCHITECTURE-AND-DATA-FLOW.md](specs/00-core/01-connectors/operations/ARCHITECTURE-AND-DATA-FLOW.md) (mermaid), [PERFORMANCE-BENCHMARKS.md](specs/00-core/01-connectors/operations/PERFORMANCE-BENCHMARKS.md).
- **Phase README** — links `EXECUTION-PLAN.md` and `operations/`.
- **CI** — `.github/workflows/ci.yml` runs `pnpm run lint:openapi` in the quality job.

---

## Added

### Documentation

- **`specs/00-core/01-connectors/operations/`** (files listed in Summary)
- **`changelog/2026-04-04-phase-01-platform-integration-documentation-operations.md`** (this file)

### Tooling

- **Root `package.json`** — script **`lint:openapi`**; devDependency **`@redocly/cli`**
- **`redocly.yaml`** — Redocly recommended rules with `operation-4xx-response` off for health-only GET contracts

---

## Changed

- **`specs/00-core/01-connectors/README.md`** — Contents section extended.
- **`.github/workflows/ci.yml`** — OpenAPI lint step after Phase 01 integration tests.

---

## Verification (local)

Commands expected to succeed after `pnpm install`:

- `pnpm run lint:openapi`
- `pnpm run format:check`
- `pnpm run test:phase01-integration` (unchanged; regression guard)

---

## Known follow-ups (not in this change set)

- **Published docs site** — Markdown remains in-repo; add Docusaurus/VitePress if a browsable portal is required.
- **Broader OpenAPI** — Fastify external API and tRPC procedures are out of scope for this spec.
- **Live benchmark reports** — Staging/nightly jobs against real vendors still need scheduling and dashboard wiring.

---

## Related documentation

- [`specs/00-core/01-connectors/EXECUTION-PLAN.md`](specs/00-core/01-connectors/EXECUTION-PLAN.md) — Execution Phase 8 definition and verification.
- [`specs/00-core/01-connectors/acceptance-criteria.md`](specs/00-core/01-connectors/acceptance-criteria.md) — §4 Documentation requirements.
