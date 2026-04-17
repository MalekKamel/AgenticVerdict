# Prompt: TanStack Start recommendations — implementation plan

## Objective

Produce a **single, authoritative implementation plan** that operationalizes every item under **Section 7. Recommendations for AgenticVerdict** and the **Implementation Phasing** subsection in the research memo below, without contradicting **[Decision 11: tRPC as unified API layer](/docs/architecture/ui/04-decision-record.md#decision-11-trpc-as-unified-api-layer-for-multi-client-support)** (tRPC v11 on `apps/api` as the unified API layer—not `createServerFn` for business operations). Treat the memo’s phased timeline as a **baseline sequence**; refine it with concrete work packages, owners, dependencies, and exit criteria.

## Source of truth

Read and align with:

- **Primary:** `/docs/03-technology-research/frontend/web-tanstack-start-standards-research-memo-2026-04-16.md`
  - **Section 7. Recommendations for AgenticVerdict** (high-, medium-, and long-priority recommendations **1–10**)
  - **Implementation Phasing** (Phases 1–4)
  - **Success Metrics** (use as acceptance criteria where applicable)

Cross-check architectural constraints in `/docs/architecture/ui/04-decision-record.md` (Decision 11) and existing web conventions in `CLAUDE.md` / `/design/README.md` where relevant.

## Scope

- **In scope:** End-to-end planning for `apps/frontend` (and touchpoints to `apps/api` / shared packages only where the recommendation requires it). Map each recommendation to actionable work: discovery, design, implementation, validation, and rollout.
- **Out of scope:** Rewriting the research memo itself; unrelated product features not implied by Section 7.

## Deliverable

Create **one new markdown file** (path and filename are for the executor to choose under `/docs/` or `/changelog/`, consistent with repo conventions) containing:

1. **Executive summary** — One short paragraph on scope, assumptions (Decision 11, multi-tenancy), and how the plan relates to the memo’s four phases.

2. **Traceability matrix** — Table mapping **Recommendation 1–10** → planned initiatives → **phase** (memo Phase 1–4 or adjusted phases with rationale) → primary codebase areas.

3. **Phased plan** — For each phase:
   - Goals and **exit criteria** (tie to **Success Metrics** where measurable).
   - **Work packages** with: description, dependencies, risks, suggested ordering, and validation (tests, checks, or manual QA as appropriate).
   - Explicit handling of **cross-cutting** concerns: tenant context, error boundaries, auth, tRPC client usage, RTL/LTR, accessibility (WCAG 2.1 AA), and observability.

4. **Consolidated backlog** — Prioritized list of epics/tasks derived from Section 7, deduplicated across phases, with notes on what can run in parallel vs. what is sequential.

5. **Open questions / decisions** — Items that require product or architecture sign-off before implementation.

## Quality bar

- Use precise, professional language; avoid vague placeholders (“improve X”) without a verifiable outcome.
- Stay consistent with the memo’s **tRPC-first** API model and TanStack Start v1 / file-based routing direction.
- Prefer **measurable** acceptance criteria (coverage targets, CWV, a11y verification) where the memo specifies them.

## Instructions for the executing agent

1. Read Section 7, **Implementation Phasing**, and **Success Metrics** in the memo end-to-end.
2. Draft the deliverable file; link to the memo and Decision 11 from the document header or references section.
3. Do not omit any numbered recommendation (1–10); if something is deferred, state **why** and **what** unblocks it.
