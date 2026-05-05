## ADDED Requirements

### Requirement: PDF Report Display
The system SHALL embed and display PDF reports in the viewer.

#### Scenario: PDF load
- **WHEN** user navigates to report viewer page with PDF report
- **THEN** system fetches report content and renders in PDF viewer

#### Scenario: Page navigation
- **WHEN** user clicks page number or next/previous
- **THEN** system navigates to the specified page in the PDF

#### Scenario: Zoom controls
- **WHEN** user clicks zoom in/out buttons
- **THEN** system adjusts PDF zoom level (50% - 200%)

### Requirement: Excel Report Display
The system SHALL display Excel report preview with sheet tabs.

#### Scenario: Excel preview load
- **WHEN** user navigates to report viewer page with Excel report
- **THEN** system fetches and displays first sheet as preview

#### Scenario: Sheet navigation
- **WHEN** report has multiple sheets
- **THEN** system displays sheet tabs and allows switching between them

#### Scenario: Download for full experience
- **WHEN** user wants full Excel functionality
- **THEN** system provides prominent download button

### Requirement: Report Actions
The system SHALL provide print, download, and share actions for reports.

#### Scenario: Print report
- **WHEN** user clicks "Print" button
- **THEN** system opens browser print dialog with report content

#### Scenario: Download report
- **WHEN** user clicks "Download" button
- **THEN** system initiates file download with appropriate filename

#### Scenario: Share report
- **WHEN** user clicks "Share" button
- **THEN** system opens share modal with token generation options

### Requirement: Loading State
The system SHALL display loading indicator while report is being fetched.

#### Scenario: Report loading
- **WHEN** report content is being fetched
- **THEN** system displays spinner with "Loading report..." message

### Requirement: Version Selector
The system SHALL allow viewing different versions of the same report.

#### Scenario: Multiple versions available
- **WHEN** report has multiple versions
- **THEN** system displays version selector dropdown

#### Scenario: Version switch
- **WHEN** user selects different version
- **THEN** system loads and displays that version's content
