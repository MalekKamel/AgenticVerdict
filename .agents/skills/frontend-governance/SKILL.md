---
name: frontend-governance
description: Enforces frontend architecture, design-system, accessibility, localization, and route-safety standards for any change under `apps/frontend`, `packages/ui`, routing, or UX flows in AgenticVerdict.
---

## Purpose

Provide a strict, repeatable governance workflow so frontend changes remain compliant with architecture SSOTs, design system standards, WCAG 2.1 AA, RTL/LTR requirements, and safe auth/navigation behavior.

## When to use

- Any task that changes `apps/frontend` or `packages/ui`.
- Any update to routes, guards, auth/session flows, redirects, or protected/public page access.
- Any UI/UX, component, token, localization, or theme-related change.
- Any change that may impact accessibility, i18n, or navigation safety.

## Required sources of truth

Use these in order and treat them as authoritative:

1. `/docs/05-reference/frontend-ui-architecture-guidelines.md`
2. `/docs/05-reference/frontend-ui-architecture-guidelines-checklist.md`
3. `/design-system/README.md`
4. `/docs/05-reference/frontend-development-guidelines.md`
5. `/prompts/ui-guidelines-enforcement.md`

## Mandatory constraints

- Follow all `MUST` rules in `/docs/05-reference/frontend-ui-architecture-guidelines.md`.
- Reuse shared patterns/components from `@agenticverdict/ui` and Mantine v9; avoid one-off UI primitives.
- Preserve architectural boundaries (route -> page -> component -> hook/service -> API).
- Meet **WCAG 2.1 AA** for changed surfaces (semantic structure, keyboard access, focus visibility, labels, color contrast).
- Preserve **RTL/LTR parity** using locale/theme-driven direction; avoid hardcoded directional assumptions.
- Keep route/auth behavior safe:
  - prevent redirect loops,
  - block unsafe redirect targets,
  - preserve protected/public route intent,
  - keep session/guard transitions deterministic.
- Do not introduce tenant-specific hardcoding; keep configuration-driven behavior.

## Required validation commands

Run for affected frontend scope before finalizing:

- `pnpm --filter @agenticverdict/frontend exec tsc --noEmit --pretty false`
- `pnpm --filter @agenticverdict/frontend run i18n:validate` (required when locale dictionaries or locale-driven UI are touched)
- Targeted tests for changed critical logic (route guards, auth/session, i18n, accessibility-sensitive components), e.g.:
  - `pnpm --filter @agenticverdict/frontend test -- <targeted-spec-pattern>`

## Step-by-step workflow

1. **Classify change scope**: confirm whether task affects frontend UI, routes, auth/session, i18n, or design-system usage.
2. **Load governance docs**: review all required sources of truth before implementation.
3. **Map constraints to task**: list applicable architecture, a11y, RTL/LTR, and route-safety requirements.
4. **Implement with approved patterns**: use shared components/tokens and preserve layering boundaries.
5. **Run checklist review**: validate against `/docs/05-reference/frontend-ui-architecture-guidelines-checklist.md`.
6. **Execute required validations**: run TypeScript, i18n validation (if applicable), and targeted tests.
7. **Record compliance evidence**: capture what constraints were checked and how failures were resolved.
8. **Finalize only if clean**: do not conclude until all mandatory constraints and validations pass.

## Deliverables

- Frontend changes aligned with all required governance documents.
- Explicit compliance notes covering:
  - WCAG 2.1 AA checks,
  - RTL/LTR behavior,
  - route/redirect safety.
- Validation evidence (commands run + pass/fail outcomes).
- Any justified deviation documented with rationale, risk, mitigation, owner, and due date.

## Failure conditions

Treat task as failed (do not mark complete) if any of the following occur:

- Required source documents were not consulted.
- A `MUST` rule is violated without approved deviation documentation.
- WCAG 2.1 AA regressions are introduced.
- RTL/LTR behavior is broken or direction is hardcoded unsafely.
- Route safety regressions exist (loops, unsafe targets, broken protected/public access flow).
- Required validation commands are skipped or failing.
- Changes bypass shared design-system/UI architecture conventions.
