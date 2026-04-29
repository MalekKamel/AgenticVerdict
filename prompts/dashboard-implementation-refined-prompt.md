## Context

The project infrastructure and authentication pages have already been implemented as the initial application flow.

The next phase is to implement the production dashboard based on:

- `/docs/architecture/ui/04-pages/dashboard.md`
- `/docs/architecture/ui/00-overview.md`
- Any directly related UI architecture and governance documents referenced by the above.

The current dashboard at `/apps/frontend/src/routes/$locale/dashboard` is a prototype only and does not represent the required final implementation. It must be fully removed and rebuilt from scratch to align with project standards and requirements.

## Objective

Produce a comprehensive, execution-ready implementation plan as a file that defines how the production dashboard will be rebuilt to meet all documented requirements.

## Task

Create and deliver a **single implementation plan file** for the dashboard rebuild.

The plan must include:

1. **Requirements Consolidation**
   - Extract and organize functional, UI, architecture, and non-functional requirements from the referenced documentation.
2. **Current-State Assessment**
   - Identify why the existing prototype at `/apps/frontend/src/routes/$locale/dashboard` is insufficient.
   - Define what must be removed and what (if anything) can be reused safely.
3. **Target Architecture and Design Approach**
   - Describe the intended route/module structure, component boundaries, state/data-flow approach, and integration points.
4. **Phased Implementation Roadmap**
   - Break work into phases with sequencing, dependencies, and milestones.
   - Include concrete tasks per phase with estimated complexity/risk.
5. **Validation and Quality Gates**
   - Define required checks (type safety, linting, testing, accessibility, localization directionality, and multi-tenant safety verification).
6. **Acceptance Criteria**
   - Provide explicit, testable completion criteria for the final dashboard.
7. **Risks and Mitigations**
   - List key delivery risks and actionable mitigation steps.
8. **Deliverables**
   - Specify expected code artifacts, documentation updates, and verification evidence.

## Constraints

- Must align with the same UI guidelines and quality bar established in the authentication pages.
- Must follow current frontend and architecture governance documents.
- Must comply fully with multi-tenancy requirements and guardrails.
- Must be written in a professional, implementation-focused format suitable for engineering execution.

## Output Requirement

Deliver the implementation plan as a file in `/prompts/` (Markdown format), ready for direct handoff to an implementation agent or engineering team.

## Expected Outcome

A comprehensive implementation plan file that enables the team to remove the prototype dashboard and rebuild a production-ready dashboard in a controlled, standards-compliant, and verifiable manner.
