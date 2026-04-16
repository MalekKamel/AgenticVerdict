## Prompt: UI Generation Guide-Aligned Implementation Plan for Reusable UI and Auth Routes

### Context

The design system has been reorganized for full reusability, as documented in `/design/README.md`.  
`/design/system` is the canonical reusable design source and must drive implementation decisions in `/packages/ui` and downstream route usage.
`/design/docs/research/pen-feature-ref-reusability-implementation-plan.md` documents the correct approach for `.pen` reuse and is the authoritative governance reference for this plan.

### Objective

Write a comprehensive, execution-ready implementation plan that delivers:

- Full design-to-code alignment between `/design/system` and `/packages/ui`.
- Full reuse of `/packages/ui` within `/apps/web/src/routes/$locale/auth` (no duplicated UI primitives/patterns).

### Mandatory Alignment with UI Generation Guide

Follow `/design/docs/generation/ui-generation-guide.md` as the primary process framework.  
The plan must explicitly use its phase structure and quality expectations:

- **Phase 1:** Design Token Extraction
- **Phase 2:** Component Generation
- **Phase 3:** Integration

### Mandatory Alignment with `.pen` Reuse Research

Follow `/design/docs/research/pen-feature-ref-reusability-implementation-plan.md` as the required policy for design-system reuse.  
The implementation plan must explicitly incorporate and enforce:

- Same-document `ref` semantics for Pencil `.pen` authoring.
- Reuse-first feature authoring (no ad hoc duplicate generic atoms/molecules in feature files).
- Feature coverage requirement: reusable design-system patterns must be used across **all** feature files, including `/design/features/auth.pen`.

### Required Planning Constraints

Include and enforce the following:

1. **MCP-first workflow**
   - Treat `.pen` files as the source of truth.
   - Require Pencil MCP extraction/inspection steps for tokens and component structure before implementation decisions.
   - Require feature `.pen` implementation guidance to follow reuse governance from `/design/docs/research/pen-feature-ref-reusability-implementation-plan.md`.
2. **Three-tier token architecture**
   - Global (`--global-*`) -> Brand (`--brand-*`) -> Component (`--component-*`).
   - Define fallback strategy and token traceability from design to code.
3. **Component implementation standards**
   - Use Mantine v9 patterns and `@agenticverdict/ui` composition.
   - Avoid one-off UI implementations in auth routes.
   - Enforce reusable design-system usage in feature `.pen` files (including `auth.pen`) and corresponding route implementations.
4. **Accessibility and localization**
   - WCAG 2.1 AA compliance requirements.
   - RTL/LTR support with CSS logical properties and direction-aware behavior.
5. **Type safety and quality**
   - Strict TypeScript expectations (no `any`).
   - Test coverage expectations for unit, accessibility, and integration/visual verification.

### Deliverable

Produce one implementation-plan document with the exact sections below.

### Required Document Structure

1. **Executive Summary**
2. **Current State Assessment**
   - Design-system-to-code gap analysis (`/design/system` vs `/packages/ui`)
   - Auth route reuse gap analysis (`/apps/web/src/routes/$locale/auth`)
3. **Target Architecture**
   - Ownership boundaries (design assets, UI library, route layer)
   - Import/export and dependency model for reusable UI consumption
4. **Phase 1: Design Token Extraction Plan**
   - Token discovery, mapping, CSS variable generation, TS typings, theme override strategy
   - Deliverables, milestones, and acceptance criteria
5. **Phase 2: Component Generation Plan**
   - Component mapping from `.pen` structures to React/Mantine
   - Accessibility, keyboard behavior, RTL handling, anti-duplication rules
   - Deliverables, milestones, and acceptance criteria
6. **Phase 3: Integration Plan**
   - Adoption in `/apps/web/src/routes/$locale/auth`
   - Adoption and reuse enforcement in `/design/features/auth.pen` and future feature `.pen` files
   - Provider integration (theme/direction), route-level refactors, migration sequencing
   - Deliverables, milestones, and acceptance criteria
7. **Validation and Quality Gates**
   - Phase checklists, test strategy, parity verification, regression prevention
8. **Risks, Dependencies, and Mitigations**
9. **Definition of Done**

### Output Quality Requirements

- Use professional, implementation-focused language.
- Provide sequenced milestones and actionable tasks.
- Include measurable acceptance criteria per phase.
- Include explicit anti-patterns to avoid (hardcoded styles, directional CSS properties, duplicated auth UI primitives).
- Keep the plan practical and execution-oriented, not conceptual.
