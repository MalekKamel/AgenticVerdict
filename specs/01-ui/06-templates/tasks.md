# Tasks: Templates (Phase 06)

**Input**: Design documents from `/specs/01-ui/06-templates/`
**Prerequisites**: plan.md (required), spec.md (required for user stories)

**Tests**: E2E tests are required for critical user journeys (template browsing, creation, usage, cloning, deletion). Unit tests required for business logic (template CRUD, multi-language fallbacks).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web frontend**: `apps/web/src/`
- **Database schema**: `packages/database/src/schema/`
- **tRPC router**: `packages/api/src/router/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Database schema, tRPC router, and base components

- [ ] T001 Create database migration for templates table in `packages/database/src/schema/templates.ts`
- [ ] T002 [P] Create database migration for template_content table in `packages/database/src/schema/template-content.ts`
- [ ] T003 [P] Create database migration for template_configurations table in `packages/database/src/schema/template-configurations.ts`
- [ ] T004 [P] Create database migration for template_categories table in `packages/database/src/schema/template-categories.ts`
- [ ] T005 [P] Create database migration for template_category_associations table in `packages/database/src/schema/template-category-associations.ts`
- [ ] T006 [P] Create database migration for template_usage table in `packages/database/src/schema/template-usage.ts`
- [ ] T007 Run database migrations to create template tables
- [ ] T008 [P] Seed initial template categories (Marketing, Finance, Operations, SEO, Social, Local) in `packages/database/src/seed/seed-templates.ts`
- [ ] T009 [P] Create tRPC router skeleton in `packages/api/src/router/templates.ts`
- [ ] T010 [P] Create Zod schema for template validation in `packages/api/src/router/templates/schema.ts`
- [ ] T011 Create template store in `apps/web/src/stores/template-store.ts`

**Checkpoint**: Database schema ready, tRPC router created, base components scaffolded

---

## Phase 2: Foundational Components (Blocking Prerequisites)

**Purpose**: Core components that all user stories depend on

⚠️ **CRITICAL**: No user story work can begin until this phase is complete

- [ ] T012 [P] Create TemplateCard component in `apps/web/src/components/templates/TemplateCard.tsx`
- [ ] T013 [P] Create TemplateGrid component in `apps/web/src/components/templates/TemplateGrid.tsx`
- [ ] T014 [P] Create TemplateCategoryBadge component in `apps/web/src/components/templates/TemplateCategoryBadge.tsx`
- [ ] T015 Create TemplateFilterBar component in `apps/web/src/components/templates/TemplateFilterBar.tsx` (depends on T014)
- [ ] T016 [P] Create template route directory structure in `apps/web/src/routes/templates_/`
- [ ] T017 [P] Implement tRPC procedure `templates.list` in `packages/api/src/router/templates.ts`
- [ ] T018 [P] Implement tRPC procedure `templates.byId` in `packages/api/src/router/templates.ts`
- [ ] T019 [P] Implement tRPC procedure `templates.categories.list` in `packages/api/src/router/templates.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Template Library Browsing (Priority: P1) 🎯 MVP

**Goal**: Enable users to browse, search, and filter templates

**Independent Test**: Navigate to `/templates`, view template library, apply category filters, search templates, click template card to view details

### E2E Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T020 [P] [US1] E2E test: Browse template library in `apps/web/tests/e2e/templates/library.spec.ts`
- [ ] T021 [P] [US1] E2E test: Category filtering in `apps/web/tests/e2e/templates/filtering.spec.ts`
- [ ] T022 [P] [US1] E2E test: Search templates in `apps/web/tests/e2e/templates/search.spec.ts`
- [ ] T023 [P] [US1] E2E test: View template details in `apps/web/tests/e2e/templates/details.spec.ts`

### Unit Tests for User Story 1

- [ ] T024 [P] [US1] Unit test: TemplateCard component in `apps/web/tests/components/templates/TemplateCard.test.tsx`
- [ ] T025 [P] [US1] Unit test: TemplateFilterBar component in `apps/web/tests/components/templates/TemplateFilterBar.test.tsx`
- [ ] T026 [P] [US1] Unit test: Filter and search logic in `apps/web/tests/lib/template-filtering.test.ts`

