# Tasks: Internationalization (I18n) & Localization (L10n)

**Input**: Design documents from `/specs/01-ui/12-internationalization/`
**Prerequisites**: plan.md (required), spec.md (required for user stories)

**Tests**: This phase includes comprehensive testing for RTL layouts, language switching, and translation validation. Tests are MANDATORY for internationalization to ensure RTL layouts work correctly across all pages.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Web application**: `apps/frontend/src/` for source, `apps/frontend/tests/` for tests
- **Shared packages**: `packages/config/src/` for schemas, `packages/database/src/` for database
- **Translation files**: `apps/frontend/src/locales/` for JSON files

---

## Phase 1: Setup (I18n Infrastructure)

**Purpose**: Core internationalization infrastructure that all user stories depend on

- [ ] T001 Create translation file directory structure at apps/frontend/src/locales/ with en/ and ar/ subdirectories
- [ ] T002 [P] Create common.json translation file in apps/frontend/src/locales/en/ with shared translations (buttons, labels, navigation)
- [ ] T003 [P] Create common.json translation file in apps/frontend/src/locales/ar/ with Arabic translations for common keys
- [ ] T004 [P] Install @tanstack/react-router-i18n plugin and configure i18n in apps/frontend/src/lib/i18n.ts
- [ ] T005 [P] Create locale type definitions (Locale schema, locale config) in apps/frontend/src/lib/locales.ts
- [ ] T006 Create date/currency/number formatters in apps/frontend/src/lib/formatters.ts with locale-aware formatting
- [ ] T007 Add language_preference column to users table in packages/database/src/schema/users.ts
- [ ] T008 Create locale configuration Zod schemas in packages/config/src/schemas/locale.ts

**Checkpoint**: I18n infrastructure ready - translation files, formatters, and type definitions in place

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core i18n components that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T009 Create LocaleProvider component in apps/frontend/src/components/i18n/LocaleProvider.tsx to wrap app with i18n context
- [ ] T010 Configure __root.tsx to use DirectionProvider from Mantine with dynamic dir based on locale
- [ ] T011 Create locale store in apps/frontend/src/stores/locale-store.ts for locale state management and persistence
- [ ] T012 Add locale-based routing structure (e.g., [...lang]/) in apps/frontend/src/routes/ for SEO-friendly URLs
- [ ] T013 Create useTrans hook wrapper in apps/frontend/src/lib/i18n.ts for convenient translation access
- [ ] T014 Add tRPC procedure for saving user language preference in apps/frontend/src/server/routers/users.ts
- [ ] T015 Create browser language detection utility in apps/frontend/src/lib/i18n.ts for first-visit hint
- [ ] T016 Add unit tests for i18n utilities in apps/frontend/tests/unit/i18n.test.ts
- [ ] T017 Add unit tests for formatters in apps/frontend/tests/unit/formatters.test.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Multi-Language Switching (Priority: P1) 🎯 MVP

**Goal**: Users can switch languages seamlessly with immediate UI updates

**Independent Test**: Switch language from settings and verify all text, layouts, and formatting update correctly without reload

### Tests for User Story 1 (MANDATORY) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T018 [P] [US1] E2E test for language switching workflow in apps/frontend/tests/e2e/language-switching.spec.ts
- [ ] T019 [P] [US1] Unit test for locale persistence in apps/frontend/tests/unit/locale-store.test.ts
- [ ] T020 [P] [US1] Integration test for translation loading in apps/frontend/tests/integration/i18n.test.ts

### Implementation for User Story 1

- [ ] T021 [P] [US1] Create LanguageSwitcher component in apps/frontend/src/components/i18n/LanguageSwitcher.tsx
- [ ] T022 [P] [US1] Add language switcher to settings page in apps/frontend/src/routes/settings/index.tsx
- [ ] T023 [P] [US1] Add language switcher to user menu in apps/frontend/src/components/layout/UserMenu.tsx
- [ ] T024 [US1] Implement setLocale function in locale store with localStorage persistence (depends on T011)
- [ ] T025 [US1] Implement language change tRPC mutation in apps/frontend/src/server/routers/users.ts
- [ ] T026 [US1] Add locale change listener to trigger UI updates without page reload
- [ ] T027 [US1] Add loading state for translation file loading during language switch
- [ ] T028 [US1] Implement fallback to English if translation file fails to load
- [ ] T029 [US1] Add language preference to user profile settings form

**Checkpoint**: Users can switch languages with immediate UI update, preference persists across sessions

---

## Phase 4: User Story 2 - Locale Management Interface (Priority: P2)

**Goal**: Admins can manage languages and upload translations

**Independent Test**: Admins can access locale management, view coverage, and upload translation files

### Tests for User Story 2 (OPTIONAL - only if requested) ⚠️

- [ ] T030 [P] [US2] Unit test for translation file validation in apps/frontend/tests/unit/translation-validation.test.ts
- [ ] T031 [P] [US2] Integration test for translation upload API in apps/frontend/tests/integration/locale-api.test.ts

