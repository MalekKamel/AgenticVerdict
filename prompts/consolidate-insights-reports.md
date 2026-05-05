# Insights Reports Specification Consolidation

## Context

Two related specification directories exist for the Insights Reports feature:

- `/openspec/changes/insights-reports/` — Original specification
- `/openspec/changes/insights-reports-production/` — Production completion spec

These specifications represent sequential phases of the same feature and should be unified into a single source of truth.

## Task

Consolidate both specification directories into a single, comprehensive specification:

1. **Merge Content**: Integrate all production-ready requirements from `insights-reports-production/` into the base `insights-reports/` specification
2. **Resolve Conflicts**: Identify and reconcile any conflicting requirements between the two specs
3. **Structure**: Organize the consolidated spec with clear sections for:
   - Core requirements (from original spec)
   - Production requirements (from completion spec)
   - Implementation phases
4. **Greenfield Approach**: Treat the consolidation as a greenfield implementation, ensuring clean architecture without legacy constraints

## Deliverable

A single, unified specification directory at `/openspec/changes/insights-reports/` that serves as the authoritative source for the Insights Reports feature implementation.

## Acceptance Criteria

- [ ] All requirements from both specs are preserved and organized
- [ ] No duplicate or conflicting requirements remain
- [ ] Clear implementation phases are defined
- [ ] The production spec directory (`insights-reports-production/`) is archived or removed after consolidation