### Implementation for User Story 1

- [ ] T027 [US1] Implement templates list page in `apps/web/src/routes/templates_/index.tsx` (depends on T012, T013, T015, T017, T019)
- [ ] T028 [US1] Implement template detail page in `apps/web/src/routes/templates_/$templateId.tsx` (depends on T012, T018)
- [ ] T029 [US1] Connect template store to filter bar for state management in `apps/web/src/routes/templates_/index.tsx` (depends on T011, T015)
- [ ] T030 [US1] Implement client-side filtering logic in `apps/web/src/components/templates/TemplateGrid.tsx` (depends on T013)
- [ ] T031 [US1] Implement client-side search logic in `apps/web/src/components/templates/TemplateGrid.tsx` (depends on T013)
- [ ] T032 [US1] Add loading skeletons for template cards in `apps/web/src/components/templates/TemplateCard.tsx` (depends on T012)
- [ ] T033 [US1] Add error handling for failed template fetches in `apps/web/src/routes/templates_/index.tsx` (depends on T027)
- [ ] T034 [US1] Implement hover animations for template cards in `apps/web/src/components/templates/TemplateCard.tsx` (depends on T012)
- [ ] T035 [US1] Add "Clear Filters" functionality in `apps/web/src/components/templates/TemplateFilterBar.tsx` (depends on T015)

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Template Creation and Management (Priority: P2)

**Goal**: Enable users to create custom templates from insights and manage their templates

**Independent Test**: Create an insight, save it as a template with name/description/categories/preview, see it in the library, edit it, delete it

### E2E Tests for User Story 2

- [ ] T036 [P] [US2] E2E test: Save insight as template in `apps/web/tests/e2e/templates/create-from-insight.spec.ts`
- [ ] T037 [P] [US2] E2E test: Edit template in `apps/web/tests/e2e/templates/edit.spec.ts`
- [ ] T038 [P] [US2] E2E test: Delete template in `apps/web/tests/e2e/templates/delete.spec.ts`

### Unit Tests for User Story 2

- [ ] T039 [P] [US2] Unit test: TemplateForm component in `apps/web/tests/components/templates/TemplateForm.test.tsx`
- [ ] T040 [P] [US2] Unit test: InsightSaveAsTemplateModal in `apps/web/tests/components/insights/InsightSaveAsTemplateModal.test.tsx`
- [ ] T041 [P] [US2] Unit test: Template CRUD operations in `packages/api/tests/router/templates.test.ts`

### Implementation for User Story 2

- [ ] T042 [P] [US2] Create TemplateForm component in `apps/web/src/components/templates/TemplateForm.tsx`
- [ ] T043 [P] [US2] Create TemplatePreviewImage component in `apps/web/src/components/templates/TemplatePreviewImage.tsx`
- [ ] T044 [P] [US2] Create InsightSaveAsTemplateModal in `apps/web/src/components/insights/InsightSaveAsTemplateModal.tsx`
- [ ] T045 [US2] Implement tRPC procedure `templates.create` in `packages/api/src/router/templates.ts`
- [ ] T046 [US2] Implement tRPC procedure `templates.update` in `packages/api/src/router/templates.ts`
- [ ] T047 [US2] Implement tRPC procedure `templates.delete` in `packages/api/src/router/templates.ts`
- [ ] T048 [US2] Add "Save as Template" button to insight detail page in `apps/web/src/routes/insights_/$insightId.tsx` (depends on T044)
- [ ] T049 [US2] Implement template creation route in `apps/web/src/routes/templates_/create.tsx` (depends on T042, T043)
- [ ] T050 [US2] Implement template edit route in `apps/web/src/routes/templates_/$templateId/edit.tsx` (depends on T042, T043)
- [ ] T051 [US2] Add form validation for template creation/editing in `apps/web/src/components/templates/TemplateForm.tsx` (depends on T042)
- [ ] T052 [US2] Implement image upload with drag-and-drop in `apps/web/src/components/templates/TemplatePreviewImage.tsx` (depends on T043)
- [ ] T053 [US2] Add category multi-select in `apps/web/src/components/templates/TemplateForm.tsx` (depends on T042, T014)
- [ ] T054 [US2] Implement template ownership checks in `packages/api/src/router/templates.ts` (depends on T045, T046, T047)
- [ ] T055 [US2] Add confirmation dialog for template deletion in `apps/web/src/routes/templates_/$templateId.tsx` (depends on T028)
- [ ] T056 [US2] Add success/error toasts for template CRUD operations in `apps/web/src/routes/templates_/index.tsx` (depends on T027)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Template Usage and Insight Instantiation (Priority: P3)

