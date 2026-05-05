## ADDED Requirements

### Requirement: Automatic AI Insights Generation
The system SHALL automatically generate AI insights after report completion without requiring manual trigger.

#### Scenario: Auto-generation trigger on report completion
- **WHEN** a report generation job completes successfully
- **THEN** backend worker automatically triggers AI insights generation job

#### Scenario: AI insights card auto-refresh
- **WHEN** AI insights generation completes
- **THEN** the AI insights card on the insight detail page refreshes automatically via React Query invalidation

#### Scenario: Loading state during auto-generation
- **WHEN** AI insights are being generated
- **THEN** the AI insights card displays a loading indicator

#### Scenario: Manual trigger remains available
- **WHEN** user clicks "Generate Insights" button
- **THEN** system triggers AI insights generation regardless of auto-generation status

#### Scenario: Error handling for auto-generation failure
- **WHEN** automatic AI insights generation fails
- **THEN** system logs the error and allows manual retry without blocking the user
