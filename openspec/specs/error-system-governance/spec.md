## Purpose
Define governance guardrails that enforce canonical error-system adoption and prevent regressions to legacy error-handling patterns.

## Requirements

### Requirement: Registry compliance enforcement
Quality gates MUST fail changes that introduce runtime error codes not present in the canonical registry or bypass approved translation pathways.

#### Scenario: Pull request introduces non-compliant code
- **WHEN** CI detects unregistered error code usage in changed files
- **THEN** the build SHALL fail and identify each offending reference

### Requirement: Legacy-pattern prevention
Quality gates MUST detect and block message-string matching and other banned legacy error patterns in runtime-critical surfaces.

#### Scenario: Message-string matching added
- **WHEN** static checks find conditional logic matching raw error message text in protected paths
- **THEN** CI SHALL fail and require migration to canonical typed error handling

### Requirement: Translation coverage minimums
The project MUST maintain test coverage for error translators across required surfaces and enforce minimum thresholds for contract correctness.

#### Scenario: Translator tests are missing
- **WHEN** a change reduces translator coverage below the configured threshold
- **THEN** CI SHALL fail with guidance to restore required coverage
