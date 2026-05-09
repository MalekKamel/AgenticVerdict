import { z } from "zod";

export type ReportAuditAction =
  | "report.created"
  | "report.content_uploaded"
  | "report.archived"
  | "report.unarchived"
  | "report.retention_updated"
  | "report.versions_compared"
  | "report.retention_sweep"
  | "compliance.audit_viewed"
  | "compliance.summary_viewed";

export const reportAuditActionSchema = z.enum([
  "report.created",
  "report.content_uploaded",
  "report.archived",
  "report.unarchived",
  "report.retention_updated",
  "report.versions_compared",
  "report.retention_sweep",
  "compliance.audit_viewed",
  "compliance.summary_viewed",
]);

export interface ReportAuditEvent {
  id: string;
  tenantId: string;
  actorSub: string;
  action: ReportAuditAction;
  reportId?: string | undefined;
  at: string;
  requestId?: string | undefined;
  details?: Record<string, string | number | boolean> | undefined;
}

export const reportAuditEventSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  actorSub: z.string().min(1),
  action: reportAuditActionSchema,
  reportId: z.string().uuid().optional(),
  at: z.iso.datetime(),
  requestId: z.string().uuid().optional(),
  details: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
});

export type ReportAuditEventInput = z.input<typeof reportAuditEventSchema>;
export type ReportAuditEventOutput = z.output<typeof reportAuditEventSchema>;

export interface AuditTrailEvent {
  id: string;
  insightId: string;
  eventType: import("@agenticverdict/types").AuditEventType;
  status: "success" | "failed" | "pending";
  timestamp: string;
  duration?: number;
  metadata?: Record<string, unknown>;
}

export const auditTrailEventSchema = z.object({
  id: z.string().uuid(),
  insightId: z.string().uuid(),
  eventType: z.string(),
  status: z.enum(["success", "failed", "pending"]),
  timestamp: z.iso.datetime(),
  duration: z.number().int().nonnegative().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});