**Goal**: Enable users to use templates to create insights with pre-filled configurations

**Independent Test**: Select a template, click "Use Template", verify insight creation wizard is pre-filled, modify settings, save insight

### E2E Tests for User Story 3

- [ ] T057 [P] [US3] E2E test: Use template to create insight in `apps/web/tests/e2e/templates/use-template.spec.ts`
- [ ] T058 [P] [US3] E2E test: Template pre-fills insight configuration in `apps/web/tests/e2e/templates/template-prefill.spec.ts`

### Unit Tests for User Story 3

- [ ] T059 [P] [US3] Unit test: Template usage tracking in `packages/api/tests/router/templates.test.ts`
- [ ] T060 [P] [US3] Unit test: Template configuration pre-filling in `apps/web/tests/lib/template-to-insight.test.ts`

### Implementation for User Story 3

- [ ] T061 [US3] Implement tRPC procedure `templates.use` in `packages/api/src/router/templates.ts`
- [ ] T062 [US3] Add "Use Template" button to template detail page in `apps/web/src/routes/templates_/$templateId.tsx` (depends on T028)
- [ ] T063 [US3] Implement redirect to insight creation with template data in `apps/web/src/routes/templates_/$templateId.tsx` (depends on T062)
- [ ] T064 [US3] Modify insight creation wizard to accept template data in `apps/web/src/routes/insights_/create.tsx`
- [ ] T065 [US3] Implement template configuration pre-filling in insight creation wizard in `apps/web/src/routes/insights_/create.tsx` (depends on T064)
- [ ] T066 [US3] Add "Working from template" indicator to insight creation in `apps/web/src/routes/insights_/create.tsx` (depends on T064)
- [ ] T067 [US3] Record template usage in database in `packages/api/src/router/templates.ts` (depends on T061)
- [ ] T068 [US3] Handle cancellation of template usage in `apps/web/src/routes/insights_/create.tsx` (depends on T064)
- [ ] T069 [US3] Add "Recently Used" section to template library in `apps/web/src/routes/templates_/index.tsx` (depends on T027)
- [ ] T070 [US3] Query recently used templates via tRPC in `packages/api/src/router/templates.ts`

**Checkpoint**: At this point, User Stories 1, 2, AND 3 should all work independently

---

## Phase 6: User Story 4 - Template Cloning and Customization (Priority: P4)

**Goal**: Enable users to clone templates and create variations

**Independent Test**: View a template, click "Clone Template", see cloned template in editor, modify it, save as new template

### E2E Tests for User Story 4

- [ ] T071 [P] [US4] E2E test: Clone template in `apps/web/tests/e2e/templates/clone.spec.ts`

### Unit Tests for User Story 4

- [ ] T072 [P] [US4] Unit test: Template cloning logic in `packages/api/tests/router/templates.test.ts`

### Implementation for User Story 4

- [ ] T073 [US4] Implement tRPC procedure `templates.clone` in `packages/api/src/router/templates.ts`
- [ ] T074 [US4] Add "Clone Template" button to template detail page in `apps/web/src/routes/templates_/$templateId.tsx` (depends on T028)
- [ ] T075 [US4] Implement template clone route in `apps/web/src/routes/templates_/clone.tsx` (depends on T073)
- [ ] T076 [US4] Prepend "Copy of" to cloned template name in `packages/api/src/router/templates.ts` (depends on T073)
- [ ] T077 [US4] Set current user as cloned template owner in `packages/api/src/router/templates.ts` (depends on T073)
- [ ] T078 [US4] Redirect to template edit page after clone in `apps/web/src/routes/templates_/clone.tsx` (depends on T075)

**Checkpoint**: All user stories should now be independently functional

---

## Phase 7: User Story 5 - Template Preview and Validation (Priority: P5)

