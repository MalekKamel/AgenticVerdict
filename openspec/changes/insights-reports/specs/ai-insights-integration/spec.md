## ADDED Requirements

### Requirement: AI Insights Integration
The system SHALL integrate with agent-runtime to generate AI-powered insights from report data, displaying performance summaries, findings, and recommendations.

#### Scenario: Generate AI insights after report completion
- **WHEN** report generation completes successfully
- **THEN** system triggers AI insights generation with report data as context

#### Scenario: Display AI insights in detail page
- **WHEN** user views insight detail page with completed report
- **THEN** system displays performance summary, key findings, and recommendations from AI

#### Scenario: Handle AI service unavailable
- **WHEN** agent-runtime is unavailable or times out
- **THEN** system shows "AI insights unavailable" message with retry button

#### Scenario: Cache AI insights
- **WHEN** AI insights are generated for a report
- **THEN** system caches insights to avoid regenerating on every page load
