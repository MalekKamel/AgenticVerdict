# Context Optimization Remediation Roadmap

## 1. Objective

Reduce baseline token overhead by >60% and establish a modular instruction architecture.

## 2. Phase 1: Foundation & Skill Creation (Immediate)

**Goal:** Prepare the containers for migrated data.

- [ ] Create `architecture-governance` skill: Move "Architecture Essentials" from `AGENTS.md`.
- [ ] Create `coding-standards` skill: Move "Key Conventions" and "TypeScript/Logging/Error" rules from `AGENTS.md`.
- [ ] Create `ci-governance` skill: Move "CI/CD Pipeline" and "PR Workflow" from `AGENTS.md`.
- [ ] Update `testing-policy` skill: Absorb "Testing Strategy" and "Mock Adapter" sections from `AGENTS.md`.

## 2. Phase 2: Refactoring AGENTS.md (Consolidation)

**Goal:** Shrink the primary onboarding file to a high-signal "Quick Start".

- [ ] Strip "Architecture," "Testing," "CI/CD," "Frontend," and "Backend" sections.
- [ ] Replace stripped sections with pointers to the new/updated skills.
- [ ] Retain only: Quick Start commands, Monorepo high-level structure, and Multi-tenancy core rules.
- [ ] Consolidate "Troubleshooting" into a dynamic skill or `docs/`.

## 3. Phase 3: CLAUDE.md Alignment & Cleanup

**Goal:** Finalize the IDE bridge and eliminate redundancy.

- [ ] Thin out `CLAUDE.md`: Keep only non-negotiable constraints and the trigger matrix.
- [ ] Ensure all trigger patterns point to the newly expanded skills.
- [ ] Finalize `docs/05-reference/skills-reference.md` to reflect the new modular architecture.
- [ ] Verify token count reduction and reasoning precision.

## 4. Success Metrics

- Baseline context size < 10k tokens.
- Zero duplication of the "Skill Trigger Matrix".
- Successful auto-triggering of the new `architecture-governance` skill during planning phases.