**Goal**: Enable users to preview templates before using them

**Independent Test**: View template detail, click "Live Preview", see rendered preview with sample data, switch tabs, close preview

### E2E Tests for User Story 5

- [ ] T079 [P] [US5] E2E test: Preview template in `apps/web/tests/e2e/templates/preview.spec.ts`

### Unit Tests for User Story 5

- [ ] T080 [P] [US5] Unit test: TemplatePreview component in `apps/web/tests/components/templates/TemplatePreview.test.tsx`
- [ ] T081 [P] [US5] Unit test: Mock data generation for preview in `apps/web/tests/lib/template-preview-data.test.ts`

### Implementation for User Story 5

- [ ] T082 [P] [US5] Create TemplatePreview component in `apps/web/src/components/templates/TemplatePreview.tsx`
- [ ] T083 [US5] Create mock data generator for template preview in `apps/web/src/lib/template-preview-mock-data.ts`
- [ ] T084 [US5] Implement tabbed preview interface in `apps/web/src/components/templates/TemplatePreview.tsx` (depends on T082)
- [ ] T085 [US5] Add preview tabs (Summary, Metrics, AI Insights, Schedule) in `apps/web/src/components/templates/TemplatePreview.tsx` (depends on T082)
- [ ] T086 [US5] Implement responsive preview layout in `apps/web/src/components/templates/TemplatePreview.tsx` (depends on T082)
- [ ] T087 [US5] Add "Live Preview" button to template detail page in `apps/web/src/routes/templates_/$templateId.tsx` (depends on T028, T082)
- [ ] T088 [US5] Add "Use This Template" button in preview modal in `apps/web/src/components/templates/TemplatePreview.tsx` (depends on T082)
- [ ] T089 [US5] Add "Close Preview" button in preview modal in `apps/web/src/components/templates/TemplatePreview.tsx` (depends on T082)
- [ ] T090 [US5] Lazy load preview component in `apps/web/src/routes/templates_/$templateId.tsx` (depends on T028, T082)

**Checkpoint**: Template preview functionality complete

---

## Phase 8: User Story 6 - Multi-Language Template Content (Priority: P6)

**Goal**: Enable templates to support multi-language content

**Independent Test**: Switch UI to Arabic, browse template library, see Arabic template titles/descriptions, use template with Arabic content

### E2E Tests for User Story 6

- [ ] T091 [P] [US6] E2E test: Multi-language template browsing in `apps/web/tests/e2e/templates/multi-language.spec.ts`

### Unit Tests for User Story 6

- [ ] T092 [P] [US6] Unit test: Language fallback logic in `packages/api/tests/router/templates.test.ts`
- [ ] T093 [P] [US6] Unit test: RTL layout for templates in `apps/web/tests/components/templates/TemplateCard.test.tsx`

### Implementation for User Story 6

- [ ] T094 [P] [US6] Modify template queries to filter by current language in `packages/api/src/router/templates.ts`
- [ ] T095 [US6] Implement language fallback logic (current lang → English) in `packages/api/src/router/templates.ts` (depends on T094)
- [ ] T096 [US6] Create TemplateLanguageSelector component in `apps/web/src/components/templates/TemplateLanguageSelector.tsx`
- [ ] T097 [US6] Add multi-language input fields to template form in `apps/web/src/components/templates/TemplateForm.tsx` (depends on T042, T096)
- [ ] T098 [US6] Implement RTL layout for template detail page in `apps/web/src/routes/templates_/$templateId.tsx` (depends on T028)
- [ ] T099 [US6] Test template cards with Arabic content in `apps/web/tests/e2e/templates/rtl-layout.spec.ts`
- [ ] T100 [US6] Add language switching to template library page in `apps/web/src/routes/templates_/index.tsx` (depends on T027)
- [ ] T101 [US6] Verify template preview with Arabic content in `apps/web/src/components/templates/TemplatePreview.tsx` (depends on T082)

