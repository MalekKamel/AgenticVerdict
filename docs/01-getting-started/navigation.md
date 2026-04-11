# AgenticVerdict Documentation Navigation Guide

## Overview

This guide helps you navigate and utilize the AgenticVerdict documentation effectively. The documentation is structured to support different roles and use cases throughout the development lifecycle.

---

## Quick Start: Where to Begin

### For New Team Members

1. **Start Here:** Read [`requirements.md`](../05-project-management/requirements.md) and [`project-charter.md`](../05-project-management/project-charter.md) — Technical scope and project mission
2. **Understand the Approach:** Read [`methodology-overview.md`](../02-planning-and-methodology/methodology-overview.md) — Learn why we use a hybrid incremental approach
3. **Get the Big Picture:** Read [`project-overview.md`](project-overview.md) — Master overview of all phases
4. **Review Current Phase:** Navigate to the current phase folder for detailed tasks

### For Project Managers

1. **Master View:** [`project-overview.md`](project-overview.md) — Timeline, dependencies, and deliverables
2. **Quality Gates:** [`phase-transitions.md`](../02-planning-and-methodology/phase-transitions.md) — Approval workflow and exit criteria
3. **Risk Management:** [`methodology-overview.md`](../02-planning-and-methodology/methodology-overview.md) — Risk mitigation strategies

### For Developers

1. **Current Phase:** Go directly to your phase folder (e.g., `specs/00-core/00-foundation/`)
2. **Task Details:** Review `tasks.md` for specific implementation tasks
3. **Acceptance Criteria:** Check `acceptance-criteria.md` for completion requirements
4. **Testing Standards:** Review [`testing-strategy.md`](../02-planning-and-methodology/testing-strategy.md) for testing requirements

---

## Documentation Structure

```
docs/
├── README.md                         # Documentation hub
├── 00-overview/                      # Meta: structure plan, development status snapshot
├── 01-getting-started/
│   ├── project-overview.md
│   └── navigation.md                 # This file
├── 02-planning-and-methodology/
│   ├── methodology-overview.md
│   ├── testing-strategy.md
│   └── phase-transitions.md
├── (see /specs/ at repo root)        # Phase specs: specs/00-core/, future domains
├── 04-technology-research/           # By category: backend/, ai-and-automation/, etc.
├── 05-project-management/
└── 06-reference/
```

---

## Reading Paths by Role

### Executive/Stakeholder Path

**Purpose:** Understand timeline, deliverables, and business value

**Reading Order:**

1. [`project-overview.md`](project-overview.md) — Read Executive Summary and Phase Overview Table
2. [`project-overview.md`](project-overview.md) — Review Timeline section
3. [`methodology-overview.md`](../02-planning-and-methodology/methodology-overview.md) — Review Approach Comparison (first 2 sections only)
4. Phase `OVERVIEW.md` files — Review Key Outcomes section for business value

**Time Investment:** 30-45 minutes

---

### Technical Lead Path

**Purpose:** Understand architecture, dependencies, and technical decisions

**Reading Order:**

1. [`requirements.md`](../05-project-management/requirements.md) — Complete read (authoritative source)
2. [`project-overview.md`](project-overview.md) — Full read for project scope
3. [`methodology-overview.md`](../02-planning-and-methodology/methodology-overview.md) — Full read for approach rationale
4. [`testing-strategy.md`](../02-planning-and-methodology/testing-strategy.md) — Full read for quality standards
5. [`phase-transitions.md`](../02-planning-and-methodology/phase-transitions.md) — Full read for governance
6. Specs under [`../../specs/00-core/`](../../specs/00-core/) — `README.md`, `PLAN.md`, `TASKS.md`, and phase-specific operations (e.g. Connectors [`operations/README.md`](/specs/00-core/01-connectors/operations/README.md) including [`SECURITY.md`](/specs/00-core/01-connectors/operations/SECURITY.md))
7. [`../04-technology-research/`](../04-technology-research/) — Review research findings for deeper context

**Time Investment:** 3-4 hours

---

### Developer Path

**Purpose:** Understand implementation tasks and acceptance criteria for current phase

**Reading Order:**

1. [`requirements.md`](../05-project-management/requirements.md) — Read sections relevant to your work
2. Current Phase `PHASE_XX_OVERVIEW.md` — Understand phase objectives and approach
3. Current Phase `PHASE_XX_TASKS.md` — Find your assigned tasks
4. [`testing-strategy.md`](../02-planning-and-methodology/testing-strategy.md) — Understand testing requirements
5. Current Phase `PHASE_XX_ACCEPTANCE.md` — Understand completion criteria

**Time Investment:** 1-2 hours initially, 15-30 minutes per task

---

### QA Engineer Path

**Purpose:** Understand testing requirements and quality gates

**Reading Order:**

