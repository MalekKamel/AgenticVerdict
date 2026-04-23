# Prompt: Project-wide implementation plan aligned to tenant requirements SSOT

## 1. Objective

Produce **one new markdown document** that is a **comprehensive, end-to-end implementation plan** for AgenticVerdict so that the codebase and operations **conform to** the tenant-related requirements defined in the authoritative checklist below. The plan must be actionable for engineering leads and contributors across all affected surfaces (not a restatement of the SSOT alone).

## 2. Authoritative input

Treat the following file as the **normative source** for what “matching tenant requirements” means. All gaps, conflicts, and priorities in the plan must be reconciled against it; where the SSOT defers detail, cite the linked remediation or architecture documents the SSOT names.

**Single source of truth (requirements):**  
`/docs/architecture/tenant-requirements-single-source-of-truth-2026-04-25.md`

**Supporting references (use as cited by the SSOT; do not supersede it):**

- `/docs/architecture/ui/04-pages/tenant-context-trpc-remediation-plan-2026-04-25.md` — targeted tRPC / public `auth.*` and transport alignment
- `/docs/architecture/business/business-architecture.md`, `/docs/architecture/business/technical-architecture.md`, `/docs/architecture/business/implementation-guide.md` — narrative and patterns
- `/docs/architecture/ui/02-system-entities/tenant-tenant.md` — tenant / tenant UX and entities
- Traceability rows in §7 of the SSOT for code anchors (core tenant context, `dbScoped`, API, worker, frontend providers and clients)

## 3. Scope

The implementation plan must cover **the whole product stack** where tenant correctness applies, including at minimum:

| Area                          | Expectation                                                                                                                             |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **API / HTTP**                | Middleware, `TenantContext`, public vs authenticated resolution, stable error codes, REST vs tRPC convergence per SSOT §5–§9            |
| **Database**                  | `dbScoped`, RLS session, exceptions policy (§9 Q-2), resource `tenantId` checks                                                         |
| **Workers / queues**          | Job entry reconstruction, `runWithTenantContext`, payloads and config loading                                                           |
| **Frontend**                  | `TenantProvider`, effective tenant resolution, pre-session `tenantId` in procedure input, SSR / header forwarding, transitional bridges |
| **Connectors / integrations** | Fail-closed without `tenantId`                                                                                                          |
| **Observability & security**  | Tenant id in structured logs/metrics where appropriate; threat-model notes (headers, mismatch, enumeration) reflected in work items     |
| **Testing & release**         | Unit/integration/E2E coverage for missing tenant, mismatch, and happy paths; PR checklist alignment with SSOT §11                       |

Explicitly **out of scope** for the plan body: items already listed as out of scope in the SSOT (§10), unless the plan records them as **future tracks** with no current engineering commitment.

## 4. Deliverable

**Output:** one new markdown file under `/docs/architecture/` (or `/docs/architecture/ui/04-pages/` if the plan is primarily execution-oriented and the repo convention favors that tree—state the chosen path in the document header).

**Suggested filename pattern:** `tenant-requirements-implementation-plan-YYYY-MM-DD.md` (use the document date you assign).

## 5. Required structure of the implementation plan

The delivered document must include:

1. **Executive summary** — Outcome, major workstreams, and dependency order (short).
2. **Gap analysis** — Current state vs SSOT (by layer: API, tRPC, DB, worker, frontend, observability). Reference real modules/files where known from SSOT §7 and codebase survey.
3. **Phased roadmap** — Sequenced phases with goals, exit criteria, and **explicit mapping** to SSOT section IDs and requirement IDs (e.g. NFR-T*, C-*, §9 Q-\*).
4. **Work breakdown** — Epics or tasks granular enough to assign (API contracts, context types, router migrations, frontend mutations, worker payloads, tests, docs updates).
5. **Risks and mitigations** — Including transitional “bridge” code (SSOT §5.4) and removal criteria.
6. **Traceability** — Table or appendix: SSOT requirement → planned change → owner suggestion (role) → verification (test type or checklist).
7. **Open questions** — Only where the SSOT or linked docs leave ambiguity; each with a proposed default or escalation path.

Tone: **professional, reviewable**, suitable for architecture and security review—no informal chat or unspecified “we should fix tenancy.”

## 6. Constraints

- **Greenfield, pre-production:** optimize for **correctness and clarity**. Do **not** assume obligations to preserve legacy tenant transport shapes, undocumented client behavior, or backward-compatible error text unless the SSOT’s **Compatibility** section explicitly requires it (it currently assumes none).
- **No scope creep:** the plan aligns the **project** to the **tenant SSOT**; do not expand into unrelated product features except where the SSOT ties tenant behavior to them (e.g. agency model, auditability).

## 7. Quality bar

A new contributor (or auditor) can use the plan alone—together with the SSOT—to **implement, review, or verify** tenant behavior without inferring missing phases from informal notes. Every **MUST** in the SSOT is either **scheduled with an acceptance check** or **explicitly flagged** with rationale and a dated follow-up.
