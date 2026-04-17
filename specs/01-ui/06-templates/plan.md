# Implementation Plan: Templates

**Branch**: `006-templates` | **Date**: 2026-04-14 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/01-ui/06-templates/spec.md`

## Summary

Phase 06 (Templates) implements a template library and customization system that accelerates insight creation by providing pre-built, reusable configurations. Users can browse templates by business domain, create custom templates from their insights, clone and modify existing templates, and preview templates before use. The system supports multi-language template content with RTL/LTR layouts, integrates with the existing tRPC API layer, and uses Mantine v9 forms for template creation and editing.

## Technical Context

**Language/Version**: TypeScript 5.3+ (strict mode), React 18+
**Primary Dependencies**: TanStack Start (file-based routing), Mantine UI v9 (component library), tRPC v11 (API layer), Zod (validation)
**Storage**: PostgreSQL via Drizzle ORM (template metadata, configurations, usage tracking)
**Testing**: Vitest (unit tests), Playwright (E2E tests for critical user journeys)
**Target Platform**: Web browser (Chrome, Firefox, Safari, Edge - last 2 versions)
**Project Type**: Web application (frontend in monorepo: `apps/frontend/`)
**Performance Goals**: <3s template library page load, <2s template detail page load, <3s preview modal load
**Constraints**: WCAG 2.1 AA compliance, RTL/LTR support, multi-language (English/Arabic minimum)
**Scale/Scope**: 6-8 pages/routes, 15-20 components, 10-12 tRPC procedures

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- ✅ **Single Language/Platform**: TypeScript/React web only - PASS
- ✅ **Standard Libraries**: Using TanStack Start, Mantine v9, tRPC - all production-proven - PASS
- ✅ **Testing Coverage**: 70%+ target with 80%+ for business logic (template CRUD) - PASS
- ✅ **No Database in Tests**: Uses mocked tRPC procedures for component testing - PASS
- ✅ **Documentation-First**: Spec, plan, tasks generated before implementation - PASS
- ✅ **No Authentication/Accounts**: Uses existing auth system from Phase 01 - PASS
- ✅ **No Cloud Services**: Uses existing PostgreSQL, Redis, BullMQ infrastructure - PASS
- ✅ **No Payment Processing**: Out of scope for Phase 06 - PASS
- ✅ **No CI/CD Setup**: Uses existing monorepo CI/CD - PASS
- ✅ **No AI/ML Integration**: Templates store AI configuration but don't execute AI - PASS
- ✅ **Deployment Agnostic**: Frontend builds to static assets, deploys to existing infrastructure - PASS

**Result**: All gates passed - Phase 06 can proceed to implementation

## Project Structure

### Documentation (this feature)

```text
specs/01-ui/06-templates/
├── spec.md              # This file (user stories, requirements, acceptance criteria)
├── plan.md              # Technical implementation (this file)
└── tasks.md             # Implementation tasks by user story
```

### Source Code (repository root)

```text
apps/frontend/src/
├── routes/
│   ├── templates_/
│   │   ├── index.tsx              # Template library page
│   │   ├── $templateId.tsx        # Template detail page
│   │   ├── create.tsx             # Template creation page (from insight)
│   │   ├── edit.tsx               # Template editing page
│   │   └── clone.tsx              # Template cloning page
│   └── insights_/
│       ├── $insightId.tsx         # Insight detail page (add "Save as Template" button)
│       └── create.tsx             # Insight creation (add template pre-filling)
├── components/
│   ├── templates/
│   │   ├── TemplateCard.tsx       # Template library card component
│   │   ├── TemplateGrid.tsx       # Grid layout for template cards
│   │   ├── TemplateFilterBar.tsx  # Category filters and search
│   │   ├── TemplateDetail.tsx     # Template detail view component
│   │   ├── TemplatePreview.tsx    # Live preview modal component
│   │   ├── TemplateForm.tsx       # Template creation/editing form
│   │   ├── TemplateCategoryBadge.tsx # Category badge component
│   │   ├── TemplatePreviewImage.tsx # Preview image uploader/generator
│   │   └── TemplateLanguageSelector.tsx # Multi-language content editor
│   └── insights/
│       └── InsightSaveAsTemplateModal.tsx # Modal for saving insight as template
├── stores/
│   └── template-store.ts          # Client state for template operations
└── lib/
    └── trpc/
        └── router.ts              # Import templates router

packages/database/src/schema/
├── templates.ts                   # Template table schema
├── template-content.ts            # Multi-language template content
├── template-categories.ts         # Template categories
└── template-usage.ts              # Template usage tracking

