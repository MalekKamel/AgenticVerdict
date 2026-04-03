# Phase Documentation Prompt Template

**Project:** AgenticVerdict — Multi-Platform Marketing Analytics Agent System

**Phase:** `{PHASE_NUMBER}: {PHASE_NAME}`

**Context Documents:**
- Primary Roadmap: `/docs/05-project-management/roadmap-development.md`
- System Requirements: `/docs/05-project-management/requirements.md`
- Project Charter: `/docs/05-project-management/project-charter.md`
- Technology Research: `/docs/04-technology-research/`
- Testing Strategy: `/docs/02-planning-and-methodology/testing-strategy.md`

---

## Assignment

Conduct a comprehensive analysis of the project roadmap and produce detailed documentation for **Phase {PHASE_NUMBER}: {PHASE_NAME}**. This phase `{PHASE_BRIEF_DESCRIPTION}`.

## Required Deliverables

Create the following documentation files in `/docs/03-development-phases/phase-{PHASE_NUMBER padded with leading zero}-{phase-slug}/`:

### 1. `overview.md`

**Purpose:** High-level understanding of the phase

**Contents:**
- Executive summary of Phase {PHASE_NUMBER} objectives
- Alignment with overall project goals and multi-tenancy requirements
- Position within the overall development roadmap
- Dependencies and prerequisites (previous phases, external dependencies)
- Success criteria and measurable outcomes
- Risk assessment and mitigation strategies
- Key architectural decisions (if applicable to this phase)

### 2. `tasks.md`

**Purpose:** Comprehensive task breakdown for implementation

**Contents:**
- Hierarchical task breakdown with clear, actionable items
- Task dependencies and sequencing (including critical path)
- Estimated effort and complexity ratings
- Resource requirements and skill considerations
- Integration points with subsequent phases
- Cross-cutting concerns (security, observability, i18n, multi-tenancy)

**Task Template Format:**
```markdown
### {TASK_GROUP_NAME}

| Task ID | Description | Complexity | Estimated Effort | Dependencies | Status |
|---------|-------------|------------|------------------|--------------|--------|
| {PHASE_NUMBER}.1 | {Task description} | Low/Medium/High | {Hours/Days} | {Task IDs} | TODO |
```

### 3. `acceptance-criteria.md`

**Purpose:** Validation and quality assurance standards

**Contents:**
- Detailed acceptance criteria for each deliverable
- Testing and validation requirements (unit, integration, E2E)
- Quality gates and performance benchmarks
- Definition of done for phase completion
- Phase exit criteria aligned with roadmap standards
- Rollback criteria (if phase completion fails)

**Acceptance Criteria Template Format:**
```markdown
### {DELIVERABLE_NAME}

**Functional Requirements:**
- [ ] {Specific, testable requirement}

**Non-Functional Requirements:**
- [ ] {Performance, security, or quality requirement}

**Testing Requirements:**
- Unit test coverage: {Target percentage}%
- Integration tests: {Required test scenarios}
- E2E tests: {Critical user paths}

**Exit Criteria:**
- {Specific condition that must be met}
```

### 4. `README.md` (Phase Index)

**Purpose:** Navigation and quick reference for the phase

**Contents:**
- Phase summary and objectives
- Links to all phase documentation
- Quick start checklist
- Common workflows and commands
- Troubleshooting guide for phase-specific issues

---

## Key Focus Areas for Phase {PHASE_NUMBER}

{PHASE_SPECIFIC_FOCUS_AREAS}

### Universal Focus Areas (Apply to All Phases)

Ensure the documentation addresses:

1. **Multi-Tenancy Compliance**
   - Tenant isolation at all layers (application, database, API)
   - AsyncLocalStorage context propagation
   - Row-level security for all data access

2. **Configuration-Driven Design**
   - No company-specific hardcoding
   - All behavior via `CompanyConfig` injection
   - Dynamic platform enablement

3. **Type Safety & Validation**
   - Zero `any` types
   - Strict TypeScript mode
   - Zod runtime validation

4. **Testing Standards**
   - Coverage targets per testing strategy document
   - Critical path identification and testing
   - Mock strategy for external dependencies

5. **Observability**
   - Structured logging with Pino
   - Metrics collection with Prometheus
   - Distributed tracing considerations

6. **Error Handling**
   - Graceful degradation patterns
   - Circuit breaker implementation
   - Retry logic with exponential backoff

---

## Documentation Standards

**Structure:**
- Maintain consistency with existing documentation structure
- Use Markdown with proper heading hierarchy
- Include code examples where applicable
- Provide clear success metrics
- Cross-reference related documents

**Language:**
- Clear, professional, and concise
- Active voice for requirements and tasks
- Specific and measurable (avoid ambiguous terms)

**Quality:**
- All tasks traceable to roadmap objectives
- Acceptance criteria are objective and verifiable
- Dependencies on technology choices justified by research documentation
- Each phase enables subsequent phases without architectural rework

---

## Success Criteria for This Assignment

- [ ] All documentation follows established project conventions
- [ ] Phase {PHASE_NUMBER} tasks are directly traceable to roadmap objectives
- [ ] Acceptance criteria are objective and verifiable
- [ ] Dependencies on technology choices are justified by research documentation
- [ ] The phase enables subsequent phases without requiring architectural changes
- [ ] Multi-tenancy patterns are consistent across all documented tasks
- [ ] Testing requirements align with `/docs/02-planning-and-methodology/testing-strategy.md`
- [ ] All focus areas from the roadmap are addressed

---

## Phase Transition Checklist

Before marking Phase {PHASE_NUMBER} complete, verify:

- [ ] All tasks in `tasks.md` are completed
- [ ] All acceptance criteria in `acceptance-criteria.md` are met
- [ ] Test coverage meets or exceeds targets
- [ ] Documentation is complete and accurate
- [ ] Code reviews completed and approved
- [ ] No critical bugs or known security issues
- [ ] Performance benchmarks met (if applicable)
- [ ] Phase retrospective completed

---

**Document Version:** 1.0
**Template Last Updated:** 2025-04-03
**Status:** Ready for Use

---

## Placeholder Reference Guide

When using this template for a specific phase, replace the following placeholders:

| Placeholder | Description | Example |
|-------------|-------------|---------|
| `{PHASE_NUMBER}` | Phase number (integer) | `0`, `1`, `2` |
| `{PHASE_NUMBER padded with leading zero}` | Two-digit phase number | `00`, `01`, `02` |
| `{PHASE_NAME}` | Phase name (title case) | `Foundation`, `Platform Integration` |
| `{phase-slug}` | URL-friendly phase name | `foundation`, `platform-integration` |
| `{PHASE_BRIEF_DESCRIPTION}` | One-sentence phase summary | `establishes the core infrastructure...` |
| `{PHASE_SPECIFIC_FOCUS_AREAS}` | Custom focus areas for this phase | See individual phase templates |
