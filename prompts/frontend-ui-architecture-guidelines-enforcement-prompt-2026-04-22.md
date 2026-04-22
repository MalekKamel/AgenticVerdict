## Frontend UI & Architecture Guidelines Authoring Prompt

### Context

The implementation plan in `/docs/03-technology-research/frontend/ui-infrastructure-research-and-implementation-plan-2026-04-22.md` has already been executed to raise the quality baseline for frontend UI and architecture.

The following changelogs document the implemented work and must be treated as primary references:

- `/changelog/2026-04-22-ui-infrastructure-phase-a-auth-stabilization-implementation.md`
- `/changelog/2026-04-22-ui-infrastructure-phase-b-quality-compliance-hardening-implementation.md`

### Objective

Create comprehensive, enforceable frontend guidelines for UI and architecture that all future implementations must follow, ensuring consistent quality, maintainability, and cross-application consistency.

### Task

Conduct a thorough analysis of the current UI infrastructure and all related frontend files. Based on that analysis:

1. Author one or more guideline documents that define required standards, conventions, and implementation rules.
2. Update `CLAUDE.md` to explicitly enforce adherence to these frontend UI and architecture guidelines in future work.

### Scope Requirements

- Review and synthesize the implemented standards from the research and changelog sources above.
- Cover UI system usage, architecture conventions, quality gates, and implementation consistency rules.
- Ensure guidelines are actionable, measurable, and easy for contributors to follow.
- Align recommendations with existing repository standards and design system governance.

### Deliverables

- A new or updated guideline document set in the repository (single file or multiple files, as appropriate).
- A `CLAUDE.md` update that:
  - references the new guideline source(s), and
  - makes compliance mandatory for future frontend implementation tasks.

### Acceptance Criteria

- Guidelines are comprehensive and practically enforceable.
- Guidelines are clearly structured (principles, rules, examples/checklists).
- `CLAUDE.md` contains explicit enforcement language and references.
- The final output improves consistency and quality across the entire frontend codebase.
