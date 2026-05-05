## ADDED Requirements

### Requirement: Arabic Localization for Insights and Reports
The system SHALL provide complete Arabic translations for all insights, reports, and audit trail UI strings with proper RTL layout support.

#### Scenario: Display insights page in Arabic
- **WHEN** user selects Arabic language (ar)
- **THEN** all insights UI strings display in Arabic with RTL layout

#### Scenario: Display reports UI in Arabic
- **WHEN** user views reports section with Arabic locale
- **THEN** all reports-related strings display in Arabic

#### Scenario: Display audit trail in Arabic
- **WHEN** user views audit trail with Arabic locale
- **THEN** all audit trail labels and actions display in Arabic

#### Scenario: Handle string interpolation
- **WHEN** Arabic strings contain variables (counts, names, dates)
- **THEN** system properly interpolates variables with correct RTL formatting

#### Scenario: Handle pluralization in Arabic
- **WHEN** Arabic strings require plural forms
- **THEN** system uses correct Arabic pluralization rules (0, 1, 2, 3-10, 11+)
