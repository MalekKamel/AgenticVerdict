---
description: "Task list for UI Foundation phase implementation"
---

# Tasks: UI Foundation (Phase 00)

**Input**: Design documents from `/specs/01-ui/00-foundation/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: This phase includes comprehensive unit, accessibility, and E2E tests as acceptance criteria for all components. Testing infrastructure must be established before component implementation begins.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Monorepo web application**: `packages/ui/src/` (design system), `apps/web/src/` (TanStack Start app)
- Paths shown below assume monorepo structure from plan.md

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and TanStack Start + Mantine v9 integration

- [ ] T001 Initialize packages/ui/ with TypeScript 5.3+ strict mode configuration
- [ ] T002 [P] Install TanStack Start dependencies in apps/web/ (@tanstack/start, @tanstack/react-router)
- [ ] T003 [P] Install Mantine v9 dependencies (@mantine/core, @mantine/hooks, @emotion/react)
- [ ] T004 [P] Install testing dependencies (Vitest, Playwright, @axe-core/react)
- [ ] T005 [P] Configure TypeScript strict mode and tsconfig paths for monorepo
- [ ] T006 [P] Configure ESLint and Prettier with Mantine and React rules
- [ ] T007 Create directory structure per plan.md (atoms/, molecules/, hooks/, providers/, tokens/, styles/, utils/)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Design Token System

- [ ] T008 Create design token type definitions in packages/ui/src/tokens/types.ts (DesignToken, TokenCategory, TokenTier)
- [ ] T009 Implement global design tokens in packages/ui/src/tokens/global.ts (colors, spacing, typography, radii, shadows, transitions)
- [ ] T010 Create brand token interface in packages/ui/src/tokens/brand.ts (Theme, ThemeColors, ThemeTypography, ThemeBranding)
- [ ] T011 Implement component token composition in packages/ui/src/tokens/component.ts (composed from global/brand tokens)
- [ ] T012 Create CSS custom property generator in packages/ui/src/tokens/generate-css-variables.ts

### Provider Infrastructure

- [ ] T013 Implement ThemeProvider in packages/ui/src/providers/ThemeProvider.tsx (applies tenant-specific brand tokens)
- [ ] T014 Implement DirectionProvider in packages/ui/src/providers/DirectionProvider.tsx (sets dir="rtl" or dir="ltr")
- [ ] T015 Create MantineProvider wrapper in packages/ui/src/providers/MantineProvider.tsx (integrates Mantine with design tokens)
- [ ] T016 Create hook packages/ui/src/hooks/useTheme.ts (accesses theme context)
- [ ] T017 Create hook packages/ui/src/hooks/useDirection.ts (accesses direction context)

### Internationalization Setup

- [ ] T018 [P] Install @tanstack/react-router i18n dependencies
- [ ] T019 Create locale type definitions in apps/web/src/i18n/types.ts (Locale, TextDirection, NumberFormat, CurrencyFormat)
- [ ] T020 [P] Create English translation file in apps/web/src/i18n/locales/en.json
- [ ] T021 [P] Create Arabic translation file in apps/web/src/i18n/locales/ar.json
- [ ] T022 Configure i18n in apps/web/src/i18n/i18n.ts (language detection, fallbacks)

### Testing Infrastructure

- [ ] T023 [P] Configure Vitest for unit testing in packages/ui/vitest.config.ts
- [ ] T024 [P] Configure Playwright for E2E testing in apps/web/playwright.config.ts
- [ ] T025 [P] Setup @axe-core/react for accessibility testing
- [ ] T026 Create test utilities in packages/ui/tests/utils/test-utils.ts (renderWithProviders, mockTheme)
- [ ] T027 [P] Create accessibility test utilities in packages/ui/tests/utils/a11y-test-utils.ts (axeRunner, checkA11y)

### Global Styles

- [ ] T028 Create reset.css in packages/ui/src/styles/reset.css (CSS reset, box-sizing)
- [ ] T029 Create utilities.css in packages/ui/src/styles/utilities.css (logical properties, utility classes)

### App Structure

- [ ] T030 Create root layout in apps/web/src/routes/__root.tsx (wraps with ThemeProvider, DirectionProvider, MantineProvider)
- [ ] T031 Create home page in apps/web/src/routes/index.tsx (basic page for testing)
- [ ] T032 Setup tRPC client in apps/web/src/providers/TRPCProvider.tsx

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Platform Developer Creates Reusable UI Components (Priority: P1) 🎯 MVP

**Goal**: Deliver a comprehensive component library with all atoms and molecules, enabling developers to build consistent UIs without duplication

**Independent Test**: Create a sample page using each atom and molecule component. Verify visual consistency, accessibility compliance (axe-core), and RTL/LTR rendering. Component library must be importable and immediately usable.

### Tests for User Story 1 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T033 [P] [US1] Accessibility test suite setup in packages/ui/tests/accessibility/a11y-suite.test.ts
- [ ] T034 [P] [US1] Visual regression test setup in packages/ui/tests/visual-regression/visual.config.ts
- [ ] T035 [P] [US1] RTL test utilities in packages/ui/tests/utils/rtl-test-utils.ts

### Atom Components - Basic Form Elements

- [ ] T036 [P] [US1] Create Button component in packages/ui/src/atoms/Button/Button.tsx
- [ ] T037 [US1] Create Button tests in packages/ui/tests/unit/atoms/Button.test.tsx (depends on T036)
- [ ] T038 [P] [US1] Create Input component in packages/ui/src/atoms/Input/Input.tsx
- [ ] T039 [US1] Create Input tests in packages/ui/tests/unit/atoms/Input.test.tsx (depends on T038)
- [ ] T040 [P] [US1] Create Checkbox component in packages/ui/src/atoms/Checkbox/Checkbox.tsx
- [ ] T041 [US1] Create Checkbox tests in packages/ui/tests/unit/atoms/Checkbox.test.tsx (depends on T040)
- [ ] T042 [P] [US1] Create Radio component in packages/ui/src/atoms/Radio/Radio.tsx
- [ ] T043 [US1] Create Radio tests in packages/ui/tests/unit/atoms/Radio.test.tsx (depends on T042)
- [ ] T044 [P] [US1] Create Switch component in packages/ui/src/atoms/Switch/Switch.tsx
- [ ] T045 [US1] Create Switch tests in packages/ui/tests/unit/atoms/Switch.test.tsx (depends on T044)

### Atom Components - Data Display & Feedback

- [ ] T046 [P] [US1] Create Badge component in packages/ui/src/atoms/Badge/Badge.tsx
- [ ] T047 [US1] Create Badge tests in packages/ui/tests/unit/atoms/Badge.test.tsx (depends on T046)
- [ ] T048 [P] [US1] Create Icon component in packages/ui/src/atoms/Icon/Icon.tsx
- [ ] T049 [US1] Create Icon tests in packages/ui/tests/unit/atoms/Icon.test.tsx (depends on T048)
- [ ] T050 [P] [US1] Create Spinner component in packages/ui/src/atoms/Spinner/Spinner.tsx
- [ ] T051 [US1] Create Spinner tests in packages/ui/tests/unit/atoms/Spinner.test.tsx (depends on T050)

### Atom Components - Layout & Typography

- [ ] T052 [P] [US1] Create Typography component in packages/ui/src/atoms/Typography/Typography.tsx
- [ ] T053 [US1] Create Typography tests in packages/ui/tests/unit/atoms/Typography.test.tsx (depends on T052)
- [ ] T054 [P] [US1] Create Link component in packages/ui/src/atoms/Link/Link.tsx
- [ ] T055 [US1] Create Link tests in packages/ui/tests/unit/atoms/Link.test.tsx (depends on T054)
- [ ] T056 [P] [US1] Create Separator component in packages/ui/src/atoms/Separator/Separator.tsx
- [ ] T057 [US1] Create Separator tests in packages/ui/tests/unit/atoms/Separator.test.tsx (depends on T056)

### Molecule Components - Form-Related

- [ ] T058 [P] [US1] Create FormField component in packages/ui/src/molecules/FormField/FormField.tsx (depends on T038 Input)
- [ ] T059 [US1] Create FormField tests in packages/ui/tests/unit/molecules/FormField.test.tsx (depends on T058)
- [ ] T060 [P] [US1] Create SearchInput component in packages/ui/src/molecules/SearchInput/SearchInput.tsx (depends on T038 Input)
- [ ] T061 [US1] Create SearchInput tests in packages/ui/tests/unit/molecules/SearchInput.test.tsx (depends on T060)
- [ ] T062 [P] [US1] Create Select component in packages/ui/src/molecules/Select/Select.tsx
- [ ] T063 [US1] Create Select tests in packages/ui/tests/unit/molecules/Select.test.tsx (depends on T062)
- [ ] T064 [P] [US1] Create DatePicker component in packages/ui/src/molecules/DatePicker/DatePicker.tsx
- [ ] T065 [US1] Create DatePicker tests in packages/ui/tests/unit/molecules/DatePicker.test.tsx (depends on T064)

### Molecule Components - Data Display & Layout

- [ ] T066 [P] [US1] Create Card component in packages/ui/src/molecules/Card/Card.tsx
- [ ] T067 [US1] Create Card tests in packages/ui/tests/unit/molecules/Card.test.tsx (depends on T066)
- [ ] T068 [P] [US1] Create Dropdown component in packages/ui/src/molecules/Dropdown/Dropdown.tsx
- [ ] T069 [US1] Create Dropdown tests in packages/ui/tests/unit/molecules/Dropdown.test.tsx (depends on T068)

### Molecule Components - Feedback & Overlays

- [ ] T070 [P] [US1] Create Tooltip component in packages/ui/src/molecules/Tooltip/Tooltip.tsx
- [ ] T071 [US1] Create Tooltip tests in packages/ui/tests/unit/molecules/Tooltip.test.tsx (depends on T070)
- [ ] T072 [P] [US1] Create Popover component in packages/ui/src/molecules/Popover/Popover.tsx
- [ ] T073 [US1] Create Popover tests in packages/ui/tests/unit/molecules/Popover.test.tsx (depends on T072)
- [ ] T074 [P] [US1] Create Alert component in packages/ui/src/molecules/Alert/Alert.tsx
- [ ] T075 [US1] Create Alert tests in packages/ui/tests/unit/molecules/Alert.test.tsx (depends on T074)
- [ ] T076 [P] [US1] Create Toast component in packages/ui/src/molecules/Toast/Toast.tsx
- [ ] T077 [US1] Create Toast tests in packages/ui/tests/unit/molecules/Toast.test.tsx (depends on T076)

### Component Library Exports

- [ ] T078 [US1] Create package index in packages/ui/src/index.ts (export all components, hooks, providers, types)
- [ ] T079 [US1] Create component demo page in apps/web/src/routes/components.tsx (showcase all atoms and molecules)
- [ ] T080 [US1] Create accessibility audit page in apps/web/src/routes/accessibility.tsx (run axe-core on all components)

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently. All 21 components (11 atoms + 10 molecules) are complete with passing tests.

---

## Phase 4: User Story 2 - Designer Validates Component Accessibility and Visual Consistency (Priority: P2)

**Goal**: Ensure WCAG 2.1 AA compliance and design token consistency across all components

**Independent Test**: Run automated accessibility audits (axe-core) on each component with zero violations. Run visual regression tests to verify design token compliance. Document all accessibility features.

### Accessibility Audit & Fixes

- [ ] T081 [P] [US2] Run axe-core audit on all atom components in packages/ui/tests/accessibility/atoms-a11y.test.tsx
- [ ] T082 [P] [US2] Run axe-core audit on all molecule components in packages/ui/tests/accessibility/molecules-a11y.test.tsx
- [ ] T083 [US2] Fix any WCAG 2.1 AA violations found in accessibility audits
- [ ] T084 [US2] Verify keyboard navigation for all interactive components in packages/ui/tests/accessibility/keyboard-navigation.test.tsx
- [ ] T085 [US2] Verify color contrast ratios meet WCAG 2.1 AA requirements in packages/ui/tests/accessibility/color-contrast.test.tsx
- [ ] T086 [US2] Verify touch target sizes meet 44×44px minimum in packages/ui/tests/accessibility/touch-targets.test.tsx
- [ ] T087 [US2] Test screen reader compatibility (NVDA, JAWS, VoiceOver) in packages/ui/tests/accessibility/screen-reader.test.tsx

### Visual Consistency Validation

- [ ] T088 [P] [US2] Create visual regression tests for Button component in packages/ui/tests/visual-regression/Button.visual.tsx
- [ ] T089 [P] [US2] Create visual regression tests for Input component in packages/ui/tests/visual-regression/Input.visual.tsx
- [ ] T090 [P] [US2] Create visual regression tests for Card component in packages/ui/tests/visual-regression/Card.visual.tsx
- [ ] T091 [P] [US2] Create visual regression tests for FormField component in packages/ui/tests/visual-regression/FormField.visual.tsx
- [ ] T092 [US2] Verify all components use design tokens correctly (no hardcoded values) in packages/ui/tests/visual-regression/design-tokens.test.tsx

### Documentation

- [ ] T093 [P] [US2] Document accessibility features for Button component in packages/ui/src/atoms/Button/Button.mdx
- [ ] T094 [P] [US2] Document accessibility features for Input component in packages/ui/src/atoms/Input/Input.mdx
- [ ] T095 [P] [US2] Document accessibility features for Card component in packages/ui/src/molecules/Card/Card.mdx
- [ ] T096 [P] [US2] Document accessibility features for FormField component in packages/ui/src/molecules/FormField/FormField.mdx
- [ ] T097 [US2] Create accessibility guidelines document in docs/accessibility-guidelines.md

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently. All components pass WCAG 2.1 AA audits and visual regression tests.

---

## Phase 5: User Story 3 - Agency Partner Customizes Tenant Branding (Priority: P3)

**Goal**: Enable multi-tenant theming so agency partners can white-label the platform with custom branding

**Independent Test**: Create two tenant themes with different colors and logos. Switch between tenants and verify all components update without page reload. Test invalid theme configuration fallbacks.

### Theme Loading System

- [ ] T098 [P] [US3] Create theme API client in packages/ui/src/utils/theme-api.ts (fetches tenant theme from backend)
- [ ] T099 [US3] Implement theme caching in packages/ui/src/utils/theme-cache.ts (avoid repeated API calls)
- [ ] T100 [US3] Create theme validation schema in packages/ui/src/tokens/theme-schema.ts (Zod validation)
- [ ] T101 [US3] Enhance ThemeProvider to load and apply tenant themes in packages/ui/src/providers/ThemeProvider.tsx
- [ ] T102 [US3] Create theme switcher component in packages/ui/src/molecules/ThemeSwitcher/ThemeSwitcher.tsx (admin only)
- [ ] T103 [US3] Create theme switcher tests in packages/ui/tests/unit/molecules/ThemeSwitcher.test.tsx

### Theme Fallbacks & Error Handling

- [ ] T104 [P] [US3] Implement fallback to default theme when tenant theme fails to load in packages/ui/src/providers/ThemeProvider.tsx
- [ ] T105 [US3] Handle invalid theme configuration values gracefully in packages/ui/src/tokens/theme-schema.ts
- [ ] T106 [US3] Create error boundary for theme loading failures in packages/ui/src/providers/ThemeErrorBoundary.tsx
- [ ] T107 [US3] Test theme loading failures in packages/ui/tests/unit/providers/ThemeProvider.test.tsx

### Demo Tenant Themes

- [ ] T108 [P] [US3] Create default theme configuration in packages/ui/src/tokens/themes/default.ts
- [ ] T109 [P] [US3] Create Masafh theme configuration in packages/ui/src/tokens/themes/masafh.ts
- [ ] T110 [P] [US3] Create example agency theme configuration in packages/ui/src/tokens/themes/agency-demo.ts
- [ ] T111 [US3] Create theme switching demo page in apps/web/src/routes/theme-switcher.tsx
- [ ] T112 [US3] Create theme integration E2E tests in apps-web/tests/e2e/theme-switching.spec.ts

**Checkpoint**: All user stories should now be independently functional. Agency partners can white-label the platform with custom branding.

---

## Phase 6: User Story 4 - International User Experiences Right-to-Left Layout (Priority: P2)

**Goal**: Proper RTL rendering for Arabic and other RTL languages with automatic layout mirroring

**Independent Test**: Switch application language between English (LTR) and Arabic (RTL). Verify all layouts, spacing, icons, and text alignment mirror correctly across all components.

### RTL Infrastructure

- [ ] T113 [P] [US4] Enhance DirectionProvider to support automatic direction detection in packages/ui/src/providers/DirectionProvider.tsx
- [ ] T114 [US4] Implement logical properties utilities in packages/ui/src/utils/logical-properties.ts (margin-inline-start, etc.)
- [ ] T115 [US4] Create directional icon transformer in packages/ui/src/utils/icon-transformer.ts (flips arrows in RTL)
- [ ] T116 [US4] Add hook useDirection in packages/ui/src/hooks/useDirection.ts (access current direction)

### Component RTL Fixes

- [ ] T117 [P] [US4] Verify Button component uses logical properties in packages/ui/src/atoms/Button/Button.tsx
- [ ] T118 [P] [US4] Verify Input component uses logical properties in packages/ui/src/atoms/Input/Input.tsx
- [ ] T119 [P] [US4] Verify Card component uses logical properties in packages/ui/src/molecules/Card/Card.tsx
- [ ] T120 [P] [US4] Verify FormField component uses logical properties in packages/ui/src/molecules/FormField/FormField.tsx
- [ ] T121 [US4] Verify Dropdown component mirrors correctly in packages/ui/src/molecules/Dropdown/Dropdown.tsx
- [ ] T122 [US4] Verify Tooltip component mirrors correctly in packages/ui/src/molecules/Tooltip/Tooltip.tsx

### RTL Testing

- [ ] T123 [P] [US4] Create RTL test suite for atom components in packages/ui/tests/rtl/atoms-rtl.test.tsx
- [ ] T124 [P] [US4] Create RTL test suite for molecule components in packages/ui/tests/rtl/molecules-rtl.test.tsx
- [ ] T125 [US4] Test bidirectional text (mixed LTR and RTL) in packages/ui/tests/rtl/bidirectional-text.test.tsx
- [ ] T126 [US4] Create RTL switching demo page in apps/web/src/routes/rtl-demo.tsx
- [ ] T127 [US4] Create RTL E2E tests in apps/web/tests/e2e/rtl-switching.spec.ts

### Translation Completeness

- [ ] T128 [P] [US4] Verify all translation keys exist for English in apps/web/src/i18n/locales/en.json
- [ ] T129 [P] [US4] Verify all translation keys exist for Arabic in apps/web/src/i18n/locales/ar.json
- [ ] T130 [US4] Create missing translation key detector in apps-web/tests/i18n/translation-completeness.test.ts

**Checkpoint**: All user stories should now be independently functional. RTL users experience properly mirrored layouts.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

### Documentation

- [ ] T131 [P] Setup Ladle for component documentation in packages/ui/ladle.config.ts
- [ ] T132 [P] Create Ladle stories for Button component in packages/ui/src/atoms/Button/Button.stories.tsx
- [ ] T133 [P] Create Ladle stories for Input component in packages/ui/src/atoms/Input/Input.stories.tsx
- [ ] T134 [P] Create Ladle stories for Card component in packages/ui/src/molecules/Card/Card.stories.tsx
- [ ] T135 [P] Create Ladle stories for FormField component in packages/ui/src/molecules/FormField/FormField.stories.tsx
- [ ] T136 [P] Create design token documentation in packages-ui/docs/design-tokens.md
- [ ] T137 Create component library README in packages/ui/README.md

### Performance Optimization

- [ ] T138 [P] Implement route-based code splitting for components >50KB in apps/web/src/routes/__root.tsx
- [ ] T139 [P] Setup bundle size analysis in packages/ui/package.json (bundlesize package)
- [ ] T140 Verify initial bundle size <500KB gzipped
- [ ] T141 Implement lazy loading for heavy components (DatePicker, Dropdown, Popover) in packages/ui/src/index.ts

### CI/CD Integration

- [ ] T142 [P] Add accessibility tests to CI pipeline in .github/workflows/ci.yml
- [ ] T143 [P] Add visual regression tests to CI pipeline in .github/workflows/ci.yml
- [ ] T144 [P] Add RTL tests to CI pipeline in .github/workflows/ci.yml
- [ ] T145 Add bundle size check to CI pipeline in .github/workflows/ci.yml

### Quality Assurance

- [ ] T146 [P] Run final accessibility audit on all components
- [ ] T147 [P] Run final visual regression tests on all components
- [ ] T148 [P] Run final RTL tests on all components
- [ ] T149 Verify test coverage meets 70%+ target
- [ ] T150 Update quickstart.md with any discovered setup issues
- [ ] T151 Validate all success criteria from spec.md are met

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational completion - No dependencies on other stories
- **User Story 2 (Phase 4)**: Depends on User Story 1 completion (needs components to audit)
- **User Story 3 (Phase 5)**: Depends on Foundational completion - Can run parallel to US1 and US2
- **User Story 4 (Phase 6)**: Depends on Foundational completion - Can run parallel to US1 and US2
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1 - MVP)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Depends on User Story 1 (must audit components after they exist)
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Independent of US1 and US2
- **User Story 4 (P2)**: Can start after Foundational (Phase 2) - Independent of US1 and US2

### Within Each User Story

- Tests MUST be written and FAIL before implementation (Test-Driven Development)
- Component creation before component tests
- Atom components before molecule components (molecules compose atoms)
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel (T002-T007)
- All Foundational tasks marked [P] can run in parallel (T018-T027, T020-T021, T024-T027)
- All atom components in US1 marked [P] can run in parallel (T036-T056)
- All molecule components in US1 marked [P] can run in parallel (T058-T076)
- All accessibility audits in US2 marked [P] can run in parallel (T081-T082, T088-T091, T093-T096)
- All theme creation in US3 marked [P] can run in parallel (T108-T110)
- All RTL verification in US4 marked [P] can run in parallel (T117-T122, T123-T124, T128-T129)
- All Ladle stories in Phase 7 marked [P] can run in parallel (T132-T135)
- All CI/CD additions in Phase 7 marked [P] can run in parallel (T142-T144)
- User Stories 3 and 4 can run in parallel with User Story 1 (if team capacity allows)

---

## Parallel Example: User Story 1

```bash
# Launch all atom component creation together (11 developers):
Task: T036 - Create Button component
Task: T038 - Create Input component
Task: T040 - Create Checkbox component
Task: T042 - Create Radio component
Task: T044 - Create Switch component
Task: T046 - Create Badge component
Task: T048 - Create Icon component
Task: T050 - Create Spinner component
Task: T052 - Create Typography component
Task: T054 - Create Link component
Task: T056 - Create Separator component

