## CLAUDE.md Skills Optimization Implementation Plan

## 1) Goal and Outcome

Reduce `CLAUDE.md` context bloat while preserving (or improving) implementation quality by moving task-conditional guidance into reusable and custom skills.

Target outcome:

- Keep `CLAUDE.md` as a compact always-on guardrail document.
- Move procedural and reference-heavy content into skill files loaded on demand.
- Establish governance to prevent re-bloat.

## 2) Current-State Findings

### A. What is currently active

- `skills-lock.json` currently locks `find-skills`.
- `npx skills init` has already been executed.
- `skill-creator` is available for creating and iterating custom skills.

### B. `CLAUDE.md` content classification (high level)

- Keep in `CLAUDE.md` (minimal): non-negotiable constraints, safety rules, precedence rules, and skill trigger map.
- Migrate to skills: frontend governance details, multi-tenancy implementation playbooks, runtime/docker layering details, testing matrix details, large documentation indices, and repeated operational command blocks.

### C. Expected token impact

- Overall expected reduction: high (target 50-70% reduction in `CLAUDE.md` token footprint).

## 3) Skill Strategy

### A. Reusable skills to leverage

- `find-skills` (installed): discover and validate ecosystem skills.
- `skill-creator`: create and iteratively improve custom skills.
- `doc-coauthoring`: author and maintain long-form skill docs/process content.

Optional (scope-based, if confirmed useful):

- React/frontend quality skills from `skills.sh` for UI-specific best-practice guidance.

### B. Custom skills to build (initial set)

1. `frontend-governance`
   - Purpose: frontend SSOT and quality gates for `apps/frontend` + `packages/ui`.
2. `multi-tenant-guardrails`
   - Purpose: tenant isolation and anti-hardcoding enforcement.
3. `runtime-config-docker`
   - Purpose: runtime env layering, compose overlays, Makefile-first Docker workflows.
4. `testing-policy`
   - Purpose: test expectations and required validation by change type.
5. `docs-navigation`
   - Purpose: fast SSOT path routing by domain.
6. `backend-patterns`
   - Purpose: reusable backend implementation patterns and anti-patterns.
7. `roadmap-context`
   - Purpose: phase/acceptance references for milestone-oriented tasks.

## 4) Migration Matrix (CLAUDE.md -> Skills)

| CLAUDE.md Theme                           | Action       | Destination               |
| ----------------------------------------- | ------------ | ------------------------- |
| Core non-negotiable principles and safety | Keep (short) | `CLAUDE.md`               |
| Frontend governance details/checklists    | Migrate      | `frontend-governance`     |
| Multi-tenant implementation examples      | Migrate      | `multi-tenant-guardrails` |
| Runtime config + Docker deep operations   | Migrate      | `runtime-config-docker`   |
| Testing percentages and detailed matrix   | Migrate      | `testing-policy`          |
| Documentation index/reference lists       | Migrate      | `docs-navigation`         |
| Reusable backend examples/pattern blocks  | Migrate      | `backend-patterns`        |
| Phase/recent-change context blocks        | Migrate      | `roadmap-context`         |

## 5) Step-by-Step Execution Plan (with Parallel Workstreams)

### Phase 0: Baseline and Guardrail Contract (Week 0-1)

Steps:

1. Create a `CLAUDE.md` minimal contract (what must remain always-on).
2. Snapshot baseline metrics (token size, policy coverage, friction points).
3. Freeze migration matrix v1 and ownership.

Parallel workstreams:

- WS-A: `CLAUDE.md` section inventory and token sizing.
- WS-B: minimal guardrail contract draft.
- WS-C: KPI baseline setup.

Deliverables:

- `CLAUDE.md` minimal contract (draft).
- Baseline KPI table.
- Migration matrix v1.

### Phase 1: Skill Architecture and Templates (Week 1-2)

Steps:

1. Define a standard custom-skill template.
2. Define trigger conditions for each custom skill.
3. Set governance metadata (`owner`, `review cadence`, `last validated`).

Parallel workstreams:

- WS-A: template and quality bar.
- WS-B: trigger matrix and boundaries.
- WS-C: governance/process metadata.

