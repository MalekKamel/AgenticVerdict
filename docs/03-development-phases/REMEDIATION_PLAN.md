# Comprehensive Remediation Plan

**Date**: 2026-04-04
**Purpose**: Address critical gaps and align Phases 00-02 with Phase 03 requirements
**Status**: Ready for Execution

---

## Executive Summary

This remediation plan addresses the critical gaps identified in the Phase 03 gap analysis. It consists of two main components:

1. **Documentation Updates**: Updating previous phase documentation to reflect actual implementation
2. **Critical Gap Implementation**: Building missing components required for Phase 03

### Key Architecture Decision: Unified Verdict Schema

**IMPORTANT**: This plan implements a **single, reusable verdict schema** across ALL phases instead of using transformation layers between phases.

- **Task R-7**: Standardize Verdict Schema (replaces transformation approach)
- The `MarketingVerdict` schema in `@agenticverdict/types` is the **single source of truth**
- Used by Phase 01 (data), Phase 02 (analysis), Phase 03 (reports), Phase 04 (delivery)
- No transformation layers needed
- Better maintainability, type safety, and reduced technical debt

### Timeline Overview

| Phase                        | Duration    | Start  | End    |
| ---------------------------- | ----------- | ------ | ------ |
| Documentation Updates        | 1 week      | Week 1 | Week 1 |
| Critical Gaps Implementation | 4 weeks     | Week 2 | Week 5 |
| **Total**                    | **5 weeks** |        |        |

---

## Part 1: Documentation Updates (Week 1)

### Objective

Ensure all phase documentation accurately reflects the current implementation state and provides clear guidance for Phase 03 dependencies.

### Tasks

#### Task D-1: Update Phase 00 Documentation

**Files to Update**:

- `/docs/03-development-phases/phase-00-foundation/overview.md`
- `/docs/03-development-phases/phase-00-foundation/tasks.md`
- `/docs/03-development-phases/phase-00-foundation/acceptance-criteria.md`

**Updates Required**:

1. Add template configuration schema specification
2. Add design system tokens specification
3. Update i18n package status (from complete to partial)
4. Add missing acceptance criteria for template foundation

**Owner**: Technical Writer
**Effort**: 1 day

---

#### Task D-2: Update Phase 01 Documentation

**Files to Update**:

- `/docs/03-development-phases/phase-01-platform-integration/overview.md`
- `/docs/03-development-phases/phase-01-platform-integration/tasks.md`
- `/docs/03-development-phases/phase-01-platform-integration/acceptance-criteria.md`

**Updates Required**:

1. Add cache integration API specifications
2. Document data freshness requirements
3. Add performance baseline metrics
4. Update adapter interface documentation

**Owner**: Technical Writer
**Effort**: 1 day

---

#### Task D-3: Update Phase 02 Documentation

**Files to Update**:

- `/docs/03-development-phases/phase-02-agent-intelligence/overview.md`
- `/docs/03-development-phases/phase-02-agent-intelligence/tasks.md`
- `/docs/03-development-phases/phase-02-agent-intelligence/acceptance-criteria.md`

**Updates Required**:

1. Add API endpoint specifications (NEW)
2. Document **unified verdict schema** completely (see Task R-7)
3. Add insight schema specification
4. Add data validation interface requirements
5. Add provenance tracking specification
6. Update completion criteria to include API layer
7. **IMPORTANT**: Emphasize that verdict schema is reusable across ALL phases (no transformation needed)

**Owner**: Technical Writer + Backend Lead
**Effort**: 2 days

---

#### Task D-4: Create Interface Specifications

**New File**: `/docs/03-development-phases/phase-02-agent-intelligence/API_SPECIFICATIONS.md`

**Content Required**:

1. OpenAPI/Swagger specifications for:
   - GET /api/v1/insights
   - GET /api/v1/verdicts
   - GET /api/v1/analysis-results/:id
   - POST /api/v1/insights/validate
   - POST /api/v1/verdicts/validate
2. Request/response schemas
3. Authentication requirements
4. Rate limiting specifications
5. Error handling specifications

**Owner**: Backend Lead
**Effort**: 1 day

---

## Part 2: Critical Gap Implementation (Weeks 2-5)

### Overview

Implement the 7 critical prerequisites identified in the gap analysis that must be completed before Phase 03 can begin.

### Week 2: API Layer Implementation (PR-1)

#### Task R-1: Implement Insight Retrieval Endpoints

**File**: `apps/api/src/routes/v1/insights.ts`

**Requirements**:

