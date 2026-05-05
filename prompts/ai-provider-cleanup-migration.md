# AI Provider Legacy Cleanup and Migration Plan

## Context

This prompt addresses the completion of AI provider migration based on:

- **Source Tasks:** `/openspec/changes/ai-providers/tasks.md`
- **Migration Plan:** `/docs/plans/ai-provider-migration-plan.md`

All Phase 1-4 implementation tasks have been completed. However, legacy implementations remain in the codebase and require complete removal.

## Objective

Execute a comprehensive cleanup of all legacy AI provider implementations and ensure full replacement with the new configuration-driven architecture.

## Scope

### In Scope

1. **Legacy Code Identification**
   - Hardcoded provider implementations (e.g., `glm-config.ts`, `langchain-integration.ts`, `configurable-llm-agent.ts`)
   - Direct LangChain imports in application code
   - Environment variable-based API key configurations
   - Backward compatibility layers and shims

2. **Destructive Removal**
   - Delete all legacy provider configuration files
   - Remove hardcoded API keys and credentials
   - Eliminate backward compatibility wrappers
   - Clean up deprecated imports and dependencies

3. **Validation**
   - AST-based code scanning for legacy references
   - Test suite verification (zero regressions)
   - Tenant isolation validation
   - Security scan for exposed credentials

### Out of Scope

- Database migrations (greenfield pre-production environment)
- Backward compatibility support
- Data migration from legacy systems
- Production rollback planning

## Constraints

- **Greenfield Development:** This is a pre-production codebase with no backward compatibility requirements
- **Destructive Approach Preferred:** Always delete legacy code rather than maintaining compatibility layers
- **No Database Migrations:** Schema changes should use destructive resets, not migrations
- **Security First:** Zero tolerance for hardcoded credentials or tenant isolation breaches

## Required Deliverables

Produce a comprehensive implementation plan document (`/docs/plans/ai-provider-cleanup-plan.md`) that includes:

1. **Legacy Code Inventory**
   - Complete file-by-file list of all legacy implementations to remove
   - Import/dependency graph showing legacy references
   - Risk assessment for each removal target

2. **Removal Sequence**
   - Dependency-ordered removal checklist
   - Validation checkpoints between each removal phase
   - Rollback procedure (code restore from version control only)

3. **Validation Strategy**
   - AST-based scanning configuration for legacy pattern detection
   - Test coverage requirements (85% overall, 90% critical paths)
   - Tenant isolation test scenarios
   - Security scan configuration

4. **Success Criteria**
   - Zero hardcoded API keys in codebase
   - Zero direct LangChain provider imports
   - Zero legacy configuration files
   - 100% test suite pass rate
   - All providers accessible only through `ProviderFactory`

5. **Timeline**
   - Estimated effort per removal phase
   - Validation and testing time allocation
   - Security audit checkpoint

## Format

Write the implementation plan as a Markdown document following the structure and style of `/docs/plans/ai-provider-migration-plan.md`.

## Notes

- Reference the completed tasks in `/openspec/changes/ai-providers/tasks.md` Phase 3 (Tasks 3.47-3.57) as the foundation
- This is a **cleanup operation**, not a migration—no parallel run or gradual cutover required
- Assume the new implementation is fully functional and tested
- Focus exclusively on identifying and removing legacy code with validation
