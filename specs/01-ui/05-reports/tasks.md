---
description: "Task list for Phase 05 - Reports UI implementation"
---

# Tasks: UI Reports

**Input**: Design documents from `/specs/01-ui/05-reports/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: The examples below include test tasks. Tests are OPTIONAL - only include them if explicitly requested in the feature specification.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `apps/frontend/src/` for frontend code, `apps/frontend/tests/` for tests

Paths shown below assume web app structure - adjust based on plan.md structure.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure for reports UI

- [ ] T001 Create reports directory structure under apps/frontend/src/components/reports/
- [ ] T002 Create reports routes directory under apps/frontend/src/routes/reports/
- [ ] T003 [P] Install PDF.js dependency: `pnpm add pdfjs-dist`
- [ ] T004 [P] Install file-saver dependency: `pnpm add file-saver @types/file-saver`
- [ ] T005 [P] Configure PDF.js worker in vite config

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T006 Define TypeScript interfaces for Report, ReportSection, ReportExport, ShareLink in apps/frontend/src/types/reports.ts
- [ ] T007 Create report viewer store using TanStack Store in apps/frontend/src/stores/report-store.ts
- [ ] T008 [P] Implement tRPC router procedures for reports in packages/api/src/routers/reports.ts
- [ ] T009 [P] Create Zod validation schemas for report filters and export options in apps/frontend/src/lib/validation/reports.ts
- [ ] T010 Set up error handling utilities for report operations in apps/frontend/src/lib/errors/report-errors.ts
- [ ] T011 Create report formatting utilities (date, currency, number) in apps/frontend/src/lib/report-utils.ts
- [ ] T012 Configure i18n support for reports in apps/frontend/src/lib/i18n/reports.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - View Generated Reports (Priority: P1) 🎯 MVP

**Goal**: Enable users to view AI-generated reports with multi-page navigation, table of contents, and interactive charts

**Independent Test**: Generate a report from an active insight, open it in the report viewer, navigate between pages, click table of contents links, and verify all content renders correctly

### Tests for User Story 1 (OPTIONAL - only if tests requested) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T013 [P] [US1] Unit test for ReportViewer component in apps/frontend/tests/unit/components/ReportViewer.test.tsx
- [ ] T014 [P] [US1] Unit test for ReportTableOfContents in apps/frontend/tests/unit/components/ReportTableOfContents.test.tsx
- [ ] T015 [P] [US1] E2E test for report viewing journey in apps/frontend/tests/e2e/reports-viewing.spec.ts

### Implementation for User Story 1

- [ ] T016 [P] [US1] Create ReportViewer component shell in apps/frontend/src/components/reports/ReportViewer.tsx
- [ ] T017 [P] [US1] Create ReportHeader component in apps/frontend/src/components/reports/ReportHeader.tsx
- [ ] T018 [P] [US1] Create ReportTableOfContents component in apps/frontend/src/components/reports/ReportTableOfContents.tsx
- [ ] T019 [P] [US1] Create ReportPages container in apps/frontend/src/components/reports/ReportPages.tsx
- [ ] T020 [P] [US1] Create ReportPage component for single page rendering in apps/frontend/src/components/reports/ReportPage.tsx
- [ ] T021 [P] [US1] Create ReportControls component (zoom, nav, fullscreen) in apps/frontend/src/components/reports/ReportControls.tsx
- [ ] T022 [US1] Implement multi-page navigation logic in ReportViewer component (depends on T016-T021)
- [ ] T023 [US1] Integrate chart rendering in ReportPage component using Recharts
- [ ] T024 [US1] Implement table of contents navigation and active section highlighting
- [ ] T025 [US1] Add zoom controls (75%, 100%, 125%, 150%) with state management
- [ ] T026 [US1] Implement fullscreen mode for report viewer
- [ ] T027 [US1] Create report viewer page route in apps/frontend/src/routes/reports/$reportId.tsx
- [ ] T028 [US1] Implement useReportData hook for fetching report data in apps/frontend/src/hooks/useReportData.ts
- [ ] T029 [US1] Add loading states and error handling for report viewer
- [ ] T030 [US1] Implement keyboard navigation for report viewer (arrow keys, page up/down)
- [ ] T031 [US1] Add scroll position tracking and table of contents active section updates
- [ ] T032 [US1] Test report viewer with both LTR and RTL reports
- [ ] T033 [US1] Ensure all report viewer components meet WCAG 2.1 AA accessibility standards

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently - users can view and navigate reports

---

## Phase 4: User Story 2 - Export Reports in Multiple Formats (Priority: P1)

**Goal**: Enable users to export reports in PDF and Excel formats with format options and progress tracking

**Independent Test**: View a report, click export, select PDF format with options, wait for completion, download and verify the PDF file contains all content with proper formatting

### Tests for User Story 2 (OPTIONAL - only if tests requested) ⚠️

- [ ] T034 [P] [US2] Unit test for ReportExportModal in apps/frontend/tests/unit/components/ReportExportModal.test.tsx
- [ ] T035 [P] [US2] Unit test for useReportExport hook in apps/frontend/tests/unit/hooks/useReportExport.test.ts
- [ ] T036 [P] [US2] E2E test for export workflow in apps/frontend/tests/e2e/reports-export.spec.ts

### Implementation for User Story 2

- [ ] T037 [P] [US2] Create ReportExportModal component in apps/frontend/src/components/reports/ReportExportModal.tsx
- [ ] T038 [P] [US2] Create FormatSelector component (PDF/Excel) in apps/frontend/src/components/reports/FormatSelector.tsx
- [ ] T039 [P] [US2] Create ExportOptions component in apps/frontend/src/components/reports/ExportOptions.tsx
- [ ] T040 [P] [US2] Create ExportProgress component in apps/frontend/src/components/reports/ExportProgress.tsx
- [ ] T041 [P] [US2] Create file downloader utility in apps/frontend/src/lib/file-downloader.ts
- [ ] T042 [US2] Implement useReportExport hook in apps/frontend/src/hooks/useReportExport.ts (depends on T041)
- [ ] T043 [US2] Implement PDF export handling with progress tracking (depends on T037-T042)
- [ ] T044 [US2] Implement Excel export handling with progress tracking
- [ ] T045 [US2] Add export options validation and error handling
- [ ] T046 [US2] Implement estimated export time and file size calculation
- [ ] T047 [US2] Add export status polling for long-running exports
- [ ] T048 [US2] Integrate export modal into ReportViewer actions (depends on T022 from US1)
- [ ] T049 [US2] Test PDF export with both LTR and RTL reports
- [ ] T050 [US2] Test Excel export with data tables and formatting
- [ ] T051 [US2] Ensure export functionality meets WCAG 2.1 AA accessibility standards

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently - users can view reports AND export them

---

## Phase 5: User Story 3 - Browse and Search Report Library (Priority: P2)

**Goal**: Provide a searchable, filterable library of all historical reports with preview and management capabilities

**Independent Test**: Generate multiple reports, navigate to report library, use search and filters to find specific reports, hover for previews, and verify the library organizes reports correctly

### Tests for User Story 3 (OPTIONAL - only if tests requested) ⚠️

- [ ] T052 [P] [US3] Unit test for ReportLibrary in apps/frontend/tests/unit/components/ReportLibrary.test.tsx
- [ ] T053 [P] [US3] Unit test for ReportCard in apps/frontend/tests/unit/components/ReportCard.test.tsx
- [ ] T054 [P] [US3] E2E test for library browsing in apps/frontend/tests/e2e/reports-library.spec.ts

### Implementation for User Story 3

- [ ] T055 [P] [US3] Create ReportLibrary component in apps/frontend/src/components/reports/ReportLibrary.tsx
- [ ] T056 [P] [US3] Create ReportFilters component (search, date range, filters) in apps/frontend/src/components/reports/ReportFilters.tsx
- [ ] T057 [P] [US3] Create ReportCard component with preview in apps/frontend/src/components/reports/ReportCard.tsx
- [ ] T058 [P] [US3] Create ReportPagination component in apps/frontend/src/components/reports/ReportPagination.tsx
- [ ] T059 [P] [US3] Create ReportPreview hover component in apps/frontend/src/components/reports/ReportPreview.tsx
- [ ] T060 [US3] Implement report list fetching with filters and pagination
- [ ] T061 [US3] Implement search functionality with debouncing
- [ ] T062 [US3] Add filter controls (date range, insight, connector, status)
- [ ] T063 [US3] Implement sorting options (date, name, status)
- [ ] T064 [US3] Add report count summary display
- [ ] T065 [US3] Implement virtual scrolling or pagination for large libraries
- [ ] T066 [US3] Add favorite/star functionality for important reports
- [ ] T067 [US3] Create report library page route in apps/frontend/src/routes/reports/index.tsx
- [ ] T068 [US3] Add loading states and error handling for library
- [ ] T069 [US3] Test library with 100+ reports for performance
- [ ] T070 [US3] Ensure library meets WCAG 2.1 AA accessibility standards

**Checkpoint**: At this point, User Stories 1, 2, AND 3 should all work independently

---

## Phase 6: User Story 4 - Share Reports with Stakeholders (Priority: P2)

**Goal**: Enable secure report sharing with external stakeholders via shareable links with access controls

**Independent Test**: View a report, click share, generate a share link with password protection and expiration, access the link via incognito browser, and verify the report loads correctly

### Tests for User Story 4 (OPTIONAL - only if tests requested) ⚠️

- [ ] T071 [P] [US4] Unit test for ReportShareModal in apps/frontend/tests/unit/components/ReportShareModal.test.tsx
- [ ] T072 [P] [US4] Unit test for ShareLinkManager in apps/frontend/tests/unit/components/ShareLinkManager.test.tsx
- [ ] T073 [P] [US4] E2E test for sharing workflow in apps/frontend/tests/e2e/reports-sharing.spec.ts

### Implementation for User Story 4

- [ ] T074 [P] [US4] Create ReportShareModal component in apps/frontend/src/components/reports/ReportShareModal.tsx
- [ ] T075 [P] [US4] Create ShareOptions component (public, password, expiration) in apps/frontend/src/components/reports/ShareOptions.tsx
- [ ] T076 [P] [US4] Create ShareUrl component with copy and QR code in apps/frontend/src/components/reports/ShareUrl.tsx
- [ ] T077 [P] [US4] Create ShareLinkManager component in apps/frontend/src/components/reports/ShareLinkManager.tsx
- [ ] T078 [P] [US4] Create useShareLink hook in apps/frontend/src/hooks/useShareLink.ts
- [ ] T079 [US4] Implement share link generation with tRPC (depends on T078)
- [ ] T080 [US4] Implement password protection for share links
- [ ] T081 [US4] Add expiration date configuration for share links
- [ ] T082 [US4] Implement share link list display with access counts
- [ ] T083 [US4] Add revoke functionality for share links
- [ ] T084 [US4] Generate QR code for share links using qrcode library
- [ ] T085 [US4] Create shared report page route in apps/frontend/src/routes/reports/shared/$shareToken.tsx
- [ ] T086 [US4] Implement shared report access with password validation
- [ ] T087 [US4] Add "View on AgenticVerdict" branding to shared reports
- [ ] T088 [US4] Integrate share modal into ReportViewer actions (depends on T022 from US1)
- [ ] T089 [US4] Test share link access via incognito browser session
- [ ] T090 [US4] Ensure sharing functionality meets WCAG 2.1 AA accessibility standards

**Checkpoint**: All user stories should now be independently functional - users can view, export, browse, and share reports

---

## Phase 7: Cross-Cutting Concerns & Polish

**Purpose**: Improvements that affect multiple user stories and final production readiness

- [ ] T091 [P] Add comprehensive accessibility testing with @axe-core/react for all report components
- [ ] T092 [P] Test all report components in both LTR and RTL layouts
- [ ] T093 [P] Add visual regression tests for report viewer, library, and modals
- [ ] T094 [P] Optimize bundle size by lazy loading PDF.js worker and export modals
- [ ] T095 [P] Implement caching strategy for report metadata and rendered pages
- [ ] T096 [P] Add performance monitoring for report viewing and export operations
- [ ] T097 [P] Add error tracking for report generation, export, and sharing failures
- [ ] T098 [P] Implement proper focus management for all modals and overlays
- [ ] T099 [P] Add keyboard shortcuts for report navigation (Ctrl+F for search, arrow keys for nav)
- [ ] T100 [P] Ensure all charts have alternative text descriptions
- [ ] T101 [P] Test report viewer with high contrast mode and Windows High Contrast
- [ ] T102 [P] Validate PDF exports include proper accessibility tags and structure
- [ ] T103 [P] Test Excel exports with large datasets (1000+ rows)
- [ ] T104 [P] Add print stylesheet for reports
- [ ] T105 [P] Implement proper error boundaries for report components
- [ ] T106 [P] Add loading skeletons for better perceived performance
- [ ] T107 [P] Test report viewer on mobile devices and responsive design
- [ ] T108 [P] Add analytics tracking for report views, exports, and shares
- [ ] T109 [P] Write comprehensive documentation for report components in comments
- [ ] T110 [P] Update CLAUDE.md with any new patterns or conventions

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - User Story 1 (P1): Can start after Foundational - No dependencies on other stories
  - User Story 2 (P1): Can start after Foundational - Integrates with US1 but independently testable
  - User Story 3 (P2): Can start after Foundational - No dependencies on US1/US2
  - User Story 4 (P2): Can start after Foundational - Integrates with US1 but independently testable
- **Cross-Cutting (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1) - View Reports**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1) - Export Reports**: Can start after Foundational (Phase 2) - Integrates with ReportViewer from US1 but export functionality is independently testable
- **User Story 3 (P2) - Report Library**: Can start after Foundational (Phase 2) - Completely independent, no integration with US1/US2/US4
- **User Story 4 (P2) - Share Reports**: Can start after Foundational (Phase 2) - Integrates with ReportViewer from US1 but sharing is independently testable

### Within Each User Story

- Tests (if included) MUST be written and FAIL before implementation
- Component creation tasks can run in parallel (marked [P])
- Integration tasks depend on component creation
- Integration with other user stories happens after each story is independently functional
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks (Phase 1) marked [P] can run in parallel
- All Foundational tasks (Phase 2) marked [P] can run in parallel
- Once Foundational phase completes, all four user stories can start in parallel (if team capacity allows)
- All tests for a user story marked [P] can run in parallel
- All component creation tasks within a story marked [P] can run in parallel
- All cross-cutting tasks (Phase 7) marked [P] can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch all component creation tasks for User Story 1 together:
Task: "Create ReportViewer component shell"
Task: "Create ReportHeader component"
Task: "Create ReportTableOfContents component"
Task: "Create ReportPages container"
Task: "Create ReportPage component"
Task: "Create ReportControls component"

# These can all run in parallel by different developers
# Then integration tasks run sequentially after components are created
```