Deliverables:

- Skill template spec.
- Skill trigger map.
- Governance model v1.

### Phase 2: Pilot Authoring and First Migration (Week 2-4)

Steps:

1. Build pilot skills using `skill-creator`:
   - `frontend-governance`
   - `multi-tenant-guardrails`
   - `testing-policy`
2. Migrate matching `CLAUDE.md` sections.
3. Validate parity through representative tasks.

Parallel workstreams:

- WS-A: author 3 pilot skills.
- WS-B: trim `CLAUDE.md` and link to skill triggers.
- WS-C: run parity audit and capture regressions.

Deliverables:

- 3 production-ready skills.
- Reduced `CLAUDE.md` (pilot).
- Parity audit report.

### Phase 3: Full Migration and Stabilization (Week 4-6)

Steps:

1. Author remaining custom skills.
2. Complete migration of mapped sections.
3. Close parity gaps and tune triggers.

Parallel workstreams:

- WS-A: author remaining skills.
- WS-B: validation and remediation.
- WS-C: contributor enablement docs.

Deliverables:

- Full custom-skill set v1.
- Final slim `CLAUDE.md`.
- Contributor quick-start.

### Phase 4: Governance and Continuous Improvement (Week 6-12)

Steps:

1. Activate recurring review cadence.
2. Track KPIs weekly/monthly.
3. Iterate on ambiguous or low-adoption skills.

Parallel workstreams:

- WS-A: KPI monitoring.
- WS-B: monthly parity audits.
- WS-C: maintenance and version updates.

Deliverables:

- KPI trend dashboard/report.
- Monthly optimization changelog.
- Skill suite v1.x improvements.

## 6) Ownership Model (RACI-lite)

| Area                         | Responsible           | Accountable         | Consulted        |
| ---------------------------- | --------------------- | ------------------- | ---------------- |
| Minimal `CLAUDE.md` contract | Platform/Architecture | Tech Lead           | Security, FE, BE |
| Custom skill authoring       | Domain maintainers    | Domain leads        | QA, Docs         |
| Parity validation/audits     | QA/Enablement         | Engineering Manager | Domain leads     |
| Governance and cadence       | Platform Ops/Docs     | Engineering Manager | Tech Lead        |

## 7) Validation and Exit Criteria

Checklist:

- Every removed `CLAUDE.md` section has a mapped skill destination.
- Non-negotiable guardrails remain in `CLAUDE.md`.
- Pilot tasks pass without policy regressions.
- Contributors can locate applicable skill guidance quickly.
- Skills include explicit triggers and boundaries.

Exit criteria for migration completion:

- `CLAUDE.md` token reduction >= 50%.
- Compliance parity >= 95% against baseline.
- Critical policy regressions = 0.

## 8) Risks and Mitigations

1. Risk: Skills not loaded when needed.
   - Mitigation: explicit trigger matrix in `CLAUDE.md` + onboarding quick-reference.
2. Risk: Drift between `CLAUDE.md` and skills.
   - Mitigation: skills become procedural SSOT; `CLAUDE.md` stays pointer-only.
3. Risk: Over-fragmentation.
   - Mitigation: start with 4 high-impact custom skills; expand only with proven need.
4. Risk: Temporary regression during migration.
   - Mitigation: phased rollout + parity audit gates per phase.

## 9) Rollback Plan

Trigger conditions:

- Compliance parity drop below threshold.
- Critical missing guardrail causes risky behavior.

Rollback steps:

1. Restore previous `CLAUDE.md` baseline from version control.
2. Pause further section removals.
3. Fix offending skill gaps.
4. Re-run pilot validation, then resume phased migration.

## 10) KPI Framework (30/60/90)

### 30 days

- Pilot skills shipped.
- Initial `CLAUDE.md` reduction applied.
- First parity report completed.

### 60 days

- All core custom skills published.
- Governance cadence active.
- Adoption and parity metrics stable.

### 90 days

- Sustained token reduction + quality parity.
- Stable maintenance workflow.
- Transition to business-as-usual updates.
