# Legacy Code Remediation Plan Request

## Context

The unified agent factory implementation has been completed as a greenfield implementation (see `/docs/plans/unified-agent-factory-implementation.md`). This new implementation was designed without backward compatibility constraints to enable a clean architecture.

However, legacy and migration code remains in the codebase, specifically:

- `/packages/agent-runtime/src/marketing-agents-migration.ts` contains deprecated migration logic
- Additional legacy implementations may exist in other locations within the agent-runtime package

## Objective

Conduct a comprehensive analysis of the codebase to identify all remaining legacy and migration code, then produce a detailed remediation plan for complete removal.

## Required Deliverables

Create a remediation plan document that includes:

1. **Inventory of Legacy Code**
   - All files containing legacy/migration implementations
   - Dependencies between legacy and new implementations
   - Code paths that still reference legacy modules

2. **Risk Assessment**
   - Impact analysis of removing each legacy component
   - Tests or validations that depend on legacy code
   - Potential breaking changes for downstream consumers

3. **Remediation Strategy**
   - Prioritized removal sequence (dependencies first)
   - Code ownership and validation requirements
   - Rollback considerations if needed

4. **Validation Plan**
   - Tests to verify new implementation handles all legacy use cases
   - Integration points to verify post-removal
   - Performance or behavioral regression checks

## Output Format

Write the remediation plan to `/docs/plans/legacy-code-remediation.md`

## Constraints

- Do not remove any code during analysis phase
- Ensure new agent factory implementation is not affected
- Maintain test coverage thresholds per `docs/05-reference/testing-policy.md`