---

## Implementation Strategy

### MVP First (User Stories 1 & 2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (View Reports) 🎯
4. Complete Phase 4: User Story 2 (Export Reports) 🎯
5. **STOP and VALIDATE**: Test report viewing and exporting independently
6. Deploy/demo if ready

**MVP Deliverable**: Users can view AI-generated reports with multi-page navigation and export them in PDF/Excel formats

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP core!)
3. Add User Story 2 → Test independently → Deploy/Demo (MVP complete!)
4. Add User Story 3 → Test independently → Deploy/Demo (Enhancement!)
5. Add User Story 4 → Test independently → Deploy/Demo (Enhancement!)
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (View Reports) - P1 🎯
   - Developer B: User Story 2 (Export Reports) - P1 🎯
   - Developer C: User Story 3 (Report Library) - P2
   - Developer D: User Story 4 (Share Reports) - P2
3. Stories complete and integrate independently
4. Team completes Cross-Cutting concerns together

---

## Notes

- [P] tasks = different files, no dependencies, can run in parallel
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing (if tests are included)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- US1 and US2 are both P1 priority - prioritize these for MVP
- US3 and US4 are P2 priority - nice to have but not required for MVP
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- All components MUST support RTL layouts for Arabic language
- All components MUST meet WCAG 2.1 AA accessibility standards
- Test extensively with both LTR and RTL content during development