```typescript
// GET /api/v1/insights
interface InsightListParams {
  filter?: {
    type?: "anomaly" | "trend" | "opportunity" | "warning";
    confidence?: number; // minimum confidence
    relevance?: number; // minimum relevance score
  };
  sort?: "relevance" | "created" | "confidence";
  pagination?: {
    limit?: number; // default 50, max 100
    offset?: number; // default 0
  };
}

interface InsightListResponse {
  insights: GeneratedInsight[];
  total: number;
  limit: number;
  offset: number;
}
```

**Acceptance Criteria**:

- [ ] Endpoint returns 200 with valid data
- [ ] Filtering by type works correctly
- [ ] Filtering by confidence threshold works
- [ ] Sorting by all options works
- [ ] Pagination works correctly
- [ ] JWT authentication required
- [ ] Rate limiting applied (100 req/min per tenant)
- [ ] Response cached with 5-minute TTL

**Owner**: Backend Developer
**Effort**: 2 days

---

#### Task R-2: Implement Verdict Retrieval Endpoints

**File**: `apps/api/src/routes/v1/verdicts.ts`

**Requirements**:

```typescript
// GET /api/v1/verdicts
interface VerdictListParams {
  campaignId?: string;
  verdictType?: "budget_allocation" | "platform_performance" | "creative_effectiveness";
  dateRange?: {
    start: string; // ISO date
    end: string; // ISO date
  };
}

interface VerdictListResponse {
  verdicts: MarketingVerdict[];
  total: number;
}
```

**Acceptance Criteria**:

- [ ] Endpoint returns 200 with valid data
- [ ] Filtering by campaign works
- [ ] Filtering by verdict type works
- [ ] Date range filtering works
- [ ] JWT authentication required
- [ ] Rate limiting applied
- [ ] Response cached with 10-minute TTL

**Owner**: Backend Developer
**Effort**: 2 days

---

#### Task R-3: Implement Analysis Results Endpoint

**File**: `apps/api/src/routes/v1/analysis-results.ts`

**Requirements**:

```typescript
// GET /api/v1/analysis-results/:id
interface AnalysisResultResponse {
  analysisId: string;
  tenantId: string;
  period: DateRange;
  platformsAnalyzed: string[];
  dataQualityScore: number;
  generatedAt: Date;
  provenance: ProvenanceInfo;
  insights: GeneratedInsight[];
  verdicts: MarketingVerdict[];
}
```

**Acceptance Criteria**:

- [ ] Endpoint returns 200 with valid data
- [ ] Includes complete provenance information
- [ ] Includes related insights and verdicts
- [ ] JWT authentication required
- [ ] Tenant-scoped access control

**Owner**: Backend Developer
**Effort**: 1 day

---

#### Task R-4: Implement Validation Endpoints

**File**: `apps/api/src/routes/v1/validation.ts`

**Requirements**:

```typescript
// POST /api/v1/insights/validate
interface InsightValidationRequest {
  insights: GeneratedInsight[];
}

interface ValidationResult {
  isValid: boolean;
  score: number; // 0-100
  errors: ValidationError[];
  warnings: ValidationWarning[];
  recommendations: string[];
}

// POST /api/v1/verdicts/validate
interface VerdictValidationRequest {
  verdict: MarketingVerdict;
}
```

**Acceptance Criteria**:

- [ ] Insight validation checks completeness
- [ ] Verdict validation checks all required fields
- [ ] Returns quality score
- [ ] Provides actionable recommendations
- [ ] JWT authentication required

**Owner**: Backend Developer
**Effort**: 2 days

---

#### Task R-5: Implement Authentication Middleware

**File**: `apps/api/src/middleware/auth.ts`

**Requirements**:

```typescript
interface AuthMiddlewareOptions {
  required: boolean;
  roles?: string[];
}

function jwtAuth(options?: AuthMiddlewareOptions): RequestHandler;
```

**Acceptance Criteria**:

- [ ] Validates JWT tokens
- [ ] Extracts tenant context
- [ ] Adds user info to request
- [ ] Returns 401 for invalid tokens
- [ ] Returns 403 for insufficient permissions
- [ ] Integrates with @agenticverdict/core

**Owner**: Security Developer
**Effort**: 1 day

---

#### Task R-6: Implement Rate Limiting Middleware

**File**: `apps/api/src/middleware/rate-limit.ts`

**Requirements**:

```typescript
interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  keyPrefix: string;
  perTenant?: boolean;
}

function rateLimit(options: RateLimitOptions): RequestHandler;
```

**Acceptance Criteria**:

- [ ] Rate limits by tenant ID
- [ ] Returns 429 when limit exceeded
- [ ] Includes Retry-After header
- [ ] Uses Redis for distributed limiting
- [ ] Configurable limits per endpoint

