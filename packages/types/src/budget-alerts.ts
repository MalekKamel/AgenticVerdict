import { z } from "zod";
import { syncFrequencySchema } from "./connector-types";

export const alertTypeSchema = z.enum(["threshold", "percentage", "rate"]);
export const alertThresholdTypeSchema = z.enum(["cost", "tokens", "requests"]);
export const alertStatusSchema = z.enum(["active", "paused", "triggered"]);
export const notificationTypeSchema = z.enum(["email", "webhook", "slack"]);

export const notificationChannelSchema = z.object({
  id: z.string().uuid().optional(),
  type: notificationTypeSchema,
  target: z.string(),
  isEnabled: z.boolean().default(true),
});

export const budgetAlertMetadataSchema = z.record(z.string(), z.unknown()).optional();

/**
 * Budget alert configuration
 */
export interface BudgetAlert {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  type: "threshold" | "percentage" | "rate";
  threshold: number;
  thresholdType: "cost" | "tokens" | "requests";
  timeWindow: "hourly" | "daily" | "weekly" | "monthly";
  status: "active" | "paused" | "triggered";
  notifications: NotificationChannel[];
  lastTriggeredAt?: Date;
  triggerCount: number;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

export const createBudgetAlertSchema = z.object({
  name: z.string().min(1).max(128),
  description: z.string().max(512).optional(),
  type: alertTypeSchema,
  threshold: z.number().positive(),
  thresholdType: alertThresholdTypeSchema,
  timeWindow: syncFrequencySchema,
  notifications: z.array(notificationChannelSchema).min(1),
});

export const updateBudgetAlertSchema = createBudgetAlertSchema.partial();

/**
 * Alert trigger input (internal use)
 */
export const alertTriggerSchema = z.object({
  alertId: z.string().uuid(),
  currentValue: z.number(),
  thresholdValue: z.number(),
  triggeredAt: z.iso.datetime(),
});

// Type exports
export type AlertType = z.infer<typeof alertTypeSchema>;
export type AlertThresholdType = z.infer<typeof alertThresholdTypeSchema>;
// AlertTimeWindow is re-exported from connector-types as SyncFrequency
export type AlertStatus = z.infer<typeof alertStatusSchema>;
export type NotificationType = z.infer<typeof notificationTypeSchema>;
export type NotificationChannel = z.infer<typeof notificationChannelSchema>;
export type BudgetAlertMetadata = z.infer<typeof budgetAlertMetadataSchema>;
export type CreateBudgetAlert = z.infer<typeof createBudgetAlertSchema>;
export type UpdateBudgetAlert = z.infer<typeof updateBudgetAlertSchema>;

// ============================================================================
// Alert Output Schema (moved from apps/api/src/trpc/routers/budget-alerts.ts)
// ============================================================================

export const alertOutputSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  type: alertTypeSchema,
  threshold: z.number(),
  thresholdType: alertThresholdTypeSchema,
  timeWindow: syncFrequencySchema,
  status: alertStatusSchema,
  notifications: z.array(
    z.object({
      id: z.string().uuid().optional(),
      type: z.string(),
      target: z.string(),
      isEnabled: z.boolean(),
    }),
  ),
  lastTriggeredAt: z.date().nullable(),
  lastEvaluatedAt: z.date().nullable(),
  lastEvaluatedValue: z.number().nullable(),
  triggerCount: z.number().int(),
  cooldownMinutes: z.number().int(),
  createdById: z.string().uuid().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type AlertOutput = z.infer<typeof alertOutputSchema>;

// Input schemas for router
export const createAlertInputSchema = z.object({
  name: z.string().min(1).max(128),
  description: z.string().max(512).optional(),
  type: alertTypeSchema,
  threshold: z.number().positive(),
  thresholdType: alertThresholdTypeSchema,
  timeWindow: syncFrequencySchema,
  notifications: z.array(notificationChannelSchema).min(1),
});
export type CreateAlertInput = z.infer<typeof createAlertInputSchema>;

export const updateAlertInputSchema = createAlertInputSchema.partial().extend({
  alertId: z.string().uuid(),
});
export type UpdateAlertInput = z.infer<typeof updateAlertInputSchema>;

export const getAlertInputSchema = z.object({ alertId: z.string().uuid() });
export type GetAlertInput = z.infer<typeof getAlertInputSchema>;

export const toggleAlertInputSchema = z.object({
  alertId: z.string().uuid(),
  status: alertStatusSchema.exclude(["triggered"]),
});
export type ToggleAlertInput = z.infer<typeof toggleAlertInputSchema>;

export interface BudgetAlertConfig {
  tenantId: string;
  name: string;
  description?: string;
  type: "threshold" | "percentage" | "rate";
  threshold: number;
  thresholdType: "cost" | "tokens" | "requests";
  timeWindow: "hourly" | "daily" | "weekly" | "monthly";
  notifications: Array<{
    id?: string;
    type: "email" | "webhook" | "slack";
    target: string;
    isEnabled: boolean;
  }>;
  cooldownMinutes?: number;
  metadata?: Record<string, unknown>;
}

export interface AlertCheckResult {
  currentSpending: number;
  threshold: number;
  usagePercentage: number;
  thresholdExceeded: boolean;
  alertsSent: AlertNotification[];
}

export interface AlertNotification {
  id: string;
  alertId: string;
  channel: string;
  recipient: string;
  status: "sent" | "failed" | "pending";
  timestamp: Date;
  errorMessage?: string;
}
