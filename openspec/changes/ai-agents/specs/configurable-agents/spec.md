## ADDED Requirements

### Requirement: Insight-Driven Agent Configuration
The system SHALL create agents based on insight configurations stored in the database, enabling per-insight customization without code changes.

#### Scenario: Agent creation from insight config
- **WHEN** an insight is executed with a valid configuration
- **THEN** the InsightAgentFactory creates an agent with the configured system message, tools, and output format

#### Scenario: Custom system message per insight
- **WHEN** an insight configuration includes a custom system message
- **THEN** the agent uses the custom message instead of the default template

#### Scenario: Dynamic tool selection
- **WHEN** an insight configuration specifies enabled tools
- **THEN** the agent includes only the configured tools in its execution

#### Scenario: Output format customization
- **WHEN** an insight configuration specifies JSON output with a schema
- **THEN** the agent validates its output against the provided schema before returning

### Requirement: Legacy Code Removal
The system SHALL remove all hardcoded agent definitions from `specialized-marketing-agents.ts` to eliminate technical debt.

#### Scenario: Legacy file deletion
- **WHEN** the migration is complete
- **THEN** the file `specialized-marketing-agents.ts` no longer exists in the codebase

#### Scenario: Zero legacy references
- **WHEN** an AST scan runs on production code
- **THEN** zero references to `specialized-marketing-agents.ts` or its exports are found

#### Scenario: Consumer migration
- **WHEN** all consumers are updated to use InsightAgentFactory
- **THEN** all existing tests pass with the new implementation

### Requirement: Configurable Agent Factory
The system SHALL provide a factory for creating configurable agents with tenant-scoped configuration.

#### Scenario: Agent with tenant provider preference
- **WHEN** creating an agent for a tenant with custom provider preferences
- **THEN** the agent uses the tenant's configured provider and model

#### Scenario: Agent with prompt variables
- **WHEN** an insight configuration includes prompt variables
- **THEN** the agent substitutes variables into the system message at runtime

#### Scenario: Agent memory configuration
- **WHEN** an insight configuration specifies memory mode as 'conversation'
- **THEN** the agent maintains conversation history across multiple turns

### Requirement: AST Scan for Hardcoded References
The system SHALL provide an automated scan to detect hardcoded provider references in production code.

#### Scenario: Scan execution
- **WHEN** the AST scan runs on the codebase
- **THEN** it identifies all hardcoded provider IDs (openai, anthropic, google, bedrock) outside test files

#### Scenario: CI integration
- **WHEN** a PR is submitted
- **THEN** the CI pipeline runs the AST scan and fails if hardcoded references are found

#### Scenario: Allowed exceptions
- **WHEN** hardcoded references appear in test files or examples
- **THEN** the scan excludes them from the results