**Owner**: Backend Developer
**Effort**: 1 day

---

### Week 3: Schema and Configuration (PR-2, PR-3, PR-5)

#### Task R-7: Standardize Verdict Schema for All Phases

**File**: `packages/types/src/verdict.ts`

**Requirements**:

```typescript
/**
 * UNIFIED VERDICT SCHEMA
 * This schema is used across ALL phases (01, 02, 03, 04)
 * No transformation layers needed - single source of truth
 */

export interface MarketingVerdict {
  // Core identification
  id: string;
  tenantId: string;
  campaignId?: string;
  analysisId: string;

  // Classification
  verdictType:
    | "budget_allocation"
    | "platform_performance"
    | "creative_effectiveness"
    | "overall_health";

  // Scoring
  score: number; // 0-100
  confidence: number; // 0-1
  sentiment: "positive" | "neutral" | "negative";

  // Core content
  summary: string;
  reasoning: string[]; // Expanded for reports
  keyInsights: VerdictInsight[];
  recommendations: VerdictRecommendation[];
  actionItems: VerdictActionItem[];

  // Phase 03 report requirements
  evidence: VerdictEvidence[];
  historicalContext?: HistoricalTrend[];
  dataSources: DataSourceInfo[];
  methodology?: MethodologyInfo;

  // Metadata
  platformsAnalyzed: string[];
  dateRange: DateRange;
  generatedAt: Date;
  generatedBy: string; // Agent ID
  modelUsed: string;
  parameters?: Record<string, any>;

  // Report-specific (optional for Phase 02, required for Phase 03)
  reportMetadata?: {
    includeInExecutiveSummary: boolean;
    displayPriority: number;
    visualizations?: VerdictVisualization[];
    footnotes?: string[];
  };
}

export interface VerdictInsight {
  id: string;
  title: string;
  detail: string;
  impact: "high" | "medium" | "low";
  confidence: number; // 0-1
  category?: string;
  sourcePlatform?: string;
  relatedMetrics?: MetricReference[];
}

export interface VerdictRecommendation {
  id: string;
  title: string;
  rationale: string;
  priority: number; // 1-5, 1 = highest
  estimatedImpact?: {
    roas?: number;
    cost?: number;
    revenue?: number;
  };
  effort: "low" | "medium" | "high";
  timeline?: string;
  ownerRole?: string;
}

export interface VerdictActionItem {
  id: string;
  description: string;
  ownerRole: string;
  priority: number;
  dueDateHint?: string;
  estimatedHours?: number;
  dependencies?: string[]; // IDs of other action items
}

export interface VerdictEvidence {
  id: string;
  label: string;
  value?: string | number;
  metric?: string;
  valueFormatted?: string;
  change?: number;
  changePercent?: number;
  source: "meta" | "ga4" | "gsc" | "gbp" | "tiktok" | "internal" | "composite";
  capturedAt: Date;
}

export interface HistoricalTrend {
  period: string; // e.g., "2024-W01", "2024-01"
  score: number;
  confidence: number;
  summary?: string;
}

export interface DataSourceInfo {
  platform: "meta" | "ga4" | "gsc" | "gbp" | "tiktok";
  metrics: string[];
  dateRange: DateRange;
  freshness: number; // hours since data capture
  qualityScore: number; // 0-100
}

export interface MethodologyInfo {
  approach: string;
  dataPoints: number;
  confidenceInterval?: {
    lower: number;
    upper: number;
    level: number; // e.g., 0.95 for 95% confidence
  };
  limitations?: string[];
  assumptions?: string[];
}

export interface VerdictVisualization {
  type: "gauge" | "trend" | "comparison" | "distribution";
  title: string;
  data: any;
  config?: Record<string, any>;
}

// Zod validation schema
export const MarketingVerdictSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  campaignId: z.string().uuid().optional(),
  analysisId: z.string().uuid(),

  verdictType: z.enum([
    "budget_allocation",
    "platform_performance",
    "creative_effectiveness",
    "overall_health",
  ]),

  score: z.number().min(0).max(100),
  confidence: z.number().min(0).max(1),
  sentiment: z.enum(["positive", "neutral", "negative"]),

  summary: z.string().min(10).max(500),
  reasoning: z.array(z.string().min(10)).min(1),
  keyInsights: z.array(VerdictInsightSchema).min(1),
  recommendations: z.array(VerdictRecommendationSchema).min(1),
  actionItems: z.array(VerdictActionItemSchema),

  evidence: z.array(VerdictEvidenceSchema),
  historicalContext: z.array(HistoricalTrendSchema).optional(),
  dataSources: z.array(DataSourceInfoSchema).min(1),
  methodology: MethodologyInfoSchema.optional(),

  platformsAnalyzed: z.array(z.string()).min(1),
  dateRange: DateRangeSchema,
  generatedAt: z.date(),
  generatedBy: z.string(),
  modelUsed: z.string(),
  parameters: z.record(z.any()).optional(),

  reportMetadata: z
    .object({
      includeInExecutiveSummary: z.boolean().default(false),
      displayPriority: z.number().min(1).max(10).default(5),
      visualizations: z.array(z.any()).optional(),
      footnotes: z.array(z.string()).optional(),
    })
    .optional(),
});
```

