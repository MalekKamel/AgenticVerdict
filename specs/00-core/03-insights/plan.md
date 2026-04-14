# Implementation Plan: Core Platform - Insights (Report Generation & Delivery)

**Phase**: 03 - Core Platform: Insights  
**Status**: Completed (Retrospective Documentation)  
**Created**: 2026-04-14  
**Implementation Period**: Weeks 9-11 (Original) → Extended timeline  
**Specification**: `spec.md`  

## Document Overview

This implementation plan documents the **actual technical implementation** of the Phase 03 report generation and delivery system. It serves as retrospective documentation of the architecture, technology choices, and implementation patterns used in the completed `@agenticverdict/report-generator` package.

**Purpose**: Provide technical reference for the implemented system, guiding future enhancements and Phase 04 production hardening.

## Constitution Check

### Architectural Alignment

- ✅ **Multi-tenancy**: Report generation scoped by tenant ID with row-level security
- ✅ **Configuration-driven**: Template selection and formatting driven by company configuration
- ✅ **Plugin architecture**: Format generators implement common interface, extensible for new formats
- ✅ **Template-based**: No hardcoded report layouts, all structure defined in templates
- ✅ **Internationalization**: Full RTL/LTR support with locale-aware formatting

### Technology Stack Alignment

- ✅ **Battle-tested tools**: Playwright (PDF), ExcelJS (Excel), docx (DOCX) - all production-proven
- ✅ **Type safety**: TypeScript 5.3+ with Zod validation, zero `any` types
- ✅ **Testing**: Vitest with 70%+ coverage, snapshot tests for templates
- ✅ **Database**: PostgreSQL with Drizzle ORM for report metadata
- ✅ **Background jobs**: BullMQ integration ready (deferred to Phase 04)

## Technical Context

### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Report Generation Flow                      │
└─────────────────────────────────────────────────────────────────┘

   Phase 02 Agent Output        Template Engine           Format Plugins
   (MarketingVerdict)           (Composite)                (Registry)
         │                           │                          │
         │ 1. Map to Report Model    │                          │
         ├──────────────────────────>│                          │
         │                           │                          │
         │                           │ 2. Render Template       │
         │                           │ (Built-in or Override)   │
         │                           ├──────────────────────────>│
         │                           │                          │
         │                           │                          │ 3. Generate Format
         │                           │                          │ (PDF/HTML/DOCX/Excel)
         │                           │                          │
         │                           │ 4. Return Bytes          │
         │                           │<──────────────────────────┤
         │                           │                          │
         │ 5. Store Metadata         │                          │
         │<──────────────────────────┤                          │
         │                           │                          │
         ▼                           ▼                          ▼
    Report Record              Rendered HTML           Formatted Output
    (Database)                 (String)                (Uint8Array)