**Checkpoint**: Multi-language template support complete

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T102 [P] Add loading states to all template pages in `apps/web/src/routes/templates_/`
- [ ] T103 [P] Add error handling with user-friendly messages in `apps/web/src/routes/templates_/`
- [ ] T104 [P] Implement keyboard navigation for template library in `apps/web/src/components/templates/TemplateGrid.tsx`
- [ ] T105 [P] Add ARIA labels to all template components in `apps/web/src/components/templates/`
- [ ] T106 [P] Implement focus trap in template preview modal in `apps/web/src/components/templates/TemplatePreview.tsx`
- [ ] T107 [P] Add Enter/Space key handlers for template card activation in `apps/web/src/components/templates/TemplateCard.tsx`
- [ ] T108 [P] Optimize template images (WebP conversion, multiple sizes) in `apps/web/src/components/templates/TemplatePreviewImage.tsx`
- [ ] T109 [P] Lazy load template cards below the fold in `apps/web/src/components/templates/TemplateGrid.tsx`
- [ ] T110 [P] Implement caching for template list queries (5-minute TTL) in `packages/api/src/router/templates.ts`
- [ ] T111 [P] Add stale-while-revalidate for template detail pages in `apps/web/src/routes/templates_/$templateId.tsx`
- [ ] T112 [P] Add feature flag for template functionality in `packages/api/src/router/templates.ts`
- [ ] T113 [P] Add feature flag for template preview in `apps/web/src/components/templates/TemplatePreview.tsx`
- [ ] T114 [P] Add feature flag for user template creation in `packages/api/src/router/templates.ts`
- [ ] T115 Add template documentation in `docs/architecture/ui/templates.md`
- [ ] T116 Code cleanup and refactoring in `apps/web/src/components/templates/`
- [ ] T117 Performance optimization across all template pages (bundle analysis, code splitting)
- [ ] T118 Accessibility audit and remediation for template pages
- [ ] T119 Run E2E tests for all template user journeys in CI
- [ ] T120 Validate template functionality with sample data

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational Components (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-8)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3 → P4 → P5 → P6)
- **Polish (Phase 9)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Integrates with Insight creation (Phase 04) but independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Depends on US2 for template creation but independently testable with system templates
- **User Story 4 (P4)**: Can start after Foundational (Phase 2) - Integrates with US2 but independently testable
- **User Story 5 (P5)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 6 (P6)**: Can start after Foundational (Phase 2) - No dependencies on other stories

### Within Each User Story

- E2E tests MUST be written and FAIL before implementation
- Components before pages
- tRPC procedures before frontend integration
- Core implementation before integrations
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] in Phase 1 can run in parallel
- All Foundational tasks marked [P] in Phase 2 can run in parallel
- All E2E tests for a user story marked [P] can run in parallel
- All components marked [P] within a user story can run in parallel
- Different user stories can be worked on in parallel by different team members (after Phase 2)
- All unit tests marked [P] can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch all E2E tests for User Story 1 together:
Task: "E2E test: Browse template library in apps/web/tests/e2e/templates/library.spec.ts"
Task: "E2E test: Category filtering in apps/web/tests/e2e/templates/filtering.spec.ts"
Task: "E2E test: Search templates in apps/web/tests/e2e/templates/search.spec.ts"
Task: "E2E test: View template details in apps/web/tests/e2e/templates/details.spec.ts"

# Launch all unit tests for User Story 1 together:
Task: "Unit test: TemplateCard component in apps/web/tests/components/templates/TemplateCard.test.tsx"
Task: "Unit test: TemplateFilterBar component in apps/web/tests/components/templates/TemplateFilterBar.test.tsx"
Task: "Unit test: Filter and search logic in apps/web/tests/lib/template-filtering.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Add User Story 4 → Test independently → Deploy/Demo
6. Add User Story 5 → Test independently → Deploy/Demo
7. Add User Story 6 → Test independently → Deploy/Demo
8. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Template Library Browsing)
   - Developer B: User Story 2 (Template Creation and Management)
   - Developer C: User Story 5 (Template Preview - no dependencies)
3. Stories complete and integrate independently
4. Second iteration:
   - Developer A: User Story 3 (Template Usage)
   - Developer B: User Story 4 (Template Cloning)
   - Developer C: User Story 6 (Multi-Language Support)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify E2E tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- Templates must support both LTR and RTL layouts throughout
- All template pages must meet WCAG 2.1 AA accessibility standards
- Template preview images should be optimized for performance
