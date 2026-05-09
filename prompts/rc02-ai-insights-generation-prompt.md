# R-C02: AI Insights Auto-Generation Implementation Plan

## Context

`apps/worker/src/queues/report-queues.ts` contains a removed call to `triggerAIInsightsGeneration` at lines 626-631:

```typescript
// NOTE (R-C02 removed): triggerAIInsightsGeneration call removed pending
// full agent-runtime pipeline integration (depends on R-H01).
// To re-enable: call agent-runtime to generate AI insights from the
// delivered report, passing tenantId, reportId, and report content.
```

The dependency R-H01 (wiring `platformDeps` in `runPipelineWorkflow`) is now satisfied. This feature should be re-implemented to automatically generate AI insights after successful report delivery.

## Objective

Design and document a comprehensive implementation plan for re-enabling `triggerAIInsightsGeneration` — a function that invokes the agent-runtime intelligence pipeline after report delivery and persists the generated insights.

## Task

1. **Analyze Current State**
   - Review `defaultReportDeliveryProcessor` and the removed call site
   - Identify existing patterns (`defaultInsightExecutionProcessor`, `runPipelineWorkflow`, `toGeneratedInsights`)
   - Determine what infrastructure is missing (e.g., `generated_insights` database table)
   - Assess the current state of R-H01 dependency resolution

2. **Design the Solution**
   - Define the `triggerAIInsightsGeneration` function signature and implementation approach
   - Specify the database schema for persisting generated insights
   - Determine how the function integrates into the delivery pipeline (inline vs. async enqueue)
   - Define error handling, timeout guards, and graceful degradation when LLM keys are unavailable

3. **Produce the Implementation Plan**
   - Write a comprehensive plan document covering:
     - Problem statement and current state analysis
     - Design decision rationale (implement vs. remove)
     - Phased implementation steps with file-level detail
     - Database schema definition
     - Testing strategy (unit + integration)
     - Observability requirements (metrics, structured logging)
     - Dependency order and acceptance criteria
     - Risk assessment with mitigations

## Constraints

- **Architectural Compliance**: Follow established monorepo structure, multi-tenant guardrails, and tenant-scoped database access (`dbScoped`)
- **Pattern Consistency**: Mirror existing patterns from `defaultInsightExecutionProcessor` and `runPipelineWorkflow`
- **Non-Blocking**: Insight generation must not prevent report delivery from completing on failure
- **Strict Typing**: All interfaces, parameters, and return types must be fully typed
- **Error Handling**: Use the canonical error system (AppFault, error codes, structured logging)
- **LLM Credential Guard**: Gracefully skip when no LLM keys are configured

## Deliverable

A single implementation plan document that serves as the authoritative guide for re-enabling AI insights auto-generation after report delivery.

## Success Criteria

- All missing infrastructure is identified and specified
- The proposed function API is clear, typed, and consistent with existing patterns
- Implementation steps are explicit, ordered, and independently testable
- Error handling and degradation paths are fully defined
- No regression risk to the existing report delivery pipeline
