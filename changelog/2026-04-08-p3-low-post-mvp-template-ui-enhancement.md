# Changelog: P3 LOW — Post-MVP enhancement (template management UI & related)

**Date:** 2026-04-08  
**Scope:** Formal execution baseline for **🟢 P3 - LOW (Enhancement)** from `REMEDIATION_PLAN_2026-04-08.md`: primarily **P3-1 Template Management UI**, plus aligned Week 4+ themes (performance baselines maturity, PDF/A evaluation) called out in the remediation timeline.

**Reference:** `REMEDIATION_PLAN_2026-04-08.md` — section **P3-1: Template Management UI**; **Implementation Timeline → Week 4+**.

---

## Summary

| Track                                         | Status (2026-04-08)                                  | Notes                                                                                                                                                                                                                                                                                                                 |
| --------------------------------------------- | ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **P3-1 Template management UI**               | **Planned / not yet implemented in `apps/frontend`** | Backend surface exists under Fastify (`/api/v1/report-templates`); operators and analysts today rely on API clients or deployment-time changes for heavy template work. This changelog records the agreed scope, phases, and acceptance criteria so engineering can schedule the ~2-week frontend-led build post-MVP. |
| **Performance baselines (timeline P3)**       | **Partially covered**                                | `docs/06-reference/performance-baselines.md` and `scripts/performance-baseline.mjs` provide a baseline workflow; ongoing refinement (CI wiring, tenant-scoped runs, dashboard links) remains optional P3 polish.                                                                                                      |
| **PDF/A compliance evaluation (timeline P3)** | **Not started**                                      | Document-only / spike when archival or regulated delivery is required; no code change in this slice.                                                                                                                                                                                                                  |

---

## Problem statement (from audit / remediation)

| Gap                                               | Impact                                                                                                                        |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| No first-class **web UI** for template operations | Template and HTML override workflows require API knowledge or releases; slower iteration for tenant-specific report branding. |
| Visual editing deferred                           | Drag-and-drop / flow-based layout editing is a quality-of-life improvement, not a production blocker after P0–P2 remediation. |

---

## Current baseline (repository)

### API (`apps/api`)

Report template routes are registered in `registerReportTemplateRoutes` and exposed under the v1 prefix (see OpenAPI contract tests). Capabilities today:

| Method | Path                                            | Role intent                     | Behavior (summary)                                                                                                     |
| ------ | ----------------------------------------------- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `GET`  | `/api/v1/report-templates`                      | Read: `analyst`, `reports:read` | Returns built-in template **catalog** from `@agenticverdict/report-generator`.                                         |
| `POST` | `/api/v1/report-templates/:templateId/preview`  | Read (same)                     | Renders **HTML preview**; optional `integratePhase2` merges tenant verdict/insights into the view model before render. |
| `GET`  | `/api/v1/report-templates/:templateId/versions` | Read (same)                     | Lists **tenant-scoped** saved HTML versions.                                                                           |
| `POST` | `/api/v1/report-templates/:templateId/versions` | Write: `reports:write`, `admin` | **Appends** a new HTML version (active for preview/generation).                                                        |

Supporting services include `template-customization-store` and the composite template engine from `@agenticverdict/report-generator` (`templateHtmlOverrideSource`).

### Web (`apps/frontend`)

No dedicated report-template admin or editor routes were found under `apps/frontend` at the time of this changelog. The P3-1 deliverable is therefore **net-new UI** consuming the existing authenticated API.

### Packages

- **`@agenticverdict/report-generator`** — Catalog, view-model coercion, format generators, and template engine integration (UI should treat view-model JSON as the contract for “live data” preview where applicable).
- **`@agenticverdict/config`** — Tenant and template-related schemas remain the source of truth for **configuration-driven** behavior; UI must not hardcode tenant-specific rules.

---

## Target scope (P3-1 — unchanged from remediation plan)

| Capability                 | Description                                                                                                                                                  |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Template CRUD (UI)**     | Browse catalog, open a template, edit HTML override content, save new version — backed by existing version endpoints where possible.                         |
| **Visual template editor** | Drag-and-drop (or structured block) composition; **React Flow** suggested for graph-like layout if report structure is represented as a DAG or section tree. |
| **Live preview**           | Preview pane calling preview API with optional Phase 2 integration flag for realistic tenant data.                                                           |
| **Version history**        | Read-only timeline from `GET .../versions`; optional diff view (client-side) between selected versions.                                                      |
| **Approval workflow**      | Lightweight state machine (draft → review → published) is **out of scope** for v1 unless product adds API support; document as Phase 2 of P3-1 if required.  |

### Proposed tech stack (remediation-aligned)

| Layer          | Choice                                        | Rationale                                                 |
| -------------- | --------------------------------------------- | --------------------------------------------------------- |
| Framework      | Next.js App Router (existing `apps/frontend`) | Matches monorepo standards; SSR for auth-aware shell.     |
| Components     | Mantine                                       | Existing design system.                                   |
| JSON editing   | Monaco Editor                                 | Large HTML / JSON payloads, syntax highlighting, search.  |
| Visual builder | React Flow                                    | Recommended in remediation for composable layout editing. |

