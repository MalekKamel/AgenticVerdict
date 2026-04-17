# Prompt: Web development guidelines from TanStack Start implementation plan

## Context

The recommendations in [`docs/03-technology-research/frontend/web-tanstack-start-recommendations-implementation-plan-2026-04-17.md`](../../docs/03-technology-research/frontend/web-tanstack-start-recommendations-implementation-plan-2026-04-17.md) have been implemented (or are in progress) as the baseline for the `apps/frontend` stack. That document is the authoritative traceability matrix and phased plan (recommendations 1–10, cross-cutting concerns, and exit criteria).

## Objective

Produce a **single, actionable guideline document** that the team can use to keep web work aligned with those recommendations: clear architecture boundaries, consistent implementation patterns, and sustained quality (multi-tenancy, auth, errors, accessibility, testing, observability, and production readiness).

## Task

1. **Analyze** the implementation plan end to end: numbered recommendations, cross-cutting requirements, phased work packages, dependencies, risks, validation, and success metrics.
2. **Synthesize** the analysis into **written guidelines**—not a repeat of the plan, but **normative rules and conventions** developers must follow when changing or extending `apps/frontend` and related packages (for example `@agenticverdict/ui`, shared tRPC client, API coordination).
3. **Deliver** one new markdown file that serves as the **enforced reference** for ongoing web development (structure, routing, data layer, auth, i18n/RTL, design system usage, testing, CI expectations, and operational hygiene as implied by the plan).

## Deliverable requirements

- **Audience:** engineers implementing and reviewing web changes.
- **Tone:** direct, prescriptive where the plan is prescriptive; explanatory only where needed for safe defaults.
- **Structure:** use clear sections (e.g. principles, architecture boundaries, per-area rules, review checklist, links to SSOT docs).
- **Traceability:** map guideline areas back to the plan’s recommendation numbers or phase themes where it helps audits and onboarding.
- **Scope:** stay within what the implementation plan and existing repo standards imply; do not invent unrelated process.

## Success criteria

- Guidelines are **comprehensive relative to the plan** (no major recommendation theme left without a corresponding rule or pointer).
- Guidelines are **enforceable** in code review (testable statements, not vague aspirations).
- The document **complements**—rather than duplicates—the implementation plan: the plan remains the backlog/traceability artifact; the new file is the **day-to-day development contract**.

## Out of scope

- Replacing or rewriting the implementation plan itself.
- Unrelated product features or documentation outside web platform concerns covered by the plan.
