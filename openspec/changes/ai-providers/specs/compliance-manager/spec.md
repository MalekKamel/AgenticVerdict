## ADDED Requirements

### Requirement: PII Redaction
The system SHALL redact personally identifiable information before sending requests to providers.

#### Scenario: Redact email addresses
- **WHEN** a message contains email addresses
- **THEN** they SHALL be replaced with `[EMAIL_REDACTED]` before provider call

#### Scenario: Redact phone numbers
- **WHEN** a message contains phone numbers
- **THEN** they SHALL be replaced with `[PHONE_REDACTED]` before provider call

#### Scenario: Redact personal names
- **WHEN** a message contains personal names (detected via NER)
- **THEN** they SHALL be replaced with `[NAME_REDACTED]` before provider call

#### Scenario: Configurable redaction
- **WHEN** PII redaction is disabled for a tenant
- **THEN** PII SHALL NOT be redacted (tenant opt-out)

### Requirement: Audit Logging
The system SHALL log all AI decisions for compliance and auditing.

#### Scenario: Log AI request
- **WHEN** an AI request is made
- **THEN** an audit log entry SHALL be created with: tenantId, providerId, modelId, timestamp, requestId

#### Scenario: Log AI response
- **WHEN** an AI response is received
- **THEN** an audit log entry SHALL be created with: decision summary, token usage, latency

#### Scenario: Include tenant context
- **WHEN** audit logs are created
- **THEN** they SHALL include full tenant context for isolation

#### Scenario: Retain audit logs
- **WHEN** audit logs are created
- **THEN** they SHALL be retained for the configured retention period (default: 365 days)

### Requirement: Data Residency Configuration
The system SHALL support data residency requirements for different regions.

#### Scenario: Configure data residency
- **WHEN** a tenant is configured with a data residency (US, EU, APAC)
- **THEN** all AI requests SHALL use providers compliant with that residency

#### Scenario: Enforce EU data residency
- **WHEN** a tenant has EU data residency
- **THEN** requests SHALL only use providers with EU data centers or EU adequacy decisions

#### Scenario: Reject non-compliant providers
- **WHEN** a provider does not support the tenant's data residency
- **THEN** the provider SHALL be rejected with an appropriate error

### Requirement: GDPR Compliance Checks
The system SHALL enforce GDPR compliance requirements.

#### Scenario: Right to erasure
- **WHEN** a tenant requests data erasure
- **THEN** all credentials, audit logs, and cached data SHALL be deleted

#### Scenario: Data portability
- **WHEN** a tenant requests their data
- **THEN** all tenant data SHALL be exportable in a structured format

#### Scenario: Consent tracking
- **WHEN** AI processing requires consent
- **THEN** consent status SHALL be tracked and verified before processing

### Requirement: Compliance Configuration
The system SHALL support configurable compliance settings per tenant.

#### Scenario: Configure retention period
- **WHEN** a tenant configures data retention
- **THEN** audit logs and cached data SHALL be deleted after the configured period

#### Scenario: Enable/disable audit logging
- **WHEN** a tenant disables audit logging
- **THEN** audit logs SHALL NOT be created (where legally permissible)

#### Scenario: Configure PII redaction strictness
- **WHEN** a tenant configures PII redaction level
- **THEN** redaction SHALL follow the configured strictness (minimal, standard, strict)
