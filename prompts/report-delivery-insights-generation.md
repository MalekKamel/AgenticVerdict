# Implementation Plan: Restore AI Insights Generation in Report Delivery

## Context

File: `apps/worker/src/queues/report-queues.ts`
Location: `defaultReportDeliveryProcessor` function (line ~627)

A `NOTE (R-C02 removed)` comment marks a removed `triggerAIInsightsGeneration` call. The removal was temporary, pending full `agent-runtime` pipeline integration (dependency: R-H01).

## Task

Analyze the current codebase and produce a comprehensive implementation plan document that covers:

1. **Dependency Analysis**: Identify all prerequisites for re-enabling AI insights generation, including the R-H01 dependency status and any required `agent-runtime` pipeline changes.

2. **Integration Points**: Determine how to wire the insights generation call into the existing `defaultReportDeliveryProcessor` flow, including:
   - Required input parameters (tenantId, reportId, report content)
   - Expected output and downstream consumers
   - Error handling and fallback behavior

3. **Implementation Steps**: Provide a sequenced, actionable list of code changes with file paths and line references.

4. **Testing Strategy**: Define unit and integration test cases to validate the restored functionality.

## Deliverable

Write the implementation plan to: `docs/plans/report-delivery-insights-generation-plan.md`