**Acceptance Criteria**:

- [ ] Unified verdict schema defined in `@agenticverdict/types`
- [ ] All Phase 02 code updated to use new schema
- [ ] All Phase 03 documentation updated to reference this schema
- [ ] Zod validation schema complete
- [ ] TypeScript types exported
- [ ] Migration guide for existing code
- [ ] Backward compatibility maintained where possible

**Owner**: Architect + Backend Developer
**Effort**: 3 days

---

#### Task R-8: Define Template Configuration Schema

**File**: `packages/config/src/schemas/template.ts`

**Requirements**:

```typescript
interface TemplateConfig {
  id: string;
  name: string;
  version: string;
  type: "executive-summary" | "detailed-analysis" | "technical-appendix" | "custom";
  sections: TemplateSection[];
  styling: TemplateStyling;
  variables: TemplateVariable[];
  branding: BrandConfig;
  validation: TemplateValidation;
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    description?: string;
  };
}

interface TemplateSection {
  id: string;
  type: "header" | "content" | "chart" | "table" | "footer" | "callout" | "divider";
  order: number;
  content?: string;
  dataSource?: string;
  styling?: SectionStyling;
  conditional?: ConditionalRule;
  repeatable?: boolean;
}

interface TemplateVariable {
  name: string;
  type: "string" | "number" | "date" | "boolean" | "array" | "object";
  defaultValue?: any;
  required: boolean;
  description?: string;
}

interface TemplateStyling {
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
  fontSize?: {
    base: string;
    headings: string;
    captions: string;
  };
  spacing?: {
    margins: string;
    padding: string;
  };
  layout?: {
    columns: number;
    maxWidth: string;
  };
}

interface BrandConfig {
  logo?: string;
  colors: string[];
  fonts: string[];
}

interface TemplateValidation {
  requiredSections: string[];
  maxSections?: number;
  allowedVariables: string[];
}

const TemplateConfigSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  type: z.enum(["executive-summary", "detailed-analysis", "technical-appendix", "custom"]),
  // ... rest of schema
});
```

**Acceptance Criteria**:

- [ ] Complete Zod schema defined
- [ ] All template types supported
- [ ] Validation rules implemented
- [ ] JSON schema export available
- [ ] TypeScript types exported
- [ ] Documentation complete

**Owner**: Backend Developer
**Effort**: 2 days

---

#### Task R-9: Define Design System Tokens

**File**: `packages/config/src/schemas/branding.ts`

**Requirements**:

```typescript
interface DesignTokens {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    success: string;
    warning: string;
    error: string;
    info: string;
    neutral: string[];
    semantic: {
      background: string;
      foreground: string;
      border: string;
    };
  };
  typography: {
    families: {
      headings: string;
      body: string;
      mono: string;
    };
    sizes: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
      "2xl": string;
      "3xl": string;
      "4xl": string;
    };
    weights: {
      regular: number;
      medium: number;
      semibold: number;
      bold: number;
    };
    lineHeights: {
      tight: number;
      normal: number;
      relaxed: number;
    };
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    "2xl": string;
    "3xl": string;
  };
  borders: {
    radius: {
      sm: string;
      md: string;
      lg: string;
      full: string;
    };
    width: {
      thin: string;
      medium: string;
      thick: string;
    };
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  transitions: {
    fast: string;
    normal: string;
    slow: string;
  };
}

const DesignTokensSchema = z.object({
  colors: z.object({
    primary: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    // ... rest of schema
  }),
  // ... rest of schema
});

// Default design tokens
const DefaultDesignTokens: DesignTokens = {
  colors: {
    primary: "#3B82F6",
    secondary: "#8B5CF6",
    accent: "#EC4899",
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
    info: "#06B6D4",
    neutral: [
      "#F9FAFB",
      "#F3F4F6",
      "#E5E7EB",
      "#D1D5DB",
      "#9CA3AF",
      "#6B7280",
      "#4B5563",
      "#374151",
      "#1F2937",
      "#111827",
    ],
    semantic: {
      background: "#FFFFFF",
      foreground: "#111827",
      border: "#E5E7EB",
    },
  },
  // ... rest of defaults
};
```