packages/api/src/router/
└── templates.ts                   # tRPC router for template operations
```

## Technical Architecture

### Frontend (TanStack Start + Mantine v9)

**Template Library Page** (`/templates`):
- Component-based grid layout using `SimpleGrid` from Mantine v9
- Client-side filtering and search with reactive state management
- Lazy loading for template cards to improve initial page load
- Infinite scroll or pagination for large template libraries

**Template Detail Page** (`/templates/$templateId`):
- Route-based data fetching with TanStack Start's `loader` function
- tRPC query for template metadata and configuration
- Preview modal with lazy-loaded sample data
- Action buttons for "Use Template", "Clone", "Edit", "Delete"

**Template Creation/Editing** (`/templates/create`, `/templates/$templateId/edit`):
- Multi-step form using Mantine v9's `Stepper` component
- Form validation with Zod schemas integrated via `@tanstack/react-form` or Mantine's form integration
- Real-time preview updates as user modifies configuration
- Image upload with drag-and-drop support using `@mantine/dropzone`

**Template Preview Modal**:
- Modal component with tabbed interface (Summary, Metrics, AI Insights, Schedule)
- Mock data generator for preview rendering
- Responsive design with mobile support
- "Use This Template" and "Close Preview" actions

### Backend (tRPC v11 + Drizzle ORM)

**tRPC Router Procedures**:
- `templates.list` - Query all templates with filtering by category
- `templates.byId` - Query single template by ID with full configuration
- `templates.create` - Create new template from insight configuration
- `templates.update` - Update template metadata and configuration
- `templates.delete` - Delete template by ID
- `templates.clone` - Clone template with new name and ownership
- `templates.use` - Record template usage and return configuration for insight creation
- `templates.categories.list` - Query all available categories
- `templates.search` - Full-text search across templates

**Database Schema (Drizzle ORM)**:

```typescript
// Template table
export const templates = pgTable('templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => companies.id),
  ownerId: uuid('owner_id').notNull().references(() => users.id),
  previewImageUrl: text('preview_image_url'),
  isSystemTemplate: boolean('is_system_template').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Template content (multi-language)
export const templateContent = pgTable('template_content', {
  id: uuid('id').primaryKey().defaultRandom(),
  templateId: uuid('template_id').notNull().references(() => templates.id),
  language: text('language').notNull(), // 'en', 'ar', etc.
  title: text('title').notNull(),
  description: text('description').notNull(),
});

// Template configuration (stored as JSONB)
export const templateConfigurations = pgTable('template_configurations', {
  id: uuid('id').primaryKey().defaultRandom(),
  templateId: uuid('template_id').notNull().references(() => templates.id),
  connectors: jsonb('connectors').notNull().$type<ConnectorConfig[]>(),
  metrics: jsonb('metrics').notNull().$type<MetricConfig[]>(),
  aiSettings: jsonb('ai_settings').notNull().$type<AISettings>(),
  schedule: jsonb('schedule').$type<ScheduleConfig>(),
  deliverySettings: jsonb('delivery_settings').$type<DeliveryConfig>(),
});

// Template categories
export const templateCategories = pgTable('template_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  nameAr: text('name_ar'), // Arabic name for RTL support
  icon: text('icon'), // Icon identifier
  description: text('description'),
});

// Template-category associations (many-to-many)
export const templateCategoryAssociations = pgTable('template_category_associations', {
  templateId: uuid('template_id').notNull().references(() => templates.id),
  categoryId: uuid('category_id').notNull().references(() => templateCategories.id),
  primaryKey: ({ templateId, categoryId }) => ({ columns: [templateId, categoryId] }),
});

// Template usage tracking
export const templateUsage = pgTable('template_usage', {
  id: uuid('id').primaryKey().defaultRandom(),
  templateId: uuid('template_id').notNull().references(() => templates.id),
  userId: uuid('user_id').notNull().references(() => users.id),
  insightId: uuid('insight_id').references(() => insights.id),
  usedAt: timestamp('used_at').defaultNow(),
});
```

### State Management (TanStack Store)

```typescript
// apps/frontend/src/stores/template-store.ts
import { createStore } from '@tanstack/react-store'

interface TemplateStore {
  selectedCategory: string | null
  searchQuery: string
  templates: Template[]
  isLoading: boolean
}