```

### Component Architecture

#### Core Package: `@agenticverdict/report-generator`

**Purpose**: Centralized report generation infrastructure with plugin-based format generation

**Key Components**:

1. **Template Engine** (`src/composite-template-engine.ts`)
   - Resolves template source: database override → built-in template → fallback
   - Renders HTML from template with variable injection
   - Supports template versioning and schema validation

2. **Format Generator Registry** (`src/format-registry.ts`)
   - Plugin architecture for format generators
   - Supports stub generators for testing without Chromium
   - Environment-based generator selection (production vs. test)

3. **Base Report Generator** (`src/base-report-generator.ts`)
   - Orchestrates template rendering → format generation
   - Provides hooks for pre/post processing
   - Implements error handling and retry logic

4. **Format Plugins**
   - PDF: Playwright with Chromium (`src/pdf-playwright-generator.ts`)
   - HTML: Direct HTML output (`src/html-format-generator.ts`)
   - Excel: ExcelJS (`src/xlsx-format-generator.ts`)
   - DOCX: HTML-to-DOCX (`src/docx-format-generator.ts`)
   - JSON: Structured data export (`src/json-format-generator.ts`)

5. **Template System** (`src/templates/`)
   - Built-in templates: Executive Summary, Detailed Analysis, Technical Appendix
   - Template definition schema with Zod validation
   - View model with type coercion for safety

6. **Integration Layer** (`src/integration/`)
   - Phase 2 MarketingVerdict mapping to report model
   - HTML block generation for agent insights
   - Data transformation and validation

7. **Database Integration** (`src/storage/`)
   - Drizzle ORM helpers for report metadata
   - Tenant-scoped queries with row-level security
   - Status tracking and error logging

## Technology Stack

### Core Dependencies

#### Report Generation
- **Playwright** (v1.59+): PDF generation via Chromium headless browser
  - Rationale: Most accurate HTML-to-PDF rendering, supports complex CSS, handles RTL correctly
  - Alternative considered: Puppeteer (Playwright chosen for better API and cross-browser support)

- **ExcelJS** (v4.4+): Excel file creation and formatting
  - Rationale: Mature library, comprehensive formatting support, TypeScript-first
  - Alternative considered: xlsx (ExcelJS chosen for better styling and multi-sheet support)

- **docx** (v9.6+): DOCX generation from HTML
  - Rationale: Direct HTML-to-DOCX conversion, reasonable output quality
  - Alternative considered: html-docx-js (docx chosen for better maintenance)

- **node-html-parser** (v7.1+): HTML parsing for template processing
  - Rationale: Fast, lightweight, supports template manipulation
  - Alternative considered: jsdom (node-html-parser chosen for performance)

#### Template Engine
- **Composite Pattern**: Built-in templates + database overrides + fallback
  - Rationale: Balances customization (database) with version control (built-in)
  - Alternative considered: Database-only (composite chosen for deployment simplicity)

#### Validation
- **Zod** (v3.24+): Schema validation for templates and view models
  - Rationale: Runtime type safety, excellent TypeScript inference
  - Standard in AgenticVerdict stack

#### Database
- **Drizzle ORM** (v0.38+): Report metadata storage
  - Rationale: Type-safe queries, lightweight, excellent performance
  - Standard in AgenticVerdict stack

### Development Dependencies

- **Vitest** (v3.0+): Unit testing with snapshot support
- **TypeScript** (v5.7+): Type checking and compilation
- **Playwright Test**: E2E testing for PDF generation (optional)

### Infrastructure

- **Node.js** 20 LTS: Runtime environment
- **Docker**: Container deployment with Playwright Chromium
- **PostgreSQL** 16: Report metadata and template storage

## Implementation Phases

### Phase 1: Foundation (Week 1)

**Objective**: Set up report-generator package structure and core abstractions

**Completed Tasks**:
1. Package initialization with TypeScript configuration
2. Core type definitions: `ReportFormat`, `ReportGenerationContext`, `IFormatGenerator`, `ITemplateEngine`
3. Base report generator abstract class with orchestration logic
4. Format generator registry with plugin architecture
5. Template engine interface and composite implementation
6. Placeholder template engine for testing

**Key Decisions**:
- Plugin architecture for format generators enables future extensibility
- Composite template engine balances customization with version control
- Environment-based generator selection (stubs for testing, real generators for production)

### Phase 2: Format Plugins (Week 2)

**Objective**: Implement format generators for PDF, HTML, Excel, DOCX, and JSON

**Completed Tasks**:
1. **Playwright PDF Generator**
   - Chromium path resolution for Docker environments
   - HTML document preparation with print styles
   - Page headers, footers, and numbering
   - RTL layout support via CSS direction attributes
   - Memory optimization for large documents

2. **HTML Format Generator**
   - Direct HTML output with document shell
   - Responsive layout for web preview
   - Interactive elements (charts, tables)
   - Print stylesheet for PDF generation

3. **Excel Generator**
   - Multi-sheet workbook creation
   - Cell formatting (dates, currency, percentages)
   - Auto-column width and table styling
   - Data validation and error handling

4. **DOCX Generator**
   - HTML-to-DOCX conversion
   - Basic styling and layout preservation
   - Image embedding for charts and figures

5. **JSON Generator**
   - Structured data export for API consumers
   - Full report model serialization

**Key Decisions**:
- Playwright chosen over Puppeteer for better API and cross-browser support
- ExcelJS chosen for comprehensive formatting and multi-sheet support
- HTML-to-DOCX conversion prioritized over native DOCX generation for template reusability

### Phase 3: Template System (Week 3)

**Objective**: Implement built-in templates and template definition schema

**Completed Tasks**:
1. **Template Definition Schema**
   - Template kind enumeration (executive_summary, detailed_analysis, technical_appendix)
   - Version tracking for template structure changes
   - Metadata (title, description, estimated page range)
   - Zod validation for type safety

2. **Built-in Template Registry**
   - Template catalog for UI selection
   - Template factory for instantiation
   - Version management and compatibility

3. **View Model**
   - Report template view model with type coercion
   - Narrative sections, statistical summaries, verdict scorecards
   - Insight highlights, data tables, figures
   - Chart specifications and rendering

4. **Built-in Templates**
   - Executive Summary: High-level overview and recommendations
   - Detailed Analysis: Comprehensive metrics and insights
   - Technical Appendix: Methodology and data quality

5. **Document Shell**
   - Cover page with company branding
   - Table of contents with page numbers
   - Headers, footers, and page numbering
   - Section dividers and formatting

**Key Decisions**:
- Templates defined in code (not database) for version control and deployment simplicity
- Database override capability for tenant customization without code changes
- Template versioning enables migration paths for future updates

### Phase 4: Integration Layer (Week 4)

**Objective**: Integrate with Phase 02 agent outputs and database

**Completed Tasks**:
1. **Phase 2 Integration**
   - MarketingVerdict model mapping to report view model
   - Agent insight HTML block generation
   - Data transformation and validation
   - Error handling for missing or incomplete data

2. **Database Integration**
   - Drizzle schema for reports table
   - Tenant-scoped queries with row-level security
   - Status tracking (draft, generating, completed, failed)
   - Metadata storage (file size, page count, generation time)

3. **Internationalization**
   - Locale detection from company configuration
   - Text direction resolution (RTL/LTR)
   - Date, currency, and number formatting
   - CSS direction attributes for RTL languages

**Key Decisions**:
- Report model mapping separates agent concerns from presentation
- Tenant-scoped queries ensure multi-tenancy isolation
- Locale-aware formatting handled by i18n package, not report generator

### Phase 5: Testing and Documentation (Week 5)

**Objective**: Achieve 70%+ test coverage and document usage

**Completed Tasks**:
1. **Unit Tests**
   - Template engine tests with mocking
   - Format generator tests with stubs
   - View model coercion tests
   - Database integration tests

2. **Integration Tests**
   - End-to-end report generation tests
   - Template override tests
   - Multi-language rendering tests
   - Error handling and recovery tests

3. **Snapshot Tests**
   - Built-in template snapshots for regression detection
   - Format output comparison tests
   - Visual regression tests for PDF generation

4. **Documentation**
   - Package README with usage examples
   - Template creation guide
   - Format plugin development guide
   - API reference documentation

**Key Decisions**:
- Snapshot tests enable quick regression detection for template changes
- Stub format generators enable testing without Chromium in CI
- Documentation prioritizes usage over implementation details

## Data Model

### Report Entity

```typescript
interface Report {
  id: string;
  companyId: string;  // Tenant identifier
  title: string;
  status: 'draft' | 'generating' | 'completed' | 'failed';
  templateId: string;
  format: ReportFormat;
  locale: string;
  metadata: {
    generatedAt?: Date;
    fileSize?: number;
    pageCount?: number;
    errorMessage?: string;
    version?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

### Template Definition

```typescript
interface TemplateDefinition {
  id: string;
  kind: 'executive_summary' | 'detailed_analysis' | 'technical_appendix';
  version: number;
  title: string;
  description?: string;
  estimatedPageRange?: string;
}
```

### Report Template View Model

```typescript
interface ReportTemplateViewModel {
  title: string;
  subtitle?: string;
  locale: string;
  textDirection: 'ltr' | 'rtl';
  
  sections: {
    narrative: NarrativeSection[];
    statistical: StatisticalSummaryView[];
    verdict: VerdictScorecardView;
    highlights: InsightHighlightView[];
    charts: ChartSpec[];
    tables: DataTableInput[];
    figures: FigureInput[];
    appendix: AppendixSection[];
  };
  
  metadata: {
    company: CompanyInfo;
    reportDate: Date;
    dataRange: DateRange;
    generatedAt: Date;
  };
}
```

## API Design

### Report Generator Interface

```typescript
interface IReportGenerator {
  generate(
    context: ReportGenerationContext,
    model: unknown,
    format: ReportFormat
  ): Promise<Uint8Array>;
}
```

### Template Engine Interface

```typescript
interface ITemplateEngine {
  render(
    context: ReportGenerationContext,
    model: unknown
  ): Promise<string>;
}
```

### Format Generator Interface

```typescript
interface IFormatGenerator {
  readonly format: ReportFormat;
  generate(input: FormatGeneratorInput): Promise<Uint8Array>;
}
```

## Configuration

### Environment Variables

- `AGENTICVERDICT_USE_STUB_FORMAT_GENERATORS`: Use stub generators for testing (default: "0")
- `PLAYWRIGHT_CHROMIUM_PATH`: Override Playwright Chromium executable path

### Company Configuration

```typescript
interface CompanyConfig {
  localization: {
    language: 'ar' | 'en' | 'fr';
    region: string;
    timezone: string;
    currency: string;
  };
  reporting: {
    defaultTemplateId: string;
    defaultFormat: ReportFormat;
    branding: {
      logo?: string;
      primaryColor?: string;
      secondaryColor?: string;
    };
  };
}
```

## Deployment

### Docker Configuration

**Base Image**: Node.js 20 LTS with Playwright Chromium

**Required Dependencies**:
- Playwright Chromium browser
- System fonts for multi-language support
- OpenSSL for secure connections

**Environment Setup**:
```dockerfile
FROM mcr.microsoft.com/playwright:v1.59.0-jammy

# Install system fonts for multi-language support
RUN apt-get update && apt-get install -y \
  fonts-arabic \
  fonts-noto \
  fonts-liberation \
  && rm -rf /var/lib/apt/lists/*
```

**Health Checks**:
- Playwright Chromium availability check
- Database connectivity check
- Memory and disk space monitoring

### Database Migrations

```sql
-- Reports table
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  title VARCHAR(500) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  template_id VARCHAR(100) NOT NULL,
  format VARCHAR(10) NOT NULL,
  locale VARCHAR(10) NOT NULL DEFAULT 'en',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Row-level security
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY reports_company_isolation ON reports
  FOR ALL USING (company_id = current_setting('app.current_tenant_id')::uuid);

-- Indexes
CREATE INDEX idx_reports_company_id ON reports(company_id);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_created_at ON reports(created_at DESC);
```

## Performance Considerations

### Memory Management

- **PDF Generation**: Large reports may consume significant memory; implement page streaming for future optimization
- **Concurrent Generation**: Limit concurrent generations to prevent memory exhaustion (recommended: 3-5 concurrent)
- **Template Caching**: Cache parsed templates in memory for repeated generations

### Optimization Strategies

1. **Lazy Loading**: Load format plugins on-demand based on requested format
2. **Connection Pooling**: Reuse database connections for report metadata operations
3. **Asset Optimization**: Minimize embedded images and assets in templates
4. **Chunked Generation**: Split large reports into sections for parallel processing (future enhancement)

### Monitoring Metrics

- Report generation duration (p50, p95, p99)
- Format plugin success rates
- Memory usage during generation
- Template render times
- Database query performance

## Security Considerations

### Tenant Isolation

- All database queries scoped by company ID
- Row-level security enforced at database level
- Template overrides scoped to tenant
- Report access control via tenant context

### Data Protection

- No sensitive credentials in report metadata
- Encrypted storage for template overrides (future enhancement)
- Audit logging for report generation events
- Rate limiting for report generation API

### Input Validation

- Template ID validation against allowed templates
- Format validation against supported formats
- Locale validation against company configuration
- View model coercion with Zod schemas

## Error Handling

### Format Generation Failures

```typescript
class FormatGenerationError extends Error {
  constructor(
    public format: ReportFormat,
    public templateId: string,
    message: string
  ) {
    super(message);
    this.name = 'FormatGenerationError';
  }
}
```

### Template Rendering Failures

```typescript
class TemplateRenderingError extends Error {
  constructor(
    public templateId: string,
    public cause: unknown,
    message: string
  ) {
    super(message);
    this.name = 'TemplateRenderingError';
  }
}
```

### Retry Strategy

- Transient errors: Exponential backoff with max 3 retries
- Permanent errors: Log and fail immediately
- Template fallback: Built-in template if override fails

## Testing Strategy

### Unit Tests (70% target)

- Template engine rendering logic
- Format generator plugin registration
- View model coercion and validation
- Database query helpers
- Internationalization utilities

### Integration Tests (20% target)

- End-to-end report generation flow
- Template override resolution
- Database integration with multi-tenancy
- Phase 2 model integration

### Snapshot Tests (10% target)

- Built-in template HTML output
- Format plugin output comparison
- Visual regression for PDF generation

## Known Issues and Limitations

### Current Limitations

1. **Email Delivery**: Basic infrastructure implemented, full pipeline deferred to Phase 04
2. **Report Scheduling**: Not implemented, deferred to Phase 04
3. **Template Versioning**: No automatic migration for template updates
4. **Large Reports**: Reports >100 pages may experience memory pressure
5. **Interactive Elements**: PDF format lacks interactive charts/tables

### Technical Debt

1. **Template Fallback**: Fallback logic could be more robust with template version checking
2. **Error Messages**: Generic error messages need improvement for debugging
3. **Testing**: E2E tests require full Chromium installation in CI
4. **Documentation**: API reference needs more examples and use cases

## Future Enhancements

### Phase 04+ Roadmap

1. **Interactive Reports**: Web-based report viewers with filtering and drill-down
2. **Scheduled Reports**: Cron-based automated generation with email delivery
3. **Report History**: Version tracking and historical comparison
4. **Batch Generation**: Generate multiple reports in single operation
5. **Template Gallery**: Pre-built templates for different industries
6. **Advanced Charts**: Custom visualizations beyond built-in types
7. **Export Destinations**: Direct integration with cloud storage
8. **Report Collaboration**: Annotation and commenting on reports

## Completion Status

### Completed ✅

- Report generator package with plugin architecture
- Format generators for PDF, HTML, Excel, DOCX, JSON
- Template system with built-in templates
- Phase 2 integration layer
- Database integration with multi-tenancy
- Internationalization support (RTL/LTR)
- Testing infrastructure with 70%+ coverage
- Documentation and usage examples

### Deferred to Phase 04 ⏸️

- Email delivery pipeline
- Report scheduling infrastructure
- Report history and versioning
- Performance optimization (caching, batching)
- Advanced template features (interactive elements)

---

**Next Steps**: Proceed to Phase 04 (Production Hardening) for deployment, monitoring, and optimization of the report generation system.

**Handoff**: Report generator package is ready for production deployment with Phase 04 infrastructure (Docker, monitoring, email delivery).