**Acceptance Criteria**:

- [ ] Complete design token schema defined
- [ ] Default tokens provided
- [ ] Zod validation implemented
- [ ] Mantine theme generator
- [ ] CSS variables export
- [ ] Documentation complete

**Owner**: UI/UX Designer + Frontend Developer
**Effort**: 1 day

---

### Week 4: Validation and Tracking (PR-4, PR-6)

#### Task R-10: Implement Data Validation Service

**File**: `packages/agent-runtime/src/validation/data-quality.ts`

**Requirements**:

```typescript
interface DataQualityValidator {
  validateInsight(insight: GeneratedInsight): ValidationResult;
  validateVerdict(verdict: MarketingVerdict): ValidationResult;
  validateAnalysisResult(result: AnalysisResult): ValidationResult;
}

interface ValidationResult {
  isValid: boolean;
  score: number; // 0-100
  errors: ValidationError[];
  warnings: ValidationWarning[];
  recommendations: string[];
  metadata: {
    validatedAt: Date;
    validatorVersion: string;
  };
}

interface ValidationError {
  field: string;
  code: string;
  message: string;
  severity: "critical" | "high" | "medium" | "low";
}

interface ValidationWarning {
  field: string;
  code: string;
  message: string;
  suggestion?: string;
}

class DataQualityService implements DataQualityValidator {
  private validationRules: ValidationRule[];

  constructor(config: ValidationConfig) {
    // Initialize validation rules
  }

  validateInsight(insight: GeneratedInsight): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Required field validation
    if (!insight.id)
      errors.push({
        field: "id",
        code: "REQUIRED_FIELD_MISSING",
        message: "Insight ID is required",
        severity: "critical",
      });

    if (!insight.type)
      errors.push({
        field: "type",
        code: "REQUIRED_FIELD_MISSING",
        message: "Insight type is required",
        severity: "critical",
      });

    // Confidence validation
    if (insight.confidence !== undefined && insight.confidence < 0.5) {
      warnings.push({
        field: "confidence",
        code: "LOW_CONFIDENCE",
        message: "Insight confidence is below 0.5",
        suggestion: "Consider reviewing the insight before including in reports",
      });
    }

    // Completeness validation
    if (!insight.description || insight.description.length < 50) {
      errors.push({
        field: "description",
        code: "INSUFFICIENT_DETAIL",
        message: "Insight description is too brief for reports",
        severity: "high",
      });
    }

    // Calculate quality score
    const score = this.calculateQualityScore(insight, errors, warnings);

    return {
      isValid:
        errors.filter((e) => e.severity === "critical" || e.severity === "high").length === 0,
      score,
      errors,
      warnings,
      recommendations: this.generateRecommendations(insight, errors, warnings),
      metadata: {
        validatedAt: new Date(),
        validatorVersion: "1.0.0",
      },
    };
  }

  validateVerdict(verdict: MarketingVerdict): ValidationResult {
    // Similar implementation for verdicts
  }

  private calculateQualityScore(
    data: GeneratedInsight | MarketingVerdict,
    errors: ValidationError[],
    warnings: ValidationWarning[],
  ): number {
    // Score calculation logic
    // Start with 100, deduct points for errors/warnings
    let score = 100;

    errors.forEach((error) => {
      switch (error.severity) {
        case "critical":
          score -= 25;
          break;
        case "high":
          score -= 15;
          break;
        case "medium":
          score -= 10;
          break;
        case "low":
          score -= 5;
          break;
      }
    });

    warnings.forEach(() => (score -= 2));

    return Math.max(0, score);
  }

  private generateRecommendations(
    data: GeneratedInsight | MarketingVerdict,
    errors: ValidationError[],
    warnings: ValidationWarning[],
  ): string[] {
    const recommendations: string[] = [];

    // Generate recommendations based on errors and warnings
    if (errors.some((e) => e.field === "confidence")) {
      recommendations.push("Consider regenerating the insight with higher confidence threshold");
    }

    // ... more recommendation logic

    return recommendations;
  }
}
```

**Acceptance Criteria**:

- [ ] Insight validation implemented
- [ ] Verdict validation implemented
- [ ] Quality scoring algorithm working
- [ ] Actionable recommendations generated
- [ ] Integration with agent-runtime
- [ ] Unit tests for all validation rules
- [ ] Integration tests with real data

**Owner**: Backend Developer
**Effort**: 3 days

---

#### Task R-11: Implement Provenance Tracking

**File**: `packages/database/src/schema/provenance.ts` and `packages/agent-runtime/src/provenance/tracker.ts`

**Requirements**:

```typescript
// Database schema
interface ProvenanceRecord {
  id: string;
  analysisId: string;
  tenantId: string;
  timestamp: Date;
  dataSource: string; // 'meta' | 'ga4' | 'gsc' | 'gbp' | 'tiktok'
  dataRange: {
    start: Date;
    end: Date;
  };
  transformations: Transformation[];
  qualityScore: number;
  agentVersion: string;
  modelUsed: string;
  parameters: Record<string, any>;
}

interface Transformation {
  type: string;
  description: string;
  timestamp: Date;
  parameters?: Record<string, any>;
}

// Agent runtime integration
class ProvenanceTracker {
  startTracking(analysisId: string, tenantId: string): void;
  recordDataSource(source: string, dataRange: DateRange): void;
  recordTransformation(transformation: Transformation): void;
  recordAgentUsage(version: string, model: string, parameters: any): void;
  setQualityScore(score: number): void;
  finalize(): ProvenanceRecord;
  getCurrentProvenance(): ProvenanceInfo;
}

// Usage in agents
const tracker = new ProvenanceTracker(analysisId, tenantId);
tracker.recordDataSource("meta", { start: startDate, end: endDate });
tracker.recordTransformation({
  type: "normalization",
  description: "Normalized platform metrics",
  timestamp: new Date(),
});
tracker.recordAgentUsage("1.0.0", "claude-3-5-sonnet-20241022", { temperature: 0.7 });
tracker.setQualityScore(85);
const provenance = tracker.finalize();

// Store in database
await db.insert(provenanceRecords).values(provenance);
```

**Acceptance Criteria**:

- [ ] ProvenanceRecord schema defined in database
- [ ] ProvenanceTracker class implemented
- [ ] Integrated with all agent operations
- [ ] Provenance data stored in database
- [ ] Query interface for provenance retrieval
- [ ] Migration script for new table
- [ ] Unit tests for tracker
- [ ] Integration tests with agents

**Owner**: Backend Developer
**Effort**: 2 days

---

### Week 5: Service Configuration (PR-7)

#### Task R-12: Configure Email Delivery Service

**Files**:

- `apps/worker/src/services/email.ts`
- `apps/worker/src/templates/email/report-ready.html`
- `.env.example` (add email configuration)

**Requirements**:

```typescript
// Email service implementation
interface EmailDeliveryService {
  sendReport(params: {
    to: string[];
    subject: string;
    reportId: string;
    format: "pdf" | "docx";
    attachments: EmailAttachment[];
    template?: string;
  }): Promise<DeliveryResult>;
}

interface DeliveryResult {
  success: boolean;
  messageId?: string;
  error?: string;
  retries?: number;
}

interface EmailAttachment {
  filename: string;
  content: Buffer;
  contentType: string;
}

// Implementation using SendGrid or Resend
class SendGridEmailService implements EmailDeliveryService {
  private client: SendGrid;

  constructor(apiKey: string) {
    this.client = new SendGrid(apiKey);
  }

  async sendReport(params: {
    to: string[];
    subject: string;
    reportId: string;
    format: "pdf" | "docx";
    attachments: EmailAttachment[];
  }): Promise<DeliveryResult> {
    try {
      const msg = {
        to: params.to,
        from: "reports@agenticverdict.com",
        subject: params.subject,
        text: "Your report is ready.",
        html: await this.loadEmailTemplate("report-ready", {
          reportId: params.reportId,
          format: params.format,
          downloadLink: `${process.env.APP_URL}/reports/${params.reportId}`,
        }),
        attachments: params.attachments.map((a) => ({
          filename: a.filename,
          content: a.content.toString("base64"),
          type: a.contentType,
          disposition: "attachment",
        })),
      };

      const response = await this.client.send(msg);

      return {
        success: true,
        messageId: response.headers["x-message-id"],
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  private async loadEmailTemplate(template: string, data: Record<string, any>): Promise<string> {
    // Load and render email template
  }
}

// Worker integration
import { sendReportEmail } from "./services/email";

worker.process("report-delivery", async (job) => {
  const { reportId, recipients, format } = job.data;

  // Get report from storage
  const report = await getReportFromStorage(reportId);

  // Send email
  const result = await sendReportEmail({
    to: recipients,
    subject: `Your ${format.toUpperCase()} report is ready`,
    reportId,
    format,
    attachments: [
      {
        filename: `report-${reportId}.${format}`,
        content: report.content,
        contentType:
          format === "pdf"
            ? "application/pdf"
            : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      },
    ],
  });

  if (!result.success) {
    throw new Error(`Email delivery failed: ${result.error}`);
  }

  return result;
});
```

