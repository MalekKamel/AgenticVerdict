# Feature Specification: Scheduling & Delivery Configuration

**Feature Branch**: `001-ui-scheduling`
**Created**: 2026-04-14
**Status**: Draft
**Input**: Phase 07 (Scheduling) from UI implementation roadmap

---

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Scheduling Configuration (Priority: P1)

As a business user, I want to configure automated schedules for my insights so that reports are generated and delivered at regular intervals without manual intervention.

**Why this priority**: Scheduling is the core automation feature that delivers ongoing value to users. Without scheduling, users must manually generate reports, reducing platform adoption and retention.

**Independent Test**: Users can create a schedule, verify it appears in the schedule list, and confirm the next run time is calculated correctly. Deliverability can be tested by triggering an immediate delivery.

**Acceptance Scenarios**:

1. **Given** I have created an insight, **When** I navigate to the scheduling page and configure a weekly schedule, **Then** the system should display the next run date and save the schedule
2. **Given** I have configured a daily schedule, **When** the scheduled time arrives, **Then** the system should automatically generate the report and queue it for delivery
3. **Given** I have selected a timezone (e.g., Asia/Riyadh), **When** I set the schedule time to 9:00 AM, **Then** the system should execute the schedule at 9:00 AM Riyadh time, not UTC
4. **Given** I have created a schedule with a cron expression, **When** I save the schedule, **Then** the system should validate the cron syntax and display the next execution time
5. **Given** I have an active schedule, **When** I navigate to the schedule list, **Then** I should see the schedule name, frequency, next run time, and status (active/paused)

---

### User Story 2 - Delivery Channel Configuration (Priority: P2)

As a business user, I want to configure multiple delivery channels (email, in-app, webhook) for my scheduled reports so that stakeholders receive insights through their preferred communication methods.

**Why this priority**: Delivery flexibility is essential for different user preferences and workflows. Some stakeholders prefer email, others want in-app notifications, and enterprise clients require webhook integration.

**Independent Test**: Users can select delivery channels, configure channel-specific settings (e.g., email template, webhook URL), and verify the configuration saves correctly. Test delivery can be triggered for each channel.

**Acceptance Scenarios**:

1. **Given** I am configuring a schedule, **When** I select "Email" as a delivery channel, **Then** I should be able to choose an email template and customize the subject line
2. **Given** I select "Webhook" as a delivery channel, **When** I enter a webhook URL, **Then** the system should validate the URL format and test connectivity
3. **Given** I have configured multiple delivery channels, **When** the schedule runs, **Then** the report should be delivered to all active channels
4. **Given** I select "In-App" as a delivery channel, **When** the report is generated, **Then** it should appear in the user's notification feed with a deep link to the report
5. **Given** I have disabled a delivery channel, **When** the schedule runs, **Then** the report should not be delivered to that channel

---

### User Story 3 - Recipient Management (Priority: P3)

As a business user, I want to manage recipients for scheduled reports with role-based access control so that the right stakeholders receive the right reports.

**Why this priority**: Recipient management enables team collaboration without compromising security. Role-based access ensures users only receive reports for data they're authorized to view.

**Independent Test**: Users can add recipients by email, assign roles (viewer, admin), and verify that recipients appear in the list with the correct permissions. Removing recipients should immediately revoke access.

**Acceptance Scenarios**:

1. **Given** I am configuring a schedule, **When** I add a recipient by email, **Then** the system should validate the email format and send an invitation if the user doesn't exist
2. **Given** I assign the "viewer" role to a recipient, **When** the schedule runs, **Then** the recipient should receive the report but cannot modify the schedule
3. **Given** I assign the "admin" role to a recipient, **When** the recipient views the schedule, **Then** they should be able to modify or pause the schedule
4. **Given** I remove a recipient from the schedule, **When** the next run occurs, **Then** the removed recipient should not receive the report
5. **Given** I have a schedule with multiple recipients, **When** I view the recipient list, **Then** I should see each recipient's name, email, role, and status (active/pending)

---

### User Story 4 - Multi-Language Schedule Descriptions (Priority: P4)

As a multilingual user, I want to create schedule descriptions in multiple languages so that my team can understand schedules in their preferred language.

**Why this priority**: Multi-language support is critical for Arabic-speaking users in Saudi Arabia and other regions. This ensures the platform is accessible to users regardless of language preference.

**Independent Test**: Users can create schedule descriptions in Arabic and English, switch the UI language, and verify that the correct description is displayed based on the current locale.

**Acceptance Scenarios**:

1. **Given** I have set my language preference to Arabic, **When** I create a schedule, **Then** the form labels and placeholders should be in Arabic (RTL layout)
2. **Given** I create a schedule with an Arabic description, **When** an English-speaking user views the schedule, **Then** they should see the English description (if provided) or a default fallback
3. **Given** I have not provided a description in the current language, **When** I view the schedule, **Then** the system should display the description in the default language (English) with a language indicator
4. **Given** I edit a schedule description, **When** I switch languages, **Then** I should be able to edit the description for each language independently
5. **Given** I view the schedule list, **When** my language is Arabic, **Then** the schedule names and descriptions should be displayed in Arabic

---

### Edge Cases

