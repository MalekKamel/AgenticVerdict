# Feature Specification: Templates

**Feature Branch**: `001-ui-foundation` → `006-templates`  
**Created**: 2026-04-14  
**Status**: Draft  
**Input**: UI Phase 06 - Templates library and customization for accelerated insight creation

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Template Library Browsing (Priority: P1)

As a business user, I want to browse a library of pre-built templates categorized by business domain and use case, so that I can quickly discover and select appropriate starting points for my insights without building configurations from scratch.

**Why this priority**: This is the entry point for template usage. Without discoverability and browsing, users cannot leverage templates to accelerate their workflow. This is the foundation for all template functionality.

**Independent Test**: Can be fully tested by navigating to `/templates`, viewing the template library, searching/filtering templates, and accessing template details—delivering immediate value by showing available templates even before creation/editing is implemented.

**Acceptance Scenarios**:

1. **Given** I am on the templates page, **When** the page loads, **Then** I see a grid of template cards with preview images, titles, descriptions, and category badges
2. **Given** I am browsing templates, **When** I click on a category filter (e.g., "Marketing", "Finance", "Operations"), **Then** the grid updates to show only templates in that category
3. **Given** I am browsing templates, **When** I type in the search box, **Then** the grid filters to show templates matching my search term in title or description
4. **Given** I have applied filters/search, **When** I click "Clear Filters", **Then** all templates are displayed again
5. **Given** I see a template card, **When** I hover over it, **Then** the card shows a subtle lift animation and a "View Details" button appears
6. **Given** I click on a template card, **When** the template detail page loads, **Then** I see the template preview, full description, associated business domains, configuration summary, and "Use Template" button

---

### User Story 2 - Template Creation and Management (Priority: P2)

As a power user or administrator, I want to create custom templates from my insight configurations, so that I can standardize workflows across my team and accelerate recurring insight creation tasks.

**Why this priority**: After users can discover templates, they need the ability to create their own. This enables team standardization and workflow acceleration, making templates more valuable than just system-provided defaults.

**Independent Test**: Can be fully tested by creating an insight with specific configurations, saving it as a template, naming and describing it, assigning categories, and seeing it appear in the template library—delivering value by enabling template creation and reuse.

**Acceptance Scenarios**:

1. **Given** I have created an insight with connectors, metrics, and AI configuration, **When** I click "Save as Template", **Then** a modal opens where I can enter template name, description, categories, and preview image
2. **Given** I am in the template creation modal, **When** I upload a preview image or choose to generate one automatically, **Then** the image is validated and displayed as the template thumbnail
3. **Given** I am creating a template, **When** I select one or more business domain categories, **Then** the template is tagged and will appear in those category filters
4. **Given** I have filled in all required template fields, **When** I click "Save Template", **Then** the template is saved, a success toast appears, and I'm redirected to the template library with my new template highlighted
5. **Given** I created a template, **When** I view it in the library, **Then** I see an "Owner" badge indicating I created it, and I have options to edit or delete it
6. **Given** I am viewing my template, **When** I click "Delete Template", **Then** a confirmation modal appears asking me to confirm deletion
7. **Given** I confirm template deletion, **When** the deletion completes, **Then** the template is removed from the library and a success toast appears

---

### User Story 3 - Template Usage and Insight Instantiation (Priority: P3)

As a business user, I want to use a template to quickly create a new insight with pre-configured settings, so that I can skip manual configuration and get to value faster.

**Why this priority**: This is the core value proposition of templates—accelerating insight creation. While browsing and creation are important, usage is what delivers actual time savings to users.

**Independent Test**: Can be fully tested by selecting a template from the library, clicking "Use Template", being taken to the insight creation wizard with pre-filled configurations, modifying any settings, and saving the insight—delivering value by demonstrating accelerated workflow.

**Acceptance Scenarios**:

1. **Given** I am viewing a template detail page, **When** I click "Use Template", **Then** I'm redirected to the insight creation wizard with all template configurations pre-loaded
2. **Given** I'm using a template, **When** the insight creation wizard loads, **Then** I see the template name at the top with an indicator that I'm working from a template
3. **Given** I'm working from a template, **When** I review the pre-filled settings, **Then** all connector selections, metric configurations, AI settings, and scheduling options match the template definition
4. **Given** I'm using a template, **When** I modify any configuration, **Then** my changes override the template defaults without affecting the original template
5. **Given** I'm using a template, **When** I click "Save Insight", **Then** the insight is created with my configuration and added to my insight library
6. **Given** I'm using a template, **When** I click "Cancel", **Then** I'm returned to the template library without creating an insight
7. **Given** I've used a template before, **When** I return to the template detail page, **Then** I see a "Recently Used" timestamp indicating when I last used it