1. [`testing-strategy.md`](../02-planning-and-methodology/testing-strategy.md) — Complete read (testing philosophy)
2. [`phase-transitions.md`](../02-planning-and-methodology/phase-transitions.md) — Complete read (quality gates)
3. Current Phase `PHASE_XX_ACCEPTANCE.md` — Detailed acceptance criteria
4. Current Phase `PHASE_XX_TASKS.md` — Task-level testing requirements

**Time Investment:** 2-3 hours

---

## Phase Document Navigation

Each phase folder contains three documents with a specific purpose:

### 1. `PHASE_XX_OVERVIEW.md`

**Purpose:** High-level understanding of the phase

**When to Read:**

- Before starting a new phase
- When needing context for your work
- When understanding dependencies

**Key Sections:**

- Executive Summary
- Primary Objectives
- Success Criteria
- Dependencies on Previous Phases
- High-Level Approach
- Key Outcomes

**Reading Time:** 10-15 minutes

---

### 2. `PHASE_XX_TASKS.md`

**Purpose:** Detailed implementation tasks

**When to Read:**

- When assigned specific tasks
- When planning sprint work
- When estimating effort

**Key Sections:**

- Work Stream Breakdown
- Individual Task Details (description, acceptance criteria, estimates, dependencies)

**Reading Time:** 20-30 minutes (or reference specific tasks as needed)

---

### 3. `PHASE_XX_ACCEPTANCE.md`

**Purpose:** Phase completion requirements

**When to Read:**

- Before starting a phase (understand success criteria)
- During phase (track progress toward completion)
- At phase end (validate completion)

**Key Sections:**

- Functional Acceptance Criteria
- Performance Requirements
- Testing Requirements
- Sign-Off Checklist
- Exit Criteria

**Reading Time:** 15-20 minutes

---

## Workflow Guide

### Starting a New Phase

1. **Pre-Phase Review** (Week -1)
   - Read current phase's `OVERVIEW.md`
   - Review `ACCEPTANCE.md` from previous phase
   - Confirm previous phase exit criteria met
   - Assign tasks to team members

2. **Phase Kickoff** (Day 1)
   - Team review of `OVERVIEW.md`
   - Breakdown of `TASKS.md` into sprint work
   - Establish communication rhythms
   - Set up tracking boards

3. **During Phase** (Ongoing)
   - Daily reference to `TASKS.md` for specific task requirements
   - Weekly review of `ACCEPTANCE.md` to track completion
   - Update task status as work progresses

4. **Phase Completion** (Final Week)
   - Verify all acceptance criteria in `ACCEPTANCE.md` met
   - Conduct phase-end testing
   - Complete sign-off checklist
   - Document lessons learned

---

### Phase Transition Process

**Before Transitioning:**

1. Complete all acceptance criteria in current phase
2. Pass all quality gates in [`phase-transitions.md`](../02-planning-and-methodology/phase-transitions.md)
3. Obtain required sign-offs
4. Create transition summary document

**Go/No-Go Decision:**

- Use the decision framework in [`phase-transitions.md`](../02-planning-and-methodology/phase-transitions.md)
- Obtain stakeholder approval
- Document any conditions for transition

**After Approval:**

1. Archive current phase materials
2. Kick off next phase with team review
3. Update master roadmap status

---

## Quick Reference

### Finding Information By Topic

| Topic                      | Document                                                                      | Section               |
| -------------------------- | ----------------------------------------------------------------------------- | --------------------- |
| Project timeline           | [`project-overview.md`](project-overview.md)                                  | Phase Overview Table  |
| Phase dependencies         | [`project-overview.md`](project-overview.md)                                  | Phase Sequence        |
| Testing philosophy         | [`testing-strategy.md`](../02-planning-and-methodology/testing-strategy.md)   | Testing Philosophy    |
| Test coverage requirements | [`testing-strategy.md`](../02-planning-and-methodology/testing-strategy.md)   | Coverage Requirements |
| Phase approval process     | [`phase-transitions.md`](../02-planning-and-methodology/phase-transitions.md) | Approval Workflow     |
| Quality gates              | [`phase-transitions.md`](../02-planning-and-methodology/phase-transitions.md) | Quality Gates         |
| Current phase tasks        | `phases/phase-XX-*/PHASE_XX_TASKS.md`                                         | Work Stream Breakdown |
| Phase exit criteria        | `phases/phase-XX-*/PHASE_XX_ACCEPTANCE.md`                                    | Exit Criteria         |
| Architecture decisions     | [`requirements.md`](../05-project-management/requirements.md)                 | All sections          |
| Technology choices         | [`../04-technology-research/`](../04-technology-research/)                    | Research documents    |

---

## Symbols and Conventions

### Task Status Indicators

