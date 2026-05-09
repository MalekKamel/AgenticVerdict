import { z } from "zod";

export const reportMetadataSchema = z.record(z.string(), z.unknown()).nullable();
export type ReportMetadata = z.infer<typeof reportMetadataSchema>;

// ============================================================================
// Report DTOs (moved from apps/frontend/src/features/reports/types.ts)
// ============================================================================

export interface ReportListItem {
  id: string;
  tenantId: string;
  title: string;
  status: string;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportListResponse {
  reports: ReportListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ReportDetail {
  id: string;
  tenantId: string;
  title: string;
  status: string;
  metadata: Record<string, unknown> | null;
  contentUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Report {
  id: string;
  name: string;
  format: string;
  generatedAt: string;
  insightId: string;
  status: string;
  versions?: Array<{
    versionHash: string;
    createdAt: string;
    size: number;
  }>;
}

export interface ReportContent {
  content: string;
  contentType: string;
  pdfUrl?: string;
  excelData?: ArrayBuffer;
}

export interface ShareLink {
  id: string;
  reportId: string;
  shareToken: string;
  accessType: string;
  expiresAt: string;
  createdAt: string;
  revoked: boolean;
}

export interface CreateShareLinkResponse {
  shareUrl: string;
  shareToken: string;
  expiresAt: string;
}

// ============================================================================
// Report CRUD Schemas (moved from apps/api/src/trpc/routers/reports.ts)
// ============================================================================

export const reportListInputSchema = z.object({
  status: z.string().optional(),
  format: z.enum(["pdf", "excel", "all"]).optional().default("all"),
  search: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  insightId: z.string().uuid().optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});
export type ReportListInput = z.infer<typeof reportListInputSchema>;

export const reportOutputSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  title: z.string(),
  status: z.string(),
  metadata: reportMetadataSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type ReportOutput = z.infer<typeof reportOutputSchema>;

export const reportListOutputSchema = z.object({
  reports: z.array(reportOutputSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
});
export type ReportListOutput = z.infer<typeof reportListOutputSchema>;

export const REPORT_FORMATS = ["pdf", "docx", "xlsx", "html", "json"] as const;
export type ReportFormat = (typeof REPORT_FORMATS)[number];

// ============================================================================
// Report API Request/Response Schemas
// ============================================================================

export const reportCreateBodySchema = z.object({
  title: z.string().min(1).max(512),
});
export type ReportCreateBody = z.infer<typeof reportCreateBodySchema>;

export const reportDeliveryBodySchema = z.object({
  recipientEmail: z.email().max(320),
  format: z.enum(["pdf", "docx", "xlsx"]),
  subject: z.string().min(1).max(512).optional(),
  completionWebhookUrl: z.string().url().max(2048).optional(),
});
export type ReportDeliveryBody = z.infer<typeof reportDeliveryBodySchema>;

export const deliveryWebhookBodySchema = z.object({
  tenantId: z.string().min(1).max(128),
  reportId: z.string().uuid().optional(),
  provider: z.enum(["resend", "sendgrid", "unknown"]).default("unknown"),
  event: z.enum(["delivered", "failed", "bounced", "complaint"]),
  recipientEmail: z.email().max(320).optional(),
  messageId: z.string().min(1).max(512).optional(),
  reason: z.string().min(1).max(2048).optional(),
  metadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
});
export type DeliveryWebhookBody = z.infer<typeof deliveryWebhookBodySchema>;

export const resendWebhookBodySchema = z.object({
  type: z.enum(["email.delivered", "email.bounced", "email.complained", "email.delivery_delayed"]),
  data: z.object({
    email_id: z.string().min(1).optional(),
    to: z.array(z.string().email()).optional(),
    created_at: z.string().optional(),
    reason: z.string().optional(),
    tags: z.record(z.string(), z.string()).optional(),
  }),
});
export type ResendWebhookBody = z.infer<typeof resendWebhookBodySchema>;

export const sendgridWebhookBodySchema = z.object({
  event: z.enum(["delivered", "bounce", "dropped", "spamreport"]),
  sg_message_id: z.string().optional(),
  email: z.string().email().optional(),
  reason: z.string().optional(),
  tenant_id: z.string().optional(),
  report_id: z.string().optional(),
});
export type SendgridWebhookBody = z.infer<typeof sendgridWebhookBodySchema>;

export const reportShareBodySchema = z.object({
  expiresInHours: z.number().int().min(1).max(720).optional().default(168),
});
export type ReportShareBody = z.infer<typeof reportShareBodySchema>;

export const reportCompareVersionsBodySchema = z.object({
  versionA: z.number().int().min(1),
  versionB: z.number().int().min(1),
});
export type ReportCompareVersionsBody = z.infer<typeof reportCompareVersionsBodySchema>;

export const reportRetentionBodySchema = z.object({
  retentionDays: z.number().int().min(1).max(3650),
});
export type ReportRetentionBody = z.infer<typeof reportRetentionBodySchema>;

// ============================================================================
// Report Delivery Webhook Event Types
// ============================================================================

export const REPORT_DELIVERY_EVENTS = ["delivered", "failed", "bounced", "complaint"] as const;
export type ReportDeliveryEvent = (typeof REPORT_DELIVERY_EVENTS)[number];

export const REPORT_DELIVERY_PROVIDERS = ["resend", "sendgrid", "unknown"] as const;
export type ReportDeliveryProvider = (typeof REPORT_DELIVERY_PROVIDERS)[number];

export const REPORT_DELIVERY_STATUS_CODES = [202, 400, 401, 403, 404, 429, 503] as const;
export type ReportDeliveryStatusCode = (typeof REPORT_DELIVERY_STATUS_CODES)[number];

// ============================================================================
// Report Role Constants
// ============================================================================

export const REPORT_READ_ROLES = ["analyst", "reports:read", "admin"] as const;
export type ReportReadRole = (typeof REPORT_READ_ROLES)[number];

export const REPORT_WRITE_ROLES = ["reports:write", "admin"] as const;
export type ReportWriteRole = (typeof REPORT_WRITE_ROLES)[number];

export const REPORT_SHARE_ROLES = ["admin", "reports:share", "reports:write"] as const;
export type ReportShareRole = (typeof REPORT_SHARE_ROLES)[number];
