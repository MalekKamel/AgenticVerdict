# Template Entity

**Version:** 1.0
**Last Updated:** 2026-04-13
**Status:** Active
**Related Specs:**

- [Business Architecture](/docs/architecture/business/business-architecture.md#appendix-a-insight-templates)
- [Core Platform: Insights](/specs/00-core/03-insights/README.md)

---

## Overview

**Templates** are pre-built configurations that accelerate insight creation while preserving full customization. Templates provide starting points for common business intelligence scenarios — from marketing dashboards to financial health reports — with all properties remaining editable after initialization. The platform includes both **system templates** (maintained by AgenticVerdict) and **tenant templates** (customized by agencies or businesses).

**Key Concept:** Templates are **initialization helpers, not rigid blueprints**. Every template property can be overridden after insight creation, enabling rapid setup without sacrificing flexibility.

---

## Purpose

### User Goals

- **Business Users:** Quickly create insights without configuring from scratch
- **Marketing Managers:** Start with proven marketing analysis configurations
- **Agency Partners:** Maintain client-specific template libraries
- **Platform Operators:** Provide industry-standard best practices

### Business Functions

- Rapid insight creation (70%+ target usage from templates)
- Best practice sharing across tenants
- Agency partner white-labeling
- Domain-specific starting points
- Reduced onboarding friction

---

## Properties

### Core Properties

| Property      | Type     | Validation              | Display Format                         | Description                       |
| ------------- | -------- | ----------------------- | -------------------------------------- | --------------------------------- |
| `templateId`  | UUID     | Required, unique        | `tpl-abc-123`                          | Unique template identifier        |
| `tenantId`    | UUID     | Optional, foreign key   | Tenant ID                              | Owner (null = system template)    |
| `name`        | String   | Required, min 2 chars   | Text input                             | Template display name             |
| `description` | String   | Required, max 500 chars | Textarea                               | Template description and use case |
| `domain`      | Enum     | Required                | Dropdown                               | Primary business domain           |
| `category`    | Enum     | Required                | "Performance" / "Health" / "Executive" | Template category                 |
| `type`        | Enum     | Required                | "System" / "Tenant"                    | Template ownership                |
| `status`      | Enum     | Required                | Badge                                  | Template status                   |
| `icon`        | String   | Optional, icon name     | Icon picker                            | Template icon (for UI)            |
| `tags`        | Array    | Optional                | Tag input                              | Searchable tags                   |
| `isFeatured`  | Boolean  | Optional                | Toggle                                 | Featured in template gallery      |
| `createdAt`   | DateTime | Auto-generated          | "2026-04-13"                           | Template creation timestamp       |
| `updatedAt`   | DateTime | Auto-updated            | "2026-04-13 14:30"                     | Last modification timestamp       |

### Template Configuration (Inherited by Insights)

| Property                  | Type   | Validation      | Display Format        | Description                    |
| ------------------------- | ------ | --------------- | --------------------- | ------------------------------ |
| `config.connectors`       | Array  | Required, min 1 | Connector selector    | Recommended connectors         |
| `config.connectorMetrics` | Object | Required        | Metric selector       | Default metrics per connector  |
| `config.dateRange`        | Object | Required        | Date range picker     | Default date range             |
| `config.ai`               | Object | Required        | AI settings           | Default AI configuration       |
| `config.schedule`         | Object | Required        | Schedule settings     | Default schedule               |
| `config.delivery`         | Object | Required        | Delivery settings     | Default delivery configuration |
| `config.localization`     | Object | Required        | Localization settings | Default language/currency      |

### Template Metadata

| Property                        | Type     | Validation           | Display Format                           | Description                              |
| ------------------------------- | -------- | -------------------- | ---------------------------------------- | ---------------------------------------- |
| `metadata.useCount`             | Number   | Auto-incremented     | Counter                                  | Number of insights created from template |
| `metadata.avgRating`            | Number   | 1-5, auto-calculated | Star rating                              | Average user rating                      |
| `metadata.lastUsedAt`           | DateTime | Auto-updated         | "2026-04-13"                             | Last time template used                  |
| `metadata.applicableIndustries` | Array    | Optional             | Industry tags                            | Industries this template fits            |
| `metadata.skillLevel`           | Enum     | Optional             | "Beginner" / "Intermediate" / "Advanced" | Required expertise level                 |

### Customization Properties

| Property                              | Type   | Validation | Display Format  | Description                             |
| ------------------------------------- | ------ | ---------- | --------------- | --------------------------------------- |
| `customization.lockedFields`          | Array  | Optional   | Checkbox group  | Fields users cannot modify              |
| `customization.hiddenFields`          | Array  | Optional   | Checkbox group  | Fields hidden from users                |
| `customization.defaultValueOverrides` | Object | Optional   | JSON editor     | Per-tenant default values               |
| `customization.branding`              | Object | Optional   | Branding config | White-label branding (agency templates) |

---

## Template Types

### System Templates

Maintained by AgenticVerdict, available to all tenants:

| Template                    | Domain                | Description                                       | Key Connectors          |
| --------------------------- | --------------------- | ------------------------------------------------- | ----------------------- |
| **Marketing Insight**       | Marketing             | Track campaign performance across platforms       | GA4, Meta, TikTok       |
| **SEO Performance Insight** | SEO                   | Analyze search visibility and keyword performance | GA4, GSC                |
| **Social Media Insight**    | Social Media          | Evaluate engagement and reach                     | Meta, TikTok            |
| **Local Marketing Insight** | Local                 | Monitor GBP performance and local visibility      | GBP, GA4                |
| **Finance Insight**         | Finance               | Monitor financial health and metrics              | QuickBooks, Stripe, GA4 |
| **Executive Summary**       | All                   | Cross-domain strategic overview                   | All enabled connectors  |
| **E-Commerce Performance**  | Marketing, Operations | Track online store performance                    | GA4, Meta               |
| **Lead Generation Insight** | Marketing             | Measure lead quality and conversion               | Meta, GA4, GBP          |

### Tenant Templates

Custom templates created by agencies or businesses:

| Use Case                   | Description                             | Example                                |
| -------------------------- | --------------------------------------- | -------------------------------------- |
| **Agency Client Template** | White-label template for agency clients | "Agency X - Marketing Overview"        |
| **Industry-Specific**      | Tailored for specific industry          | "Restaurant Performance - Local Focus" |
| **Role-Based**             | Configured for specific user role       | "C-Suite Executive Dashboard"          |
| **Custom Domain**          | Unique business domain combination      | "Marketing + Operations Combined"      |

---

## Template Inheritance

### Initialization Flow

```
1. User selects template
2. System copies template.config to insight
3. User modifies any/all properties
4. Insight saved with customized config
5. Template remains unchanged
```

### Property Override Rules

| Property Type           | Template Behavior     | Insight Behavior         |
| ----------------------- | --------------------- | ------------------------ |
| **Required Properties** | Must provide defaults | Can override             |
| **Optional Properties** | Can provide defaults  | Can override or omit     |
| **Locked Fields**       | Mark as locked        | Cannot modify (enforced) |
| **Hidden Fields**       | Mark as hidden        | Not shown in UI          |
| **Computed Fields**     | Provide formula       | Auto-calculated          |

### Template Versioning

| Version Strategy           | Description                                       |
| -------------------------- | ------------------------------------------------- |
| **Semantic Versioning**    | Major.Minor.Patch (e.g., 1.2.0)                   |
| **Backward Compatibility** | Minor/patch updates don't break existing insights |
| **Migration Scripts**      | Major updates include data migration              |
| **Rollback Support**       | Can revert to previous template version           |

---

## Relationships

### Parent Relationships

| Parent Entity | Relationship Type | Cardinality | Description                                                               |
| ------------- | ----------------- | ----------- | ------------------------------------------------------------------------- |
| **Tenant**    | Composition       | Many-to-One | Tenant templates belong to one tenant (system templates have null tenant) |

### Child Relationships

| Child Entity | Relationship Type | Cardinality | Description                                        |
| ------------ | ----------------- | ----------- | -------------------------------------------------- |
| **Insights** | Association       | 0-N         | Multiple insights can be created from one template |

### Reference Relationships

| Entity                           | Relationship Type | Description                                   |
| -------------------------------- | ----------------- | --------------------------------------------- |
| **Templates** (same domain)      | Peer              | Multiple templates per business domain        |
| **Templates** (system vs tenant) | Peer              | System templates vs tenant-specific templates |
| **Connectors**                   | Association       | Templates reference recommended connectors    |

---

## Lifecycle States

### Template States

| State          | Description                      | UI Representation              | Business Rules                                    |
| -------------- | -------------------------------- | ------------------------------ | ------------------------------------------------- |
| **DRAFT**      | Template under development       | Badge: "Draft" (gray)          | Not visible in gallery                            |
| **ACTIVE**     | Available for use                | Badge: "Active" (green)        | Visible in gallery, can create insights           |
| **DEPRECATED** | Still available, not recommended | Badge: "Deprecated" (yellow)   | Existing insights unaffected, discourage new use  |
| **ARCHIVED**   | Not available for new insights   | Badge: "Archived" (light gray) | Existing insights unaffected, hidden from gallery |
| **DELETED**    | Soft delete, pending purge       | Hidden                         | Admin can purge after retention                   |

### State Transitions

```
DRAFT → ACTIVE (template published)
ACTIVE → DEPRECATED (replaced by newer version)
DEPRECATED → ARCHIVED (no longer used)
ARCHIVED → DELETED (soft delete)
ANY → DELETED (soft delete)
```

---

## Actions

### CRUD Operations

#### Create Template

- **Permission:** Platform admins (system), tenant admins (tenant templates)
- **Input:** Template configuration, name, domain, description
- **Validation:** At least 1 connector, valid configuration
- **Output:** Template in DRAFT state
- **Next Action:** Publish to make available

#### Read Template

- **Permission:** All users (active templates)
- **Input:** Template ID
- **Output:** Full template configuration with metadata
- **Caching:** Cache template configs for 15 minutes

#### Update Template

- **Permission:** Template owner (tenant), platform admins (system)
- **Input:** Partial update of properties
- **Validation:** Maintain valid configuration
- **Output:** Updated template configuration
- **Side Effects:** Existing insights **not** affected (templates are initialization-only)

#### Delete Template

- **Permission:** Template owner, platform admins
- **Input:** Template ID
- **Validation:** No critical dependencies
- **Output:** Confirmation
- **Side Effects:** Soft delete, existing insights unaffected

### Template Actions

#### Publish

- **Permission:** Template owner
- **Input:** Template ID
- **Validation:** Configuration complete, required fields filled
- **Output:** Template in ACTIVE state
- **Side Effects:** Visible in template gallery

#### Deprecate

- **Permission:** Template owner
- **Input:** Template ID, replacement template ID
- **Output:** Template in DEPRECATED state
- **Side Effects:** Show replacement recommendation in UI

#### Create Insight from Template

- **Permission:** Tenant users
- **Input:** Template ID, insight name
- **Validation:** Template in ACTIVE state
- **Output:** Insight in DRAFT state with template config
- **Next Action:** User customizes and activates insight

#### Duplicate Template

- **Permission:** Template owner
- **Input:** Template ID
- **Output:** New template (tenant-scoped)
- **Side Effects:** Create copy as tenant template

#### Rate Template

- **Permission:** Tenant users
- **Input:** Template ID, rating (1-5)
- **Validation:** Rating within range
- **Output:** Updated rating metadata
- **Side Effects:** Recalculate average rating

---

## Template Categories

### By Domain

| Domain             | Templates             | Use Cases                                                |
| ------------------ | --------------------- | -------------------------------------------------------- |
| **Marketing**      | 3+ templates          | Campaign performance, ROI analysis, lead generation      |
| **SEO**            | 2+ templates          | Search visibility, keyword performance, technical SEO    |
| **Social Media**   | 2+ templates          | Engagement analysis, reach tracking, content performance |
| **Local Business** | 1+ templates          | GBP performance, local visibility, review monitoring     |
| **Finance**        | 1+ templates          | Revenue tracking, expense monitoring, profit analysis    |
| **Operations**     | 1+ template (planned) | KPI tracking, performance monitoring                     |

### By Skill Level

| Level            | Description                                                      | Target Audience             |
| ---------------- | ---------------------------------------------------------------- | --------------------------- |
| **Beginner**     | Pre-configured with smart defaults, minimal customization needed | New users, small businesses |
| **Intermediate** | Balanced defaults with customization options                     | Experienced users           |
| **Advanced**     | Minimal defaults, full customization required                    | Power users, analysts       |

### By Category

| Category        | Description                            | Example Templates                    |
| --------------- | -------------------------------------- | ------------------------------------ |
| **Performance** | Track and optimize performance metrics | Marketing Insight, SEO Performance   |
| **Health**      | Monitor overall business health        | Finance Insight, Executive Summary   |
| **Executive**   | High-level strategic overview          | Executive Summary, C-Suite Dashboard |
| **Operational** | Day-to-day operational metrics         | Operations Insight (planned)         |

---

## Accessibility Requirements

### WCAG 2.1 Compliance

#### Template Gallery

- **Template Cards:** Keyboard navigation, clear focus indicators
- **Category Filtering:** Accessible dropdowns with clear labels
- **Search:** Accessible search input with autocomplete
- **Preview:** Modal dialog with proper focus management

#### Template Selection

- **Template Details:** Clear descriptions, use case explanations
- **Connector Requirements:** List required connectors upfront
- **Skill Level:** Indicate complexity level clearly
- **Preview:** Show sample output before selection

#### Template Creation (Admin)

- **Multi-Step Forms:** Clear progress indicators
- **Configuration Builder:** Accessible form controls
- **Preview Mode:** Preview template before publishing
- **Validation Feedback:** Clear error messages with fixes

### Error Recovery

- **Clear Error Messages:** Specific template error descriptions
- **Validation Feedback:** Inline errors with suggested corrections
- **Undo Actions:** Allow reverting template changes
- **Confirmation Dialogs:** Destructive actions require confirmation

---

## Internationalization

### Translation Keys

```json
{
  "template.type.system": "System Template",
  "template.type.tenant": "Custom Template",
  "template.status.draft": "Draft",
  "template.status.active": "Active",
  "template.status.deprecated": "Deprecated",
  "template.domain.marketing": "Marketing",
  "template.domain.seo": "SEO",
  "template.domain.social": "Social Media",
  "template.category.performance": "Performance Tracking",
  "template.category.health": "Health Monitoring",
  "template.category.executive": "Executive Overview",
  "template.skillLevel.beginner": "Beginner",
  "template.skillLevel.intermediate": "Intermediate",
  "template.skillLevel.advanced": "Advanced",
  "template.action.createFrom": "Create from Template",
  "template.action.preview": "Preview Template",
  "template.action.duplicate": "Duplicate Template",
  "template.metadata.useCount": "Used {count} times",
  "template.metadata.avgRating": "Average: {rating}/5"
}
```

### RTL/LTR Considerations

#### Template Gallery

- **Card Layout:** Cards mirror layout in RTL
- **Category Filters:** Filters align right in RTL
- **Search Input:** Search aligns right in RTL
- **Action Buttons:** Buttons align left in RTL

#### Template Details Modal

- **Modal Layout:** Content mirrors in RTL
- **Descriptions:** Text aligns right in Arabic
- **Bullet Points:** Bullets align right in RTL
- **Preview Images:** Maintain original orientation

#### Template Creation Form

- **Form Layout:** Labels above inputs (works for both directions)
- **Multi-Column Layouts:** Columns reverse order in RTL
- **Help Text:** Aligns right below inputs in RTL

---

## Related Components/Pages

### Template Management Pages

| Page                 | Route                 | Description                    | Key Components                 |
| -------------------- | --------------------- | ------------------------------ | ------------------------------ |
| **Template Gallery** | `/templates`          | Browse available templates     | TemplateGrid, TemplateCard     |
| **Template Detail**  | `/templates/:id`      | View template details          | TemplatePreview, ConnectorList |
| **Create Template**  | `/templates/new`      | Create custom template (admin) | TemplateBuilder                |
| **Edit Template**    | `/templates/:id/edit` | Edit template (admin)          | TemplateBuilder                |

### Components

| Component            | Description                     | Props                        |
| -------------------- | ------------------------------- | ---------------------------- |
| **TemplateCard**     | Card displaying template info   | `template`, `onSelect`       |
| **TemplateGrid**     | Grid of template cards          | `templates`, `domainFilter`  |
| **TemplatePreview**  | Preview template configuration  | `template`, `onCreate`       |
| **TemplateBuilder**  | Multi-step template creation    | `template`, `onSave`         |
| **TemplateSelector** | Dropdown for template selection | `templates`, `onSelect`      |
| **DomainFilter**     | Filter templates by domain      | `selectedDomain`, `onFilter` |
| **SkillLevelBadge**  | Display skill level             | `level`                      |
| **RatingStars**      | Display/submit ratings          | `rating`, `onRate`           |

### Cross-References

- **[Insights](./insights-reports.md)** — Insights created from templates
- **[Connectors](./connectors.md)** — Templates reference connectors
- **[Tenant/Company](./tenant-company.md)** — Tenant templates scoped to company

---

## Usage Examples

### Template Card Component

```typescript
function TemplateCard({ template }: { template: Template }) {
  const createInsight = trpc.insights.createFromTemplate.useMutation()

  return (
    <Card>
      <Group position="apart">
        <Group>
          <TemplateIcon domain={template.domain} />
          <div>
            <Text weight={500}>{template.name}</Text>
            <Badge>{template.domain}</Badge>
          </div>
        </Group>
        {template.isFeatured && <Badge color="yellow">Featured</Badge>}
      </Group>

      <Text size="sm">{template.description}</Text>

      <Group>
        <Text size="xs">Connectors: {template.config.connectors.length}</Text>
        <Text size="xs">Skill: {template.metadata.skillLevel}</Text>
      </Group>

      {template.metadata.avgRating && (
        <RatingStars value={template.metadata.avgRating} readonly />
      )}

      <Button
        onClick={() => createInsight.mutate({
          templateId: template.templateId,
          name: `New ${template.name}`
        })}
      >
        Use Template
      </Button>
    </Card>
  )
}
```

### Template Creation Flow (Admin)

```typescript
function TemplateBuilder() {
  const [step, setStep] = useState(1)
  const [config, setConfig] = useState<Partial<TemplateConfig>>({})

  const handlePublish = async () => {
    const template = await trpc.templates.create.mutate(config)
    await trpc.templates.publish.mutate({ templateId: template.templateId })
    navigate(`/templates/${template.templateId}`)
  }

  return (
    <Stepper active={step}>
      <Step label="Basic Info" />
      <Step label="Connectors" />
      <Step label="AI Settings" />
      <Step label="Schedule & Delivery" />
      <Step label="Review & Publish" />

      {step === 1 && <BasicInfoForm config={config} onChange={setConfig} />}
      {step === 2 && <ConnectorSelector config={config} onChange={setConfig} />}
      {step === 3 && <AIConfigForm config={config} onChange={setConfig} />}
      {step === 4 && <ScheduleDeliveryForm config={config} onChange={setConfig} />}
      {step === 5 && <ReviewTemplate config={config} onPublish={handlePublish} />}
    </Stepper>
  )
}
```

### Template-Based Insight Creation

```typescript
function CreateInsightFromTemplate({ templateId }: { templateId: string }) {
  const { data: template } = trpc.templates.get.useQuery(templateId)
  const createInsight = trpc.insights.create.useMutation()

  const handleCreate = async (customizations: Partial<InsightConfig>) => {
    // Template provides defaults, user provides overrides
    const insight = await createInsight.mutateAsync({
      templateId,
      ...customizations
    })
    navigate(`/insights/${insight.insightId}/edit`)
  }

  return (
    <Wizard>
      <TemplatePreview template={template} />
      <CustomizationForm
        defaults={template.config}
        onSubmit={handleCreate}
      />
    </Wizard>
  )
}
```

---

## Data Model

### Database Schema (Drizzle ORM)

```typescript
export const templates = pgTable("templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => companies.id), // Null for system templates
  name: text("name").notNull(),
  description: text("description").notNull(),
  domain: domainEnum("domain").notNull(),
  category: templateCategoryEnum("category").notNull(),
  type: templateTypeEnum("type").notNull().default("tenant"),
  status: templateStatusEnum("status").notNull().default("draft"),
  icon: text("icon"),
  tags: text("tags").array(),
  isFeatured: boolean("is_featured").notNull().default(false),

  // Template configuration (inherited by insights)
  config: jsonb("config").$type<TemplateConfig>().notNull(),

  // Customization rules
  customization: jsonb("customization").$type<TemplateCustomization>(),

  // Metadata
  useCount: integer("use_count").notNull().default(0),
  avgRating: numeric("avg_rating"),
  lastUsedAt: timestamp("last_used_at"),
  applicableIndustries: text("applicable_industries").array(),
  skillLevel: skillLevelEnum("skill_level"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
```

---

## Testing Requirements

### Unit Tests

- Template validation logic
- Configuration inheritance
- Property override rules
- Metadata calculation (ratings, use counts)

### Integration Tests

- Template-based insight creation
- Template versioning and migration
- Multi-tenant template isolation
- System template availability

### E2E Tests

- Template gallery browsing
- Template selection and insight creation
- Template creation workflow (admin)
- Template rating and feedback

---

## Maintenance

**Document Version:** 1.0
**Last Updated:** 2026-04-13
**Status:** Active
**Next Review:** After Phase 2 completion
**Maintainer:** Product Team
