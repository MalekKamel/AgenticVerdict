## ADDED Requirements

### Requirement: Report Table Display
The system SHALL display reports in a sortable, paginated table.

#### Scenario: Report list load
- **WHEN** user navigates to report list page
- **THEN** system displays reports with name, date, format, size, and action buttons

#### Scenario: Column sorting
- **WHEN** user clicks column header
- **THEN** system sorts reports by that column (ascending/descending)

#### Scenario: Pagination
- **WHEN** total reports exceed page size
- **THEN** system displays pagination controls

### Requirement: Report Filtering
The system SHALL allow filtering reports by date range, format, and status.

#### Scenario: Date range filter
- **WHEN** user selects date range
- **THEN** system displays only reports within the selected range

#### Scenario: Format filter
- **WHEN** user selects PDF or Excel format
- **THEN** system displays only reports matching the selected format

#### Scenario: Search by name
- **WHEN** user types in search input
- **THEN** system filters reports by name (case-insensitive partial match)

### Requirement: Row Actions
The system SHALL provide download, view, share, and delete actions per report.

#### Scenario: View report
- **WHEN** user clicks "View" button
- **THEN** system navigates to `/dashboard/reports/:id`

#### Scenario: Download report
- **WHEN** user clicks "Download" button
- **THEN** system initiates file download

#### Scenario: Share report
- **WHEN** user clicks "Share" button
- **THEN** system opens share modal

#### Scenario: Delete report
- **WHEN** user clicks "Delete" button
- **THEN** system displays confirmation modal before deletion

### Requirement: Bulk Actions
The system SHALL allow selecting multiple reports for bulk operations.

#### Scenario: Select reports
- **WHEN** user checks row checkboxes
- **THEN** system displays selection count and bulk action buttons

#### Scenario: Bulk download
- **WHEN** user clicks "Bulk Download" with selected reports
- **THEN** system initiates download of all selected reports (zip if multiple)

#### Scenario: Bulk delete
- **WHEN** user clicks "Bulk Delete" with selected reports
- **THEN** system displays confirmation modal with count of reports to delete

### Requirement: Empty State
The system SHALL display empty state when no reports match criteria.

#### Scenario: No reports yet
- **WHEN** insight has not generated any reports
- **THEN** system displays "No reports yet" with "Run insight to generate reports" button

#### Scenario: No filtered results
- **WHEN** filters match no reports
- **THEN** system displays "No matching reports" with "Clear filters" button