# After atoms complete, launch all molecule component creation together (10 developers):
Task: T058 - Create FormField component
Task: T060 - Create SearchInput component
Task: T062 - Create Select component
Task: T064 - Create DatePicker component
Task: T066 - Create Card component
Task: T068 - Create Dropdown component
Task: T070 - Create Tooltip component
Task: T072 - Create Popover component
Task: T074 - Create Alert component
Task: T076 - Create Toast component
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently (all 21 components working)
5. Deploy/demo if ready

**Estimated Time**: 2 weeks

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Add User Story 4 → Test independently → Deploy/Demo
6. Each story adds value without breaking previous stories

**Estimated Time**: 3 weeks total

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together (Week 1)
2. Once Foundational is done (Week 2):
   - Developer A: User Story 1 (atoms and molecules)
   - Developer B: User Story 2 (accessibility audits - after some US1 components exist)
   - Developer C: User Story 3 (theme system - independent of US1)
   - Developer D: User Story 4 (RTL support - independent of US1)
3. Stories complete and integrate independently (Week 3)
4. Polish and documentation (Week 3)

**Estimated Time**: 2-3 weeks with parallel development

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing (TDD approach)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- User Stories 3 and 4 can start in parallel with User Story 1 once Foundational phase is complete
- This enables faster overall delivery if team capacity allows
