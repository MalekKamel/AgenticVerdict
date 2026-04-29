# Skills Reference

This document is the quick-reference index for skills used in this repository.

## Purpose

- Keep `CLAUDE.md` lean by moving task-conditional guidance into skills.
- Provide a single place to discover which skill to use for each task type.
- Standardize how contributors route work to the correct guidance source.

## Skill Locations

- Project skills: `.agents/skills/`
- Lock file (reusable installed skills): `skills-lock.json`
- Always-on guardrails and trigger matrix: `CLAUDE.md`

## Custom Skills (Project-Specific)

### `frontend-governance`

- **Use for:** frontend/UI/routing/auth/localization/design-token work.
- **Focus:** frontend SSOT compliance, WCAG 2.1 AA, RTL/LTR parity, route safety.
- **Path:** `.agents/skills/frontend-governance/SKILL.md`

### `multi-tenant-guardrails`

- **Use for:** tenant-sensitive API/worker/db/auth/config changes.
- **Focus:** tenant isolation, context propagation, tenant-scoped access, log safety.
- **Path:** `.agents/skills/multi-tenant-guardrails/SKILL.md`

### `runtime-config-docker`

- **Use for:** Dockerfiles/compose/runtime env/CI container workflow changes.
- **Focus:** Makefile-first Docker workflow, layered config boundaries, stage/env correctness.
- **Path:** `.agents/skills/runtime-config-docker/SKILL.md`

### `testing-policy`

- **Use for:** any behavior-changing implementation or refactor.
- **Focus:** risk-based targeted testing, coverage expectations, validation evidence.
- **Path:** `.agents/skills/testing-policy/SKILL.md`

### `docs-navigation`

- **Use for:** planning/research/review tasks requiring SSOT lookup.
- **Focus:** authoritative doc routing by domain and conflict resolution.
- **Path:** `.agents/skills/docs-navigation/SKILL.md`

### `backend-patterns`

- **Use for:** backend/service/connector implementation in API/worker/shared backend code.
- **Focus:** strict typing, structured errors, safe observability, non-blocking routes.
- **Path:** `.agents/skills/backend-patterns/SKILL.md`

### `roadmap-context`

- **Use for:** phase planning, milestone execution, and scope/acceptance mapping.
- **Focus:** phase/spec alignment, dependency checks, validation gates.
- **Path:** `.agents/skills/roadmap-context/SKILL.md`

### `error-system`

- **Use for:** tasks involving canonical error handling, error codes, translators, adapters, and observability.
- **Focus:** core error SSOT compliance, boundary-safe translation, frontend-safe messaging, and governance checks.
- **Path:** `.agents/skills/error-system/SKILL.md`

## Reusable Skills (Installed)

### `find-skills`

- **Use for:** discovering additional ecosystem skills.
- **Source:** `vercel-labs/skills`

### `skill-creator`

- **Use for:** creating and iteratively improving custom skills.
- **Source:** `anthropics/skills`

### `doc-coauthoring`

- **Use for:** writing/refining structured technical documentation.
- **Source:** `anthropics/skills`

### `webapp-testing`

- **Use for:** browser-level local web app testing workflows.
- **Source:** `anthropics/skills`

### `vercel-composition-patterns`

- **Use for:** React component API/composition improvements.
- **Source:** `vercel-labs/agent-skills`

### `vercel-react-best-practices`

- **Use for:** React performance and architectural best-practice checks.
- **Source:** `vercel-labs/agent-skills`

### `web-design-guidelines`

- **Use for:** design/accessibility-oriented UI review patterns.
- **Source:** `vercel-labs/agent-skills`

## Trigger Matrix (Quick Use)

- If task touches frontend UI/routing/auth/i18n -> use `frontend-governance`.
- If task touches tenant scoping/context/db isolation -> use `multi-tenant-guardrails`.
- If task touches Docker/runtime env/container CI -> use `runtime-config-docker`.
- If task changes behavior or risk profile -> use `testing-policy`.
- If task starts with planning or doc discovery -> use `docs-navigation`.
- If task touches backend/service/connector logic -> use `backend-patterns`.
- If task needs phase/spec alignment -> use `roadmap-context`.

## Maintenance Rules

- Keep `CLAUDE.md` focused on always-on constraints and trigger routing only.
- Keep procedural details inside skill files.
- Update this reference whenever:
  - a skill is added/removed/renamed,
  - trigger conditions change,
  - `skills-lock.json` changes for reusable skills.
