## ADDED Requirements

### Requirement: Wizard Step i18n Coverage
The system MUST source all UI strings in insight wizard step components from i18n localization files under the `insights` namespace, with zero hardcoded English strings in component source.

#### Scenario: BasicInfoStep uses i18n for all labels
- **WHEN** `BasicInfoStep` renders
- **THEN** all labels ("Insight Name", "Domain", "Description"), placeholders, and helper text are resolved via `useTranslations("insights")`
- **AND** no hardcoded English strings appear in the component source

#### Scenario: AISettingsStep uses i18n for all labels and descriptions
- **WHEN** `AISettingsStep` renders
- **THEN** all labels ("AI Model", "Analysis Quality", "Detail Level", "Custom Instructions"), descriptions, slider marks ("Fast", "Balanced", "Detailed", "Comprehensive"), and helper text are resolved via `useTranslations("insights")`
- **AND** no hardcoded English strings appear in the component source

#### Scenario: ScheduleDeliveryStep uses i18n for all labels
- **WHEN** `ScheduleDeliveryStep` renders
- **THEN** all labels ("Frequency", "Hour of Day", "Report Format", "Email Recipients", "Enable Webhook Delivery", "Webhook URL") and helper text are resolved via `useTranslations("insights")`
- **AND** no hardcoded English strings appear in the component source

#### Scenario: ConnectorSelectionStep uses i18n for all text
- **WHEN** `ConnectorSelectionStep` renders
- **THEN** "Select Connectors", "Manage Connectors", "Connected", "Disconnected" badge text, and all other strings are resolved via `useTranslations("insights")`
- **AND** no hardcoded English strings appear in the component source

#### Scenario: MetricConfigurationStep uses i18n for all text
- **WHEN** `MetricConfigurationStep` renders
- **THEN** "Select Metrics for Each Connector" and all other strings are resolved via `useTranslations("insights")`
- **AND** no hardcoded English strings appear in the component source

#### Scenario: ReviewStep uses i18n for all section titles and field labels
- **WHEN** `ReviewStep` renders
- **THEN** section titles ("Basic Information", "Connectors & Metrics", "AI Settings", "Schedule & Delivery") and all field labels are resolved via `useTranslations("insights")`
- **AND** no hardcoded English strings appear in the component source

### Requirement: Page-Level i18n Coverage
The system MUST source all UI strings in insight page components from i18n localization files, including table headers, button labels, modal titles, and notification messages.

#### Scenario: InsightDetailPage uses i18n for reports table
- **WHEN** `InsightDetailPage` renders the reports table
- **THEN** table headers ("Title", "Status", "Created", "Actions") and button labels ("View", "Download", "Share") are resolved via `useTranslations("insights")`
- **AND** the share modal title ("Share Report"), button ("Generate Share Link"), and notification ("Link copied") are resolved via `useTranslations("insights")`

#### Scenario: InsightListPage uses i18n for all UI text
- **WHEN** `InsightListPage` renders
- **THEN** all page-level strings, filter labels, action buttons, and empty-state text are resolved via `useTranslations("insights")`

### Requirement: Validation Error Code Mapping
The system MUST define validation error codes in `validation.ts` as string constants (e.g., `"NAME_REQUIRED"`, `"DOMAIN_REQUIRED"`) and map them to i18n keys at display time in form components.

#### Scenario: Validation returns error codes
- **WHEN** form validation fails
- **THEN** the validation function returns error code strings (not localized messages)
- **AND** the error codes are deterministic and match a predefined set

#### Scenario: Form components map codes to i18n messages
- **WHEN** a form component receives validation error codes
- **THEN** each code is mapped to an i18n key via `t()` and displayed as a localized message
- **AND** the mapping is consistent across all form components using the validation

### Requirement: Prop-Driven Dropdown Options
The system MUST pass dropdown option arrays (detail level, frequency, format) as props from parent components to wizard step components, derived from schema enums rather than hardcoded in UI components.

#### Scenario: AISettingsStep receives detailLevelOptions as prop
- **WHEN** `AISettingsStep` renders
- **THEN** detail level options are received via the `detailLevelOptions` prop
- **AND** the parent derives options from `InsightAIConfigSchema.detailLevel` enum values

#### Scenario: ScheduleDeliveryStep receives frequencyOptions and formatOptions as props
- **WHEN** `ScheduleDeliveryStep` renders
- **THEN** frequency and format options are received via `frequencyOptions` and `formatOptions` props
- **AND** the parent derives options from `InsightScheduleSchema.frequency` and `InsightDeliverySchema.format` enum values
