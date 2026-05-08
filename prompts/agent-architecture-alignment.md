# Agent Architecture Alignment (Greenfield Implementation)

## Context

**Development Status:** Pre-production greenfield  
**Approach:** Destructive implementation without backward compatibility

The current implementation in `packages/agent-runtime/src/specialized-marketing-agents.ts` represents a legacy pattern with hardcoded marketing-specific agent logic. This conflicts with the target architecture defined in `/docs/architecture/business/business-architecture.md`, which requires:

- **Per-insight agent customization**: Each insight defines its own agent behavior
- **Dynamic configuration**: System messages, quality settings, and agent parameters are insight-scoped
- **Reusable agent infrastructure**: Platform-agnostic agent runtime decoupled from specific use cases

Related artifacts:

- Migration plan: `/docs/plans/ai-provider-migration-plan.md`
- Implementation tasks: `/openspec/changes/ai-providers/tasks.md`

## Objective

**Destructively replace** the hardcoded marketing agent implementation with a configurable, insight-driven agent runtime. No backward compatibility, no migration scripts, no parallel runs.

## Deliverables

1. **Remediation Analysis Document** (`/docs/plans/ai-provider/agent-architecture-remediation.md`):
   - Current state assessment of `specialized-marketing-agents.ts`
   - Gap analysis against business architecture requirements
   - Destructive implementation strategy
   - Risk assessment

2. **Updated Implementation Plan** (`/docs/plans/ai-provider/01-phase-1-foundation-and-integration.md`):
   - Replace Task 1.7 with configurable agent architecture
   - Add Phase 5 tasks for new implementation
   - Direct deletion of legacy code

## Success Criteria

- [ ] Agent runtime is fully decoupled from marketing-specific logic
- [ ] Insight configuration supports agent customization (system message, quality, tools)
- [ ] Legacy `specialized-marketing-agents.ts` deleted
- [ ] Zero legacy references remaining (verified via AST scan)
- [ ] All tests passing with new implementation
- [ ] 85%+ test coverage for new configurable agent system