- What happens when a cron expression is invalid? → Display validation error with examples of valid expressions
- What happens when a webhook URL is unreachable during delivery? → Retry with exponential backoff (3 attempts), then mark as failed and notify admin
- What happens when a recipient's email bounces? → Mark delivery as failed, continue delivering to other recipients, log the error
- What happens when a user is deleted but is still a schedule recipient? → Remove the recipient, notify schedule owner, skip delivery to deleted user
- What happens when daylight saving time changes? → Use timezone-aware scheduling (IANA timezone database) to maintain consistent local times
- What happens when a schedule is paused during a run? → Complete the current run, then skip future runs until resumed
- What happens when multiple schedules trigger simultaneously? → Process jobs in parallel with BullMQ, respect rate limits
- What happens when a report generation fails? → Retry with exponential backoff (3 attempts), then notify schedule owner and mark as failed
- What happens when a user lacks permission to view an insight referenced by a schedule? → Skip delivery, log the error, notify schedule owner
- What happens when the delivery channel configuration is incomplete? → Skip that channel, deliver to other configured channels, notify admin

---

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST allow users to create schedules with flexible cron expressions or simple presets (daily, weekly, monthly)
- **FR-002**: System MUST validate cron expressions using a cron parser library and display human-readable next run times
- **FR-003**: System MUST support timezone selection using IANA timezone database (e.g., Asia/Riyadh, America/New_York)
- **FR-004**: System MUST allow users to select multiple delivery channels (email, in-app, webhook) per schedule
- **FR-005**: System MUST provide a visual cron expression builder for non-technical users
- **FR-006**: System MUST validate webhook URLs and support test delivery during configuration
- **FR-007**: System MUST support role-based recipient management (admin, viewer) with appropriate permissions
- **FR-008**: System MUST send invitations to new recipients and manage pending/active states
- **FR-009**: System MUST support multi-language schedule descriptions (English, Arabic, French) with RTL layout for Arabic
- **FR-010**: System MUST persist schedule configuration in the database with tenant isolation
- **FR-011**: System MUST integrate with BullMQ for background job scheduling and execution
- **FR-012**: System MUST log all schedule executions (success/failure) with timestamps and error messages
- **FR-013**: System MUST allow users to pause, resume, and delete schedules
- **FR-014**: System MUST display a list of all schedules with next run times and status indicators
- **FR-015**: System MUST support test delivery to verify configuration before activating a schedule
- **FR-016**: System MUST enforce row-level security to ensure tenants can only access their own schedules
- **FR-017**: System MUST support schedule cloning to accelerate setup of similar schedules
- **FR-018**: System MUST provide delivery status tracking (pending, sent, failed) for each channel
- **FR-019**: System MUST support conditional delivery (e.g., only send if metrics exceed threshold)
- **FR-020**: System MUST provide audit logging for schedule modifications (create, update, delete, pause, resume)

### Key Entities

- **Schedule**: Represents a scheduled insight generation job with cron expression, timezone, and delivery configuration. Attributes: id, name, description (multi-language), insightId, cronExpression, timezone, isActive, nextRunAt, tenantId, createdBy, createdAt, updatedAt
- **DeliveryChannel**: Represents a delivery method for scheduled reports. Attributes: id, scheduleId, channelType (email, in-app, webhook), configuration (JSON), isActive, createdAt
- **Recipient**: Represents a user who receives scheduled reports. Attributes: id, scheduleId, userId, email, role (admin, viewer), status (active, pending, removed), invitedBy, invitedAt, createdAt
- **ScheduleExecution**: Represents a single execution of a schedule (audit log). Attributes: id, scheduleId, status (pending, running, success, failed), startedAt, completedAt, errorMessage, reportId, tenantId

---

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Users can create a schedule in under 3 minutes using the visual cron builder
- **SC-002**: 95% of users successfully configure delivery channels on the first attempt (measured by error rate)
- **SC-003**: Schedule execution accuracy: 99.9% of schedules execute at the correct time (measured by deviation from scheduled time)
- **SC-004**: Delivery success rate: 98% of scheduled reports are successfully delivered (measured by delivery logs)
- **SC-005**: Support for 100+ concurrent schedules without performance degradation (measured by load testing)
- **SC-006**: Multi-language support: 100% of schedule descriptions display correctly in Arabic (RTL) and English (LTR)
- **SC-007**: Timezone accuracy: 100% of schedules execute at the correct local time across all supported timezones
- **SC-008**: Webhook delivery latency: <5 seconds p95 from report generation to webhook delivery
- **SC-009**: Email delivery latency: <30 seconds p95 from report generation to email send
- **SC-010**: User satisfaction: 90% of users rate the scheduling workflow as "easy" or "very easy" in post-deployment survey

---

## Assumptions

- Users have valid email addresses for delivery channel configuration
- Webhook endpoints support POST requests with JSON payloads (standard webhook format)
- The BullMQ queue system is already configured and operational (from core platform)
- Insight entities exist and can be referenced by schedules (from Phase 04: Insights)
- Report generation is functional (from Phase 05: Reports)
- Authentication and user management are operational (from Phase 01: Authentication)
- Multi-language infrastructure is in place (from Phase 00: Foundation)
- Tenant isolation is enforced at the database level (row-level security)
- Email delivery service (Resend/SendGrid) is configured in the core platform
- In-app notification system is available in the core platform
- Cron expression parser library is available (e.g., `cron-parser` or `cronstrue`)
- Timezone database is available via the Intl API or a library like `date-fns-tz`