**Email Template** (`apps/worker/src/templates/email/report-ready.html`):

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Your Report is Ready</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        line-height: 1.6;
        color: #333;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
      }
      .header {
        background: #3b82f6;
        color: white;
        padding: 20px;
        text-align: center;
      }
      .content {
        padding: 20px;
        background: #f9fafb;
      }
      .button {
        display: inline-block;
        padding: 12px 24px;
        background: #3b82f6;
        color: white;
        text-decoration: none;
        border-radius: 4px;
      }
      .footer {
        text-align: center;
        padding: 20px;
        font-size: 12px;
        color: #666;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Your Report is Ready</h1>
      </div>
      <div class="content">
        <p>Hello,</p>
        <p>Your {{format}} report is now ready for download.</p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="{{downloadLink}}" class="button">Download Report</a>
        </p>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #3B82F6;">{{downloadLink}}</p>
        <p>This link will expire in 30 days.</p>
      </div>
      <div class="footer">
        <p>&copy; 2026 AgenticVerdict. All rights reserved.</p>
      </div>
    </div>
  </body>
</html>
```

**Environment Variables** (add to `.env.example`):

```bash
# Email Configuration
EMAIL_SERVICE_PROVIDER=sendgrid  # or 'resend'
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=reports@agenticverdict.com
SENDGRID_FROM_NAME=AgenticVerdict Reports
RESEND_API_KEY=your_resend_api_key
```

**Acceptance Criteria**:

- [ ] SendGrid/Resend account configured
- [ ] Email delivery service implemented
- [ ] Email templates created (HTML + text)
- [ ] Attachment handling working
- [ ] Delivery tracking implemented
- [ ] Bounce/complaint handling configured
- [ ] Test emails sent successfully
- [ ] SPF/DKIM/DMARC records documented

**Owner**: DevOps Developer
**Effort**: 2 days

---

## Part 3: Testing and Validation (Week 5)

### Objective

Ensure all remediation work is tested and validated before Phase 03 begins.

### Task R-13: Integration Testing

**Requirements**:

- [x] Test all API endpoints with real data _(contract tests against seeded in-memory store; see `apps/api/src/api.contract.test.ts`)_
- [x] Test authentication and authorization _(401/403 coverage in contract + `middleware/auth.test.ts`)_
- [x] Test rate limiting _(429 + `Retry-After` on validation route with dedicated tenant)_
- [x] Test data validation service _(POST validate endpoints + `DataQualityService` in route pipeline)_
- [x] Test provenance tracking _(analysis bundle includes `provenance` assertions in contract tests)_
- [x] Test email delivery (sandbox) _(mocked Resend HTTP in `apps/worker/src/services/email.test.ts`)_
- [x] **Test unified verdict schema** - verify works in all phases _(GET verdicts + `marketingVerdictSchema.safeParse` in contract tests)_
- [x] Test verdict validation with new schema _(POST `/verdicts/validate` in contract tests)_
- [x] Test backward compatibility _(legacy fixture → unified verdict remains covered in `analysis-store` / agent-runtime; API serves unified shape)_

**Owner**: QA Engineer
**Effort**: 2 days

---

### Task R-14: Documentation and Handoff

**Requirements**:

- [x] API documentation published (Swagger/Redoc) _(Swagger UI + OpenAPI JSON at `/documentation` and `/documentation/json`; route schemas in v1 handlers)_
- [x] Runbook for API troubleshooting _( `docs/06-reference/runbooks/api-troubleshooting.md` )_
- [x] Email service runbook _( `docs/06-reference/runbooks/email-service.md` )_
- [x] Known issues documented _( `docs/06-reference/runbooks/remediation-known-issues.md` )_
- [ ] Phase 03 handoff session scheduled _(checklist: `docs/06-reference/runbooks/phase-03-handoff.md`)_
- [x] Training materials for Phase 03 team _(agenda + pointers in `phase-03-handoff.md`)_

**Owner**: Technical Writer
**Effort**: 1 day

---

## Summary

### Deliverables

| Category          | Deliverable                | Owner                 | Effort |
| ----------------- | -------------------------- | --------------------- | ------ |
| **Documentation** | Updated Phase 00 docs      | Tech Writer           | 1 day  |
| **Documentation** | Updated Phase 01 docs      | Tech Writer           | 1 day  |
| **Documentation** | Updated Phase 02 docs      | Tech Writer + Backend | 2 days |
| **Documentation** | API specifications         | Backend Lead          | 1 day  |
| **API Layer**     | Insight endpoints          | Backend               | 2 days |
| **API Layer**     | Verdict endpoints          | Backend               | 2 days |
| **API Layer**     | Analysis results endpoint  | Backend               | 1 day  |
| **API Layer**     | Validation endpoints       | Backend               | 2 days |
| **API Layer**     | Authentication middleware  | Security              | 1 day  |
| **API Layer**     | Rate limiting middleware   | Backend               | 1 day  |
| **Schema**        | **Unified verdict schema** | Architect + Backend   | 3 days |
| **Schema**        | Template configuration     | Backend               | 2 days |
| **Schema**        | Design system tokens       | Designer + Dev        | 1 day  |
| **Validation**    | Data quality service       | Backend               | 3 days |
| **Tracking**      | Provenance tracking        | Backend               | 2 days |
| **Services**      | Email delivery             | DevOps                | 2 days |
| **Testing**       | Integration testing        | QA                    | 2 days |
| **Handoff**       | Documentation              | Tech Writer           | 1 day  |

**Total Effort**: 32 days (6-7 weeks with 1 developer)

With parallelization:

- **Week 1**: Documentation updates
- **Week 2-3**: API layer implementation
- **Week 3-4**: Schema and validation
- **Week 5**: Services and testing
- **Week 6**: Buffer and final validation

---

## Success Criteria

### Go/No-Go Decision Points

#### After Week 1 (Documentation)

- [ ] All phase documentation updated
- [ ] API specifications approved
- [ ] Technical debt documented

#### After Week 3 (API Layer)

- [ ] All API endpoints functional
- [ ] Authentication working
- [ ] Rate limiting configured
- [ ] API documentation published

#### After Week 4 (Schemas and Validation)

- [ ] Template schema validated
- [ ] Design tokens approved
- [ ] Validation service operational
- [ ] Provenance tracking working

#### After Week 5 (Services and Testing)

- [ ] Email delivery confirmed
- [ ] All integration tests passing
- [ ] Performance benchmarks met
- [ ] Documentation complete

#### Final Go/No-Go (End of Week 6)

- [ ] All prerequisites complete
- [ ] Phase 03 team trained
- [ ] Environments ready
- [ ] Stakeholder approval

---

## Risk Management

### Risks and Mitigations

| Risk                                    | Probability | Impact | Mitigation                                                  |
| --------------------------------------- | ----------- | ------ | ----------------------------------------------------------- |
| API integration issues                  | Medium      | High   | Contract testing, mock servers                              |
| Schema standardization breaking changes | Medium      | High   | Versioned schema, backward compatibility, migration scripts |
| Email delivery failures                 | Low         | Medium | Multiple provider options                                   |
| Documentation delays                    | Medium      | Low    | Prioritize critical docs                                    |
| Resource constraints                    | Medium      | High   | Parallelize tasks, add resources                            |

---

## Architecture Decision: Unified Verdict Schema

### Why a Single Verdict Schema?

**Previous Approach (Transformation Layer)**:

- Phase 02: Internal verdict format
- Phase 03: Different verdict format
- Transformation layer between phases
- ❌ Maintains two schemas
- ❌ Transformation complexity
- ❌ Risk of data loss
- ❌ Harder to maintain

**New Approach (Unified Schema)**:

- Single verdict schema across ALL phases
- Used by Phase 01 (data collection), Phase 02 (analysis), Phase 03 (reports), Phase 04 (delivery)
- ✅ Single source of truth
- ✅ No transformation needed
- ✅ Easier to maintain
- ✅ Better type safety
- ✅ Reduced technical debt

### Schema Reusability

The `MarketingVerdict` schema is designed to be:

1. **Forward Compatible**: Optional fields allow future extensions
2. **Backward Compatible**: Existing code continues to work
3. **Phase Agnostic**: Works in any phase without modification
4. **Self Documenting**: Clear field names and TypeScript types
5. **Validated**: Zod schema ensures data quality

### Migration Path

1. **Week 1**: Define unified schema in `@agenticverdict/types`
2. **Week 2**: Update Phase 02 code to use new schema
3. **Week 3**: Update Phase 03 documentation to reference unified schema
4. **Week 4**: Remove any transformation code
5. **Week 5**: Testing across all phases

---

## Next Steps

1. **Immediate Actions** (Day 1):
   - Review and approve this remediation plan
   - Allocate resources and team members
   - Set up project tracking

2. **Week 1 Actions**:
   - Begin documentation updates
   - Schedule API definition workshop
   - Set up development environments

3. **Week 2 Actions**:
   - Begin API implementation
   - Set up testing infrastructure
   - Configure email service (sandbox)

---

**Document Owner**: Project Management Team
**Approval Required**: Tech Lead, Product Owner, Stakeholders
**Review Frequency**: Weekly
**Status**: Ready for Execution