### Implementation for User Story 2

- [ ] T032 [P] [US2] Create locale management page route in apps/frontend/src/routes/admin/locales.tsx
- [ ] T033 [P] [US2] Create LocaleManagement component in apps/frontend/src/components/admin/LocaleManagement.tsx
- [ ] T034 [US2] Implement translation file upload UI in LocaleManagement component
- [ ] T035 [US2] Create TranslationCoverage component to show translation completion percentage
- [ ] T036 [US2] Implement translation file validation API in apps/frontend/src/server/routers/admin/locales.ts
- [ ] T037 [US2] Create missing keys detection utility in apps/frontend/src/lib/i18n.ts
- [ ] T038 [US2] Add locale-specific settings form (date format, currency symbol) in LocaleManagement component
- [ ] T039 [US2] Implement tRPC procedure for updating locale configuration

**Checkpoint**: Admins can manage translations and configure locale settings

---

## Phase 5: User Story 3 - RTL Pattern Optimization (Priority: P1) 🎯

**Goal**: Arabic users experience fully mirrored RTL interface

**Independent Test**: View all pages in Arabic and verify layouts, navigation, icons, and interactions are properly mirrored

### Tests for User Story 3 (MANDATORY) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T040 [P] [US3] E2E test for dashboard RTL layout in apps/frontend/tests/e2e/rtl-layouts.spec.ts
- [ ] T041 [P] [US3] E2E test for form RTL tab order in apps/frontend/tests/e2e/rtl-layouts.spec.ts
- [ ] T042 [P] [US3] Visual regression test for RTL screenshots in apps/frontend/tests/visual/rtl.spec.ts

### Implementation for User Story 3

- [ ] T043 [P] [US3] Audit all pages for RTL compliance (create checklist in apps/frontend/docs/rtl-checklist.md)
- [ ] T044 [P] [US3] Update sidebar component in apps/frontend/src/components/layout/Sidebar.tsx for RTL positioning
- [ ] T045 [P] [US3] Update data table component in apps/frontend/src/components/data/DataTable.tsx for RTL column alignment
- [ ] T046 [P] [US3] Update form components in apps/frontend/src/components/forms/ for RTL focus order
- [ ] T047 [US3] Add RTL-specific CSS overrides using logical properties (margin-inline-start instead of margin-left)
- [ ] T048 [US3] Update chart components in apps/frontend/src/components/charts/ for RTL axis labels and legends
- [ ] T049 [US3] Test and fix icon mirroring for directional icons (arrows, chevrons)
- [ ] T050 [US3] Update modal and drawer components for RTL positioning
- [ ] T051 [US3] Test all navigation flows in RTL mode (breadcrumbs, pagination, step wizards)

**Checkpoint**: All pages pass RTL layout validation with zero mirroring errors

---

## Phase 6: User Story 4 - Translation File Structure & Maintenance (Priority: P2)

**Goal**: Maintainable translation file structure with validation

**Independent Test**: Developers can add translation keys and run validation to find missing translations

### Tests for User Story 4 (OPTIONAL - only if requested) ⚠️

- [ ] T052 [P] [US4] Unit test for translation key validation in apps/frontend/tests/unit/translation-validation.test.ts
- [ ] T053 [P] [US4] Integration test for missing key detection in apps/frontend/tests/integration/i18n.test.ts

### Implementation for User Story 4

- [ ] T054 [P] [US4] Create translation validation script in apps/frontend/scripts/validate-translations.ts
- [ ] T055 [P] [US4] Add namespace script to organize translation keys by feature in apps/frontend/scripts/organize-translations.ts
- [ ] T056 [US4] Create translation coverage report generator in apps/frontend/scripts/translation-coverage.ts
- [ ] T057 [US4] Add missing key placeholder component (displays [missing_key] when translation not found)
- [ ] T058 [US4] Implement translation key logging to Sentry for production monitoring
- [ ] T059 [US4] Add npm scripts for translation validation (npm run validate:translations)
- [ ] T060 [US4] Create translation maintenance guide in apps/frontend/docs/translation-maintenance.md

**Checkpoint**: Translation files are validated, missing keys are tracked, and maintenance is streamlined

---

## Phase 7: Additional Translation Files (Per Feature)

**Purpose**: Create translation files for each feature area

- [ ] T061 [P] Create dashboard.json translation files in apps/frontend/src/locales/en/ and apps/frontend/src/locales/ar/
- [ ] T062 [P] Create connectors.json translation files in apps/frontend/src/locales/en/ and apps/frontend/src/locales/ar/
- [ ] T063 [P] Create insights.json translation files in apps/frontend/src/locales/en/ and apps/frontend/src/locales/ar/
- [ ] T064 [P] Create settings.json translation files in apps/frontend/src/locales/en/ and apps/frontend/src/locales/ar/
- [ ] T065 [P] Create reports.json translation files in apps/frontend/src/locales/en/ and apps/frontend/src/locales/ar/
- [ ] T066 [P] Create templates.json translation files in apps/frontend/src/locales/en/ and apps/frontend/src/locales/ar/
- [ ] T067 [P] Create scheduling.json translation files in apps/frontend/src/locales/en/ and apps/frontend/src/locales/ar/
- [ ] T068 [P] Create tenant.json translation files in apps/frontend/src/locales/en/ and apps/frontend/src/locales/ar/
- [ ] T069 [P] Create admin.json translation files in apps/frontend/src/locales/en/ and apps/frontend/src/locales/ar/
- [ ] T070 Add ICU message format support for pluralization in translation files