---

## Phased delivery plan (recommended)

| Milestone                          | Duration (indicative) | Outcome                                                                                                                                      |
| ---------------------------------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **M1 — Shell & catalog**           | 2–3 days              | Authenticated page: list templates from `GET /report-templates`, link to detail; empty states and error handling.                            |
| **M2 — Edit & save**               | 3–4 days              | Monaco-based HTML editor; load versions via `GET .../versions`; save via `POST .../versions`; optimistic UI + validation against API errors. |
| **M3 — Preview**                   | 2–3 days              | Split view: editor + iframe or sandboxed HTML preview via `POST .../preview`; toggle `integratePhase2` for tenant-merged model.              |
| **M4 — Visual builder (optional)** | 4–5 days              | React Flow (or Mantine stepper + blocks) mapping to view-model sections; must round-trip to the same JSON/HTML contracts the API accepts.    |

**Total:** ~2 weeks calendar time for M1–M3; M4 extends into a follow-up sprint if product prioritizes visual editing over raw HTML.

---

## Non-functional requirements

| Area              | Requirement                                                                                                                                          |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Multi-tenancy** | All calls use JWT + tenant context already enforced by API middleware; UI must never send cross-tenant identifiers from client state.                |
| **Authorization** | Respect `reports:read` vs `reports:write` / `admin`: hide save actions when the token lacks write roles.                                             |
| **Rate limits**   | API applies per-route Redis-backed limits (`v1:report-templates:read` / `:write`); UI should debounce preview and surface `429` gracefully.          |
| **Security**      | Preview HTML is tenant-generated content: render in **sandboxed** iframe or sanitize if inlined; avoid `dangerouslySetInnerHTML` on parent document. |
| **Observability** | Reuse existing web patterns (if any) for client error reporting; correlate with `requestId` from API logs once P1 logging is ubiquitous.             |

---

## Dependencies

| Dependency                | Notes                                                                                                                     |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **P1 structured logging** | Helpful for debugging preview/version failures from the UI; not blocking.                                                 |
| **P2 integration tests**  | Adding Playwright or API integration tests for “template save → preview” would harden the UI contract; schedule after M2. |
| **Design / product**      | Approval workflow and exact visual builder metaphor need product sign-off before M4.                                      |

---

## Risks & mitigations

| Risk                                     | Mitigation                                                                                                                           |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Large HTML payloads in browser memory    | Pagination of version list (if API extended), lazy-load Monaco, server-side max size already enforced (2MB body schema on versions). |
| XSS via preview                          | Sandboxed iframe; CSP headers on web app.                                                                                            |
| Scope creep (full WYSIWYG)               | Keep v1 as HTML + preview; treat true WYSIWYG as separate epic.                                                                      |
| API gaps (e.g. delete version, rollback) | Track as follow-up API stories; UI can ship with append-only versioning first.                                                       |

---

## Acceptance criteria (P3-1 UI)

- [ ] Authenticated users with **read** roles can open the template catalog and view template metadata.
- [ ] Users with **write** roles can create a new HTML version and see it in the version list.
- [ ] Preview reflects tenant overrides and optional Phase 2 merged content when requested.
- [ ] RTL/LTR and locale selection align with `@agenticverdict/i18n` conventions used by the preview API.
- [ ] No `any` types in new TypeScript; shared types derived from existing Zod/OpenAPI patterns where practical.
- [ ] E2E smoke: login → open template → save version → preview (Playwright under `apps/frontend/e2e/`).

---

## Verification commands (once UI lands)

```bash
# Web unit / typecheck
pnpm --filter @agenticverdict/frontend exec tsc --noEmit
pnpm --filter @agenticverdict/frontend test

# E2E (when spec exists)
pnpm --filter @agenticverdict/frontend exec playwright test

# Contract regression (API unchanged)
pnpm --filter @agenticverdict/api exec vitest run src/api.contract.test.ts
```

---

## Gaps & follow-ups (expected for P3)

| Item                            | Notes                                                                                                                       |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **Approval workflow**           | Remediation lists it; requires **new API** fields or a separate `template_approvals` concept — defer or spike.              |
| **DELETE / rollback version**   | Not present on current routes; add API if operators need rollback without redeploy.                                         |
| **PDF/A evaluation**            | Legal/archival requirement only; track as documentation spike in `docs/06-reference/` when needed.                          |
| **Performance baselines in CI** | Optional: gate releases on `scripts/performance-baseline.mjs` thresholds from `docs/06-reference/performance-baselines.md`. |

---

## Related documents

- `REMEDIATION_PLAN_2026-04-08.md` — P3-1 definition and Week 4+ timeline.
- `PRODUCTION_READINESS_AUDIT_2026-04-08.md` — Source gap list.
- `docs/06-reference/performance-baselines.md` — Baseline methodology (related P3 theme).
- `apps/api/src/routes/v1/report-templates.ts` — Authoritative HTTP behavior for the planned UI.

---

**Changelog owner:** Frontend Lead (primary), Backend Lead (API extensions if needed)  
**Review cadence:** After P1/P2 stabilization; prioritize when template change velocity becomes an operational bottleneck.