export const templateStore = createStore<TemplateStore>({
  selectedCategory: null,
  searchQuery: '',
  templates: [],
  isLoading: false,
})
```

### Multi-Language Support

**Language Detection**:
- Use existing `i18n` store from Phase 00 for current language
- Template content queries filter by current language with fallback to English
- RTL layout switching via existing `DirectionProvider`

**Content Fallback Strategy**:
1. Query template content for current language
2. If no content exists, fallback to English
3. If English doesn't exist, show placeholder "Translation not available"

### Component Architecture (Mantine v9)

**TemplateCard**:
- `Card` component with `hover` variant for lift animation
- `Image` component for preview thumbnail
- `Badge` components for category tags
- `Text` components for title/description with line clamping
- `ActionIcon` or `Button` for "View Details" on hover

**TemplateFilterBar**:
- `TextInput` with `Search` icon for search
- `ChipGroup` or `SegmentedControl` for category filtering
- `Button` variant="light" for "Clear Filters"

**TemplatePreview**:
- `Modal` component with full-screen on mobile
- `Tabs` component for different preview views
- `Stack` layout for preview content
- `Group` for action buttons at bottom

**TemplateForm**:
- `Stepper` component for multi-step form
- `TextInput` for name, description
- `MultiSelect` for category selection
- `FileInput` or `Dropzone` for preview image upload
- `Textarea` for description (per language)
- `JsonInput` (read-only) for configuration summary

### Performance Optimization

**Code Splitting**:
- Route-based splitting automatic with TanStack Start
- Lazy load preview modal component
- Lazy load template creation form

**Data Fetching**:
- Use TanStack Start's `loader` for template list (pre-fetch on navigation)
- Implement stale-while-revalidate for template detail pages
- Cache template list for 5 minutes (revalidation on focus)

**Image Optimization**:
- Use TanStack Start image optimization for preview thumbnails
- Convert uploaded images to WebP format
- Generate multiple sizes (thumbnail, medium, large)
- Lazy load images below the fold

**Bundle Size Targets**:
- Template library page: <200KB initial bundle
- Template detail page: <150KB initial bundle
- Preview modal: <100KB lazy-loaded chunk

### Accessibility (WCAG 2.1 AA)

**Keyboard Navigation**:
- Tab order: Search → Category filters → Template cards → Action buttons
- Enter/Space to activate template cards
- Escape to close preview modal
- Arrow keys for category filter navigation

**Screen Reader Support**:
- ARIA labels for all interactive elements
- Live regions for search/filter results updates
- ARIA describedby for template card content
- Role="dialog" for preview modal with focus trap

**Color Contrast**:
- All text meets 4.5:1 contrast ratio (WCAG AA)
- Template card badges use high-contrast colors
- Focus indicators visible on all interactive elements

**RTL Layout**:
- Logical properties (`margin-inline-start` vs `margin-left`)
- Automatic mirroring via Mantine's `dir` prop
- Test with Arabic language throughout

### Testing Strategy

**Unit Tests (Vitest)**:
- Component rendering for all template components
- Form validation logic for template creation/editing
- Filter and search logic for template library
- Language fallback logic for multi-language content
- Mock tRPC queries using vi.mock()

**Integration Tests**:
- Template CRUD operations via tRPC procedures
- Template usage tracking end-to-end
- Multi-language content queries with fallbacks
- Template cloning and ownership transfer

**E2E Tests (Playwright)**:
- Browse template library with filters and search
- Create template from existing insight
- Use template to create new insight
- Clone template and modify
- Preview template and use it
- Delete template with confirmation
- Switch languages and verify content updates

**Test Coverage Targets**:
- Overall: 70%+
- Business logic (template CRUD): 80%+
- Components: 70%+
- tRPC procedures: 75%+

### Deployment Considerations

**Database Migrations**:
- Create tables for templates, template content, categories, usage tracking
- Seed initial template categories (Marketing, Finance, Operations, SEO, Social, Local)
- Seed sample system templates for demonstration
- Create indexes for search performance (title, description)

**Feature Flags**:
- `templates.enabled` - Master toggle for template functionality
- `templates.allowUserCreation` - Allow non-admin users to create templates
- `templates.previewEnabled` - Enable template preview functionality
- `templates.multiLanguage` - Enable multi-language template content

**Monitoring**:
- Track template creation rate
- Track template usage frequency
- Monitor template preview load times
- Alert on template CRUD operation failures

### Security Considerations

**Tenant Isolation**:
- All template queries scoped by `tenantId` from async context
- Row-level security on template tables
- Users can only view/edit their tenant's templates

**Ownership**:
- Templates track `ownerId` to manage edit/delete permissions
- Only template owners can edit/delete their templates
- System templates (isSystemTemplate=true) cannot be deleted

**Input Validation**:
- Zod schemas validate all template inputs
- Sanitize HTML in template descriptions to prevent XSS
- Validate image uploads (file type, size limits)
- Prevent template name duplication within tenant

**Rate Limiting**:
- Limit template creation to 10 per hour per user
- Limit template usage tracking to prevent abuse
- Cache template list queries to reduce database load

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| Multi-language template content | Platform supports Arabic and English; templates must be accessible to all users | Single-language templates would exclude Arabic users from discovering templates |
| JSONB columns for template configuration | Template configuration is complex nested data that doesn't fit relational model | Normalizing configuration into 20+ tables would make queries extremely complex and slow |
| Preview modal with mock data | Users need to see what templates produce before using them | Without preview, users must create insights to test templates, which is inefficient |
| Template categories as separate table | Categories are reusable across templates and need multilingual names | Hardcoded categories would prevent extensibility and Arabic translations |
| Template usage tracking table | Enables "recently used" features and future popularity ranking | Inferred usage from insights would miss deleted insights and skew data |

## Dependencies

### Internal Dependencies
- **Phase 00 (Foundation)**: Mantine v9 components, TanStack Start routing, i18n setup, RTL support
- **Phase 01 (Authentication)**: User authentication for template ownership and permissions
- **Phase 02 (Scaffold)**: Dashboard layout, sidebar navigation, topbar
- **Phase 04 (Insights)**: Insight creation wizard (for "Save as Template"), insight configuration models
- **Existing tRPC API**: Base router setup, tenant context propagation, authentication procedures

### External Dependencies
- **@mantine/core**: v9+ for UI components
- **@mantine/dropzone**: For preview image upload
- **@tanstack/react-form**: Form validation (or use Mantine's form integration)
- **@tanstack/react-query**: Data fetching and caching
- **zod**: Schema validation
- **recharts**: Chart components for template preview
- **@tanstack/start**: File-based routing and data loaders

### API Dependencies
- **Database**: PostgreSQL 16+ with JSONB support
- **ORM**: Drizzle ORM for schema and migrations
- **Cache**: Redis for template list caching
- **Storage**: S3 or similar for preview image storage

## Implementation Phases

### Phase 1: Foundation (Setup)
- Create database schema and migrations
- Setup tRPC router with CRUD procedures
- Create base React components (TemplateCard, TemplateGrid, TemplateFilterBar)
- Implement template library page with static data

### Phase 2: Core Functionality
- Implement template creation from insight
- Implement template detail page
- Implement category filtering and search
- Add template usage tracking
- Implement "Use Template" flow with insight creation pre-filling

### Phase 3: Advanced Features
- Implement template preview modal
- Implement template cloning
- Implement template editing and deletion
- Add multi-language template content support
- Implement template ownership and permissions

### Phase 4: Polish & Hardening
- Add loading states and error handling
- Implement accessibility features (keyboard nav, screen readers)
- Add RTL testing and fixes
- Optimize performance (code splitting, lazy loading)
- Write comprehensive tests (unit, integration, E2E)
- Add feature flags for gradual rollout

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Template configuration complexity grows unbounded | High | Use Zod schemas to validate configuration; limit supported connector/metric combinations |
| Preview modal performance degrades with complex templates | Medium | Lazy load preview data; use virtualization for large metric lists; implement loading skeletons |
| Multi-language template content management becomes burdensome | Low | Start with English/Arabic; add language detection and fallbacks; consider translation service integration in future |
| Users create duplicate templates cluttering the library | Medium | Implement duplicate detection on template creation; add "similar templates" suggestions; provide template merging |
| Template preview images consume too much storage | Low | Enforce size limits; convert to WebP; implement CDN; auto-generate preview from configuration if no image provided |

## Success Metrics

- **Performance**: Template library page loads in <3s on 3G connection
- **Usage**: 70% of insights created from templates (vs. from scratch) within 30 days of launch
- **Satisfaction**: 80% of users report templates accelerate their workflow (survey)
- **Quality**: 70%+ test coverage for template-related code
- **Accessibility**: Zero WCAG 2.1 AA violations on template pages
- **Reliability**: 99.9% uptime for template CRUD operations

## Rollback Plan

If critical issues are discovered post-launch:

1. **Feature Flags**: Disable template functionality via `templates.enabled` flag
2. **Graceful Degradation**: Hide "Templates" navigation item; existing templates remain in database
3. **Data Preservation**: Do not delete template data during rollback
4. **User Communication**: Notify users if templates are temporarily unavailable
5. **Recovery**: Fix issues and re-enable feature flags without data loss
