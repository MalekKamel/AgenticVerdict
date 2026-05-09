## ADDED Requirements

### Requirement: Complete Insights Localization Coverage
The system MUST include all `insights.*` namespace keys (~40+ keys) in all supported locale files (`en.json`, `ar.json`, `es.json`, `zh.json`, `fr.json`) with professional translations.

#### Scenario: All locales have insight keys
- **WHEN** the application loads any supported locale
- **THEN** all `insights.*` keys are present and resolve to translated strings
- **AND** no missing key warnings appear in the console

#### Scenario: Translation parity test passes
- **WHEN** the translation parity test is run
- **THEN** all locales have the same set of `insights.*` keys
- **AND** no locale is missing keys present in `en.json`

### Requirement: Wizard Navigation i18n
The system MUST localize all wizard step button texts ("Cancel", "Back", "Next", "Create Insight") using `t()` calls with dedicated i18n keys rather than hardcoded English strings.

#### Scenario: Wizard buttons display in current locale
- **WHEN** a user navigates the insight creation wizard with a non-English locale
- **THEN** all button texts are displayed in the selected language
- **AND** no hardcoded English strings appear in the UI

### Requirement: API Error Message Localization
The system MUST reference i18n keys for API error messages returned to the frontend, enabling localized error display rather than hardcoded English messages.

#### Scenario: API errors display in user's locale
- **WHEN** an API error occurs during insight operations
- **THEN** the error message references an i18n key
- **AND** the frontend displays the localized error message