**Checkpoint**: All feature areas have complete English and Arabic translations

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T071 [P] Add internationalization documentation in apps/frontend/docs/i18n.md
- [ ] T072 [P] Create RTL development guidelines in apps/frontend/docs/rtl-guidelines.md
- [ ] T073 [P] Add translation key naming conventions guide in apps/frontend/docs/translation-conventions.md
- [ ] T074 Performance optimization: Implement lazy loading for translation files by namespace
- [ ] T075 Performance optimization: Add translation file caching in localStorage
- [ ] T076 Add SEO meta tags for locale-based URLs (hreflang, alternate links)
- [ ] T077 Accessibility: Test with NVDA and VoiceOver screen readers for both languages
- [ ] T078 Accessibility: Add ARIA labels for language switcher and RTL-specific elements
- [ ] T079 Error handling: Add user-friendly error messages for translation loading failures
- [ ] T080 Add CI check for missing translation keys using validation script
- [ ] T081 Add visual regression tests for all pages in both LTR and RTL
- [ ] T082 Create feature flag for gradual rollout of i18n functionality
- [ ] T083 Run full RTL layout validation on all pages and fix issues
- [ ] T084 Test language switching on all pages and fix layout breaks
- [ ] T085 Verify date/currency/number formatting for all locales

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - User Story 1 (P1) and User Story 3 (P1) are critical for Arabic users
  - User Story 2 (P2) and User Story 4 (P2) improve maintainability
  - User stories can proceed in parallel (if staffed)
- **Additional Translation Files (Phase 7)**: Can proceed in parallel with user stories
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Independent of other stories
- **User Story 3 (P1)**: Can start after Foundational (Phase 2) - Independent of other stories
- **User Story 4 (P2)**: Can start after Foundational (Phase 2) - Independent of other stories

### Within Each User Story

- Tests (if included) MUST be written and FAIL before implementation
- Core infrastructure before user-facing components
- Test with both English and Arabic during development
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- All tests for a user story marked [P] can run in parallel
- Translation files in Phase 7 can be created in parallel
- Polish tasks in Phase 8 marked [P] can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "E2E test for language switching workflow in apps/frontend/tests/e2e/language-switching.spec.ts"
Task: "Unit test for locale persistence in apps/frontend/tests/unit/locale-store.test.ts"
Task: "Integration test for translation loading in apps/frontend/tests/integration/i18n.test.ts"

# Launch all components for User Story 1 together:
Task: "Create LanguageSwitcher component in apps/frontend/src/components/i18n/LanguageSwitcher.tsx"
Task: "Add language switcher to settings page in apps/frontend/src/routes/settings/index.tsx"
Task: "Add language switcher to user menu in apps/frontend/src/components/layout/UserMenu.tsx"
```

---

## Implementation Strategy

### MVP First (User Stories 1 & 3 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Multi-Language Switching)
4. Complete Phase 5: User Story 3 (RTL Pattern Optimization)
5. **STOP and VALIDATE**: Test language switching and RTL layouts independently
6. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP for language switching)
3. Add User Story 3 → Test independently → Deploy/Demo (Full Arabic support)
4. Add User Story 2 → Test independently → Deploy/Demo (Admin locale management)
5. Add User Story 4 → Test independently → Deploy/Demo (Developer tooling)
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Language Switching) + User Story 3 (RTL Optimization)
   - Developer B: User Story 2 (Locale Management) + User Story 4 (Translation Maintenance)
   - Developer C: Phase 7 (Translation Files)
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- RTL testing is MANDATORY for User Story 3 - use Playwright for visual regression
- Test with both English and Arabic during development
- Verify translation files are valid JSON before committing
- Use logical properties (margin-inline-start) instead of directional properties (margin-left)
- Test language switching on all major pages (dashboard, connectors, insights, settings)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence

---

## Validation Checklist

Before marking Phase 12 complete:

- [ ] All user stories pass acceptance criteria
- [ ] All pages work in both English and Arabic
- [ ] RTL layouts pass visual regression tests
- [ ] Translation files have no missing keys (validated by script)
- [ ] Language switching works in under 3 seconds
- [ ] User preference persists across sessions
- [ ] Admins can manage translations via UI
- [ ] Screen readers work correctly in both languages
- [ ] Date/currency/number formatting is locale-aware
- [ ] Bundle size increase is under 100KB
- [ ] Zero console errors related to translations
- [ ] Documentation is complete (i18n guide, RTL guidelines, translation conventions)