---

### User Story 4 - Template Cloning and Customization (Priority: P4)

As a power user, I want to clone an existing template and modify it, so that I can create variations without starting from scratch or modifying the original template.

**Why this priority**: Cloning enables iterative template refinement and supports variations (e.g., monthly vs quarterly report templates). It's lower priority because users can still achieve their goals by creating templates from insights, but cloning is more efficient.

**Independent Test**: Can be fully tested by selecting a template, clicking "Clone", being taken to the template editor with a copy of the template, making modifications, and saving it as a new template—delivering value by enabling efficient template iteration.

**Acceptance Scenarios**:

1. **Given** I am viewing a template detail page, **When** I click "Clone Template", **Then** I'm redirected to the template editor with a copy of the template and "Copy of" prepended to the name
2. **Given** I'm editing a cloned template, **When** I modify any configuration (name, description, categories, insight settings), **Then** my changes apply only to the cloned template, not the original
3. **Given** I'm editing a cloned template, **When** I click "Save Template", **Then** a new template is created and I'm redirected to its detail page
4. **Given** I've cloned a template, **When** I view the template library, **Then** I see both the original template and my cloned version as separate cards
5. **Given** I'm viewing my cloned template, **When** I click "Delete Template", **Then** only the cloned template is deleted, not the original

---

### User Story 5 - Template Preview and Validation (Priority: P5)

As a business user, I want to preview what an insight created from a template will look like before using it, so that I can ensure the template meets my needs and avoid configuration mistakes.

**Why this priority**: Preview reduces friction and increases confidence in template selection. It's a nice-to-have enhancement that improves user experience but isn't critical for MVP functionality.

**Independent Test**: Can be fully tested by viewing a template detail page, clicking "Live Preview", seeing a rendered preview of the insight with sample data, interacting with the preview (switching tabs, resizing), and closing the preview—delivering value by enabling informed template selection.

**Acceptance Scenarios**:

1. **Given** I am viewing a template detail page, **When** I click "Live Preview", **Then** a modal opens showing a rendered preview of the insight with sample data
2. **Given** the preview modal is open, **When** it loads, **Then** I see tabs for different preview views (Summary, Metrics, AI Insights, Schedule)
3. **Given** I'm viewing the preview, **When** I switch tabs, **Then** the preview content updates to show that section with template-specific data
4. **Given** I'm viewing the preview, **When** I resize the browser window, **Then** the preview responsively adjusts to the new size
5. **Given** I'm viewing the preview, **When** I click "Use This Template", **Then** the preview closes and I'm taken to the insight creation wizard with the template pre-loaded
6. **Given** I'm viewing the preview, **When** I click "Close Preview", **Then** the modal closes and I'm returned to the template detail page

---

### User Story 6 - Multi-Language Template Content (Priority: P6)

As a multilingual user, I want to browse and use templates with content in my preferred language, so that the template library is accessible to users across different regions and language preferences.

**Why this priority**: Internationalization is a core platform principle, but for templates it's an enhancement. The system can support multi-language templates without requiring all templates to be translated immediately.

**Independent Test**: Can be fully tested by switching the UI language to Arabic, browsing the template library, seeing template titles/descriptions in Arabic where available (with fallback to English for untranslated templates), and using a template—delivering value by enabling multilingual template discovery.

**Acceptance Scenarios**:

1. **Given** my UI language is set to Arabic, **When** I browse the template library, **Then** templates with Arabic translations display Arabic titles and descriptions, while others show English
2. **Given** my UI language is set to Arabic, **When** I view a template with Arabic content, **Then** the template detail page shows all text in Arabic with RTL layout
3. **Given** my UI language is English, **When** I browse templates, **Then** all templates display English content (with Arabic available as a secondary language if set)
4. **Given** I am creating a template, **When** I enter template details, **Then** I can provide content for multiple languages (title, description in Arabic and English)
5. **Given** I use a template with multi-language content, **When** the insight is created, **Then** the insight inherits the template's content in my selected language
6. **Given** I switch languages while viewing the template library, **When** the language change completes, **Then** the page refreshes and all template text updates to the new language

---

### Edge Cases