- **⏳ Not Started** — Task defined, not assigned
- **🔄 In Progress** — Work underway
- **✅ Complete** — Task finished and verified
- **⚠️ Blocked** — Cannot proceed due to dependency
- **❌ Failed** — Task failed, requires remediation

### Priority Levels

- **P0 — Critical** — Blocks phase completion
- **P1 — High** — Important for phase success
- **P2 — Medium** — Should complete in phase
- **P3 — Low** — Nice to have

### Dependency Symbols

- **↑** — Depends on previous phase
- **→** — Blocks next task
- **⚡** — Can run in parallel

---

## Keeping Documentation Current

### Weekly Reviews

Every week, the team should:

1. **Update Task Status** — Mark completed/in-progress tasks
2. **Review Dependencies** — Identify and resolve blockers
3. **Assess Timeline** — Compare progress against estimates
4. **Update Risks** — Add new risks, update existing ones
5. **Adjust Plans** — Re-estimate if needed, with justification

### Architecture Decision Records (ADRs)

For any significant architectural decision:

1. Create ADR in `docs/adr/` directory
2. Reference from relevant phase documentation
3. Update [`requirements.md`](../05-project-management/requirements.md) if foundational

### Scope Changes

For any scope modification:

1. Document change request with rationale
2. Assess impact on timeline and dependencies
3. Obtain approval using process in [`methodology-overview.md`](../02-planning-and-methodology/methodology-overview.md)
4. Update affected phase documents
5. Communicate changes to all stakeholders

---

## Tips for Effective Documentation Usage

### For Teams

- **Assign task ownership** — Every task should have a clear owner
- **Track progress visibly** — Use project management tools linked to documentation
- **Reference frequently** — Keep documentation open during development
- **Update as you go** — Don't wait until phase end to update status

### For Individuals

- **Read before doing** — Always read task details before starting
- **Ask questions** — Clarify ambiguities before estimating
- **Document decisions** — Record why you made specific choices
- **Test against acceptance** — Verify your work meets acceptance criteria

### For Leaders

- **Review weekly** — Regular documentation reviews keep everyone aligned
- **Remove blockers** — Act on dependency issues immediately
- **Celebrate milestones** — Acknowledge phase completions
- **Share learnings** — Document lessons learned for future phases

---

## Getting Help

### Questions About Documentation Structure

- Refer to this navigation guide
- Check [`methodology-overview.md`](../02-planning-and-methodology/methodology-overview.md) for approach rationale

### Questions About Specific Tasks

- Review task details in `PHASE_XX_TASKS.md`
- Check acceptance criteria in `PHASE_XX_ACCEPTANCE.md`
- Refer to [`testing-strategy.md`](../02-planning-and-methodology/testing-strategy.md) for testing guidance

### Questions About Architecture

- [`requirements.md`](../05-project-management/requirements.md) is the authoritative source
- Research documents in [`../04-technology-research/`](../04-technology-research/) provide additional context

### Questions About Process

- [`phase-transitions.md`](../02-planning-and-methodology/phase-transitions.md) for phase transitions
- [`testing-strategy.md`](../02-planning-and-methodology/testing-strategy.md) for testing processes

---

## Document Version History

| Version | Date       | Changes          | Author             |
| ------- | ---------- | ---------------- | ------------------ |
| 1.0     | 2026-04-03 | Initial creation | Documentation Team |

---

## Appendix: Quick Navigation Links

### Master Documents

- [Project Overview](project-overview.md)
- [Navigation Guide](navigation.md) — This file

### Planning and Methodology

- [Methodology Overview](../02-planning-and-methodology/methodology-overview.md)
- [Testing Strategy](../02-planning-and-methodology/testing-strategy.md)
- [Phase Transitions](../02-planning-and-methodology/phase-transitions.md)

### Phase Documentation

- [Phase 0: Foundation](/specs/00-core/00-foundation/PHASE_00_OVERVIEW.md)
- [Phase 1: Platform Integration](/specs/00-core/01-connectors/PHASE_01_OVERVIEW.md)
- [Phase 2: Agent Intelligence](/specs/00-core/02-intelligence/PHASE_02_OVERVIEW.md)
- [Phase 3: Report Generation](../../specs/00-core/03-insights/overview.md)
- [Phase 4: Production Hardening](/specs/00-core/04-production-hardening/PHASE_04_OVERVIEW.md)

### Research Documents

- [AI Agent Roadmap Best Practices](../04-technology-research/ai_agent_roadmap_best_practices.md)
- [Testing & Validation Strategies](../04-technology-research/testing_validation_strategies.md)
- [Phase 1 Foundation Components](../04-technology-research/phase_1_foundation_components.md)

### Authoritative Context

- [Requirements](../05-project-management/requirements.md) — Technical scope (see also [project charter](../05-project-management/project-charter.md))
