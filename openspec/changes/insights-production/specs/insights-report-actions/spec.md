## ADDED Requirements

### Requirement: Report Actions (View, Download, Share, Bulk Download)
The system SHALL provide functional View, Download, Share, and Bulk Download actions for generated reports.

#### Scenario: View report navigation
- **WHEN** user clicks "View" button on a report
- **THEN** system navigates to the report viewer page with the report ID

#### Scenario: Download single report
- **WHEN** user clicks "Download" button on a report
- **THEN** system downloads the report file in the user's selected format (PDF or Excel)

#### Scenario: Share report opens modal
- **WHEN** user clicks "Share" button on a report
- **THEN** system opens the share modal with options to generate shareable link or invite collaborators

#### Scenario: Bulk download creates ZIP file
- **WHEN** user selects multiple reports (up to 10) and clicks "Download Selected"
- **THEN** system creates a ZIP file containing all selected reports and initiates download

#### Scenario: Bulk download progress indicator
- **WHEN** bulk download is processing more than 3 reports
- **THEN** system displays a progress indicator showing download status

#### Scenario: Bulk download limit enforcement
- **WHEN** user selects more than 10 reports for bulk download
- **THEN** system displays a warning and limits download to first 10 selected reports

#### Scenario: Bulk download error handling
- **WHEN** one or more reports fail to download during bulk operation
- **THEN** system displays an error toast listing the failed reports and offers retry

#### Scenario: Report actions from insight detail page
- **WHEN** user views recent reports in insight detail page
- **THEN** View, Download, and Share buttons are functional and behave identically to report list page