- What happens when a user tries to delete a template that is currently being used by other users' insights?
- How does the system handle templates with connector configurations that the current user doesn't have access to?
- What happens when a template references a connector that has been removed or is no longer available?
- How does the system handle templates with outdated AI configurations after a platform update?
- What happens when a user without administrative privileges tries to create a template (if template creation is restricted)?
- How does the system handle templates with missing or corrupted preview images?
- What happens when a template is cloned, then the original template is deleted?
- How does the system handle template names that exceed character limits or contain special characters?
- What happens when search/filter criteria match no templates?
- How does the system handle concurrent edits to the same template by multiple users?
- What happens when a template is used, then the template is updated—should existing insights be affected?

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST display a library of pre-built templates organized by business domain and use case
- **FR-002**: System MUST provide category filtering for templates (Marketing, Finance, Operations, SEO, Social Media, Local Business)
- **FR-003**: System MUST provide full-text search across template titles and descriptions
- **FR-004**: System MUST display template cards with preview image, title, description, and category badges
- **FR-005**: System MUST provide a template detail page showing preview, full description, domains, configuration summary, and action buttons
- **FR-006**: System MUST allow users to save existing insight configurations as templates
- **FR-007**: System MUST allow template creators to upload custom preview images or use auto-generated previews
- **FR-008**: System MUST allow template creators to assign multiple business domain categories to templates
- **FR-009**: System MUST allow users to use a template to create a new insight with pre-configured settings
- **FR-010**: System MUST pre-fill all insight configuration fields when a template is used (connectors, metrics, AI settings, schedule)
- **FR-011**: System MUST allow users to modify template defaults during insight creation without affecting the original template
- **FR-012**: System MUST provide template cloning functionality to create variations without modifying originals
- **FR-013**: System MUST provide template preview functionality showing rendered insight with sample data
- **FR-014**: System MUST allow template owners to edit and delete their own templates
- **FR-015**: System MUST support multi-language template content (titles, descriptions) with language-specific fallbacks
- **FR-016**: System MUST display recently used templates with timestamps
- **FR-017**: System MUST validate template configurations before saving (e.g., all referenced connectors exist)
- **FR-018**: System MUST show confirmation dialogs before destructive actions (template deletion)
- **FR-019**: System MUST provide clear visual indicators for system templates vs. user-created templates
- **FR-020**: System MUST support RTL layout for Arabic template content

### Key Entities

- **Template**: Reusable insight configuration with metadata (id, name, description, previewImage, categories, owner, createdAt, updatedAt, isSystemTemplate, content)
- **TemplateContent**: Multi-language content for templates (language, title, description)
- **TemplateConfiguration**: Insight configuration stored in template (connectors, metrics, aiSettings, schedule, deliverySettings)
- **TemplateCategory**: Business domain categorization (id, name, slug, icon, description)
- **TemplateUsage**: Tracking for template usage (id, templateId, userId, usedAt, insightId)

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Users can discover and select an appropriate template in under 60 seconds from the template library page
- **SC-002**: Users can create a new insight from a template 70% faster than creating from scratch (measured by time to save insight)
- **SC-003**: 90% of users who browse the template library report finding templates relevant to their use cases
- **SC-004**: Template creation from existing insights takes under 2 minutes including naming, categorization, and preview image selection
- **SC-005**: Template preview loads in under 3 seconds even with complex configurations
- **SC-006**: Multi-language template content displays correctly in both LTR and RTL layouts with no text overflow or alignment issues
- **SC-007**: 80% of users who use templates report increased confidence in insight creation compared to starting from scratch

## Assumptions

- Templates are scoped at the tenant level (not global across all tenants)
- Template creation is available to all users, but administrative privileges may be required for system template management
- Template content supports at minimum English and Arabic, with extensibility for additional languages
- Templates store references to connectors rather than actual connector credentials, ensuring security when templates are shared
- Template preview uses mock/sample data rather than actual user data to maintain privacy
- Template usage does not affect performance metrics for template popularity ranking in Phase 06 (can be added in future phases)
- Templates are versioned to allow updates without breaking existing insights created from previous versions
- Templates support domain-specific configurations (e.g., Marketing templates include campaign metrics, Finance templates include revenue metrics)
- Template preview images are stored as URLs or base64-encoded data with size limits to prevent storage bloat
- Template search uses basic text matching in Phase 06; advanced fuzzy search can be added in future phases
- Template categories are predefined by the system; custom category creation is not supported in Phase 06
