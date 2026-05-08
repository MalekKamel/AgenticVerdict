## ADDED Requirements

### Requirement: Tenant Provider Configuration
The system SHALL allow tenants to configure AI providers at the tenant level, establishing default providers for all domains and connectors.

#### Scenario: Tenant selects a provider
- **WHEN** a tenant administrator selects an AI provider from the available providers list
- **THEN** the system SHALL save the provider configuration with scope "tenant" and apply it as the default for all domains

#### Scenario: Tenant configures provider credentials
- **WHEN** a tenant administrator enters API credentials for a selected provider
- **THEN** the system SHALL encrypt and store the credentials securely, never exposing them in logs or responses

#### Scenario: Tenant enables/disables provider
- **WHEN** a tenant administrator toggles a provider's enabled state
- **THEN** the system SHALL immediately update the provider status and propagate to all dependent domains

### Requirement: Domain Provider Override
The system SHALL allow domains to override tenant-level provider configurations with domain-specific providers.

#### Scenario: Domain overrides tenant provider
- **WHEN** a domain administrator selects a different provider than the tenant default
- **THEN** the system SHALL save the domain-specific configuration with scope "domain" and mark it as an override

#### Scenario: Domain inherits tenant provider
- **WHEN** a domain has no explicit provider configuration
- **THEN** the system SHALL resolve to the tenant-level provider configuration

#### Scenario: Override inheritance visualization
- **WHEN** a user views domain provider settings
- **THEN** the system SHALL display a visual indicator showing whether the domain uses tenant default or has an override

### Requirement: Hierarchical Configuration Resolution
The system SHALL resolve AI provider configurations using a hierarchical approach: connector → domain → tenant.

#### Scenario: Configuration resolution with all levels defined
- **WHEN** connector, domain, and tenant all have explicit provider configurations
- **THEN** the system SHALL return the connector-level configuration (most specific wins)

#### Scenario: Configuration resolution with gaps
- **WHEN** only tenant-level configuration exists
- **THEN** the system SHALL return the tenant-level configuration after checking domain and connector levels

#### Scenario: Configuration resolution performance
- **WHEN** a configuration resolution request is made
- **THEN** the system SHALL resolve the configuration in <10ms p95 latency (with caching enabled)

### Requirement: Provider Validation
The system SHALL validate AI provider configurations before saving and test connectivity.

#### Scenario: Provider credential validation
- **WHEN** a user submits provider credentials
- **THEN** the system SHALL validate the credentials format and test API connectivity before saving

#### Scenario: Circular inheritance detection
- **WHEN** a configuration would create circular inheritance (e.g., domain A inherits from B, B inherits from A)
- **THEN** the system SHALL reject the configuration with an error message

#### Scenario: Provider health check
- **WHEN** a provider configuration is saved or updated
- **THEN** the system SHALL perform a health check and report the provider status (healthy/unhealthy/unknown)
