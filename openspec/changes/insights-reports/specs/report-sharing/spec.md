## ADDED Requirements

### Requirement: Share Token Generation
The system SHALL generate time-limited share tokens for report access.

#### Scenario: Generate share link
- **WHEN** user clicks "Generate Share Link" in share modal
- **THEN** system creates share token with configurable expiration

#### Scenario: Expiration selection
- **WHEN** user selects expiration time (1 hour, 24 hours, 7 days, 30 days)
- **THEN** system sets token expiration accordingly

#### Scenario: Share link display
- **WHEN** share token is generated
- **THEN** system displays shareable URL with copy button

### Requirement: Share Link Management
The system SHALL allow managing existing share links.

#### Scenario: View active shares
- **WHEN** report has active share links
- **THEN** system displays list with expiration times and remaining time

#### Scenario: Revoke share link
- **WHEN** user clicks "Revoke" on an active share
- **THEN** system invalidates the token immediately

#### Scenario: Expired shares
- **WHEN** share link expires
- **THEN** system displays as expired and removes from active list

### Requirement: Shared Report Access
The system SHALL allow accessing shared reports via token.

#### Scenario: Valid token access
- **WHEN** user navigates to shared report URL with valid token
- **THEN** system displays report viewer (download only, no edit/share actions)

#### Scenario: Expired token
- **WHEN** user navigates to shared report URL with expired token
- **THEN** system displays "This share link has expired" message

#### Scenario: Invalid token
- **WHEN** user navigates to shared report URL with invalid token
- **THEN** system displays "Invalid share link" message
