/**
 * Connector Types
 *
 * Shared TypeScript types and Zod schemas for connector management.
 * Used by both frontend and backend for type safety.
 */

import { z } from "zod";

/** Supported connector platforms. */
export type ConnectorType = "meta" | "ga4" | "gsc" | "gbp" | "tiktok";

export const connectorTypeSchema = z.enum(["meta", "ga4", "gsc", "gbp", "tiktok"]);

/** Connector status values. */
export const connectorStatusSchema = z.enum(["healthy", "warning", "error", "inactive", "syncing"]);

export type ConnectorStatus = z.infer<typeof connectorStatusSchema>;

/** Sync history entry status. */
export const syncStatusSchema = z.enum(["success", "warning", "error"]);

export type SyncStatus = z.infer<typeof syncStatusSchema>;

/** Connector list item. */
export const connectorListItemSchema = z.object({
  id: z.string().uuid(),
  platform: connectorTypeSchema,
  name: z.string(),
  status: connectorStatusSchema,
  domain: z.string().nullable(),
  lastSyncAt: z.string().nullable(),
  lastSyncStatus: syncStatusSchema.nullable(),
  metricsCount: z.number().int().default(0),
});

export type ConnectorListItem = z.infer<typeof connectorListItemSchema>;

/** Connector list input. */
export const connectorListInputSchema = z.object({
  status: connectorStatusSchema.optional(),
  domain: z.string().optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

export type ConnectorListInput = z.infer<typeof connectorListInputSchema>;

/** Connector list output. */
export const connectorListOutputSchema = z.object({
  items: z.array(connectorListItemSchema),
  total: z.number().int(),
  page: z.number().int(),
  pageSize: z.number().int(),
});

export type ConnectorListOutput = z.infer<typeof connectorListOutputSchema>;

/** Sync history entry. */
export const syncHistoryEntrySchema = z.object({
  id: z.string().uuid(),
  status: syncStatusSchema,
  records: z.number().int().nullable(),
  message: z.string().nullable(),
  startedAt: z.string(),
  completedAt: z.string().nullable(),
});

export type SyncHistoryEntry = z.infer<typeof syncHistoryEntrySchema>;

/** Connector detail output. */
export const connectorDetailOutputSchema = z.object({
  id: z.string().uuid(),
  platform: connectorTypeSchema,
  name: z.string(),
  status: connectorStatusSchema,
  domain: z.string().nullable(),
  config: z.record(z.unknown()),
  metrics: z.array(z.string()),
  syncFrequency: z.string().nullable(),
  retentionDays: z.number().int().nullable(),
  notifications: z.record(z.boolean()),
  advancedOptions: z.record(z.unknown()),
  lastSyncAt: z.string().nullable(),
  nextSyncAt: z.string().nullable(),
  lastSyncStatus: syncStatusSchema.nullable(),
  lastSyncRecords: z.number().int().nullable(),
  paused: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  syncHistory: z.array(syncHistoryEntrySchema).default([]),
  recentData: z
    .array(z.object({ metric: z.string(), value: z.number(), delta: z.number() }))
    .default([]),
  activeMetrics: z.array(z.string()).default([]),
  issues: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        description: z.string(),
        severity: z.enum(["warning", "error"]),
        actionLabel: z.string().nullable(),
        actionHref: z.string().nullable(),
      }),
    )
    .default([]),
});

export type ConnectorDetailOutput = z.infer<typeof connectorDetailOutputSchema>;

/** Connector create input. */
export const connectorCreateInputSchema = z.object({
  platform: connectorTypeSchema,
  name: z.string().min(1).max(255),
  domain: z.string().max(255).optional(),
  config: z.record(z.unknown()).default({}),
  metrics: z.array(z.string()).default([]),
  syncFrequency: z.string().optional(),
  retentionDays: z.number().int().optional(),
  notifications: z.record(z.boolean()).default({}),
  advancedOptions: z.record(z.unknown()).default({}),
});

export type ConnectorCreateInput = z.infer<typeof connectorCreateInputSchema>;

/** Connector create output. */
export const connectorCreateOutputSchema = z.object({
  id: z.string().uuid(),
  success: z.boolean(),
});

export type ConnectorCreateOutput = z.infer<typeof connectorCreateOutputSchema>;

/** Connector update input. */
export const connectorUpdateInputSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255).optional(),
  domain: z.string().max(255).optional(),
  config: z.record(z.unknown()).optional(),
  metrics: z.array(z.string()).optional(),
  syncFrequency: z.string().optional(),
  retentionDays: z.number().int().optional(),
  notifications: z.record(z.boolean()).optional(),
  advancedOptions: z.record(z.unknown()).optional(),
});

export type ConnectorUpdateInput = z.infer<typeof connectorUpdateInputSchema>;

/** Connector update output. */
export const connectorUpdateOutputSchema = z.object({
  success: z.boolean(),
});

export type ConnectorUpdateOutput = z.infer<typeof connectorUpdateOutputSchema>;

/** Connector delete input. */
export const connectorDeleteInputSchema = z.object({
  id: z.string().uuid(),
  pause: z.boolean().default(false),
});

export type ConnectorDeleteInput = z.infer<typeof connectorDeleteInputSchema>;

/** Connector delete output. */
export const connectorDeleteOutputSchema = z.object({
  success: z.boolean(),
});

export type ConnectorDeleteOutput = z.infer<typeof connectorDeleteOutputSchema>;

/** Manual sync trigger input. */
export const connectorSyncInputSchema = z.object({
  id: z.string().uuid(),
});

export type ConnectorSyncInput = z.infer<typeof connectorSyncInputSchema>;

/** Manual sync trigger output. */
export const connectorSyncOutputSchema = z.object({
  success: z.boolean(),
  syncId: z.string().uuid(),
});

export type ConnectorSyncOutput = z.infer<typeof connectorSyncOutputSchema>;

/** Platform info for add wizard. */
export const platformInfoSchema = z.object({
  id: connectorTypeSchema,
  name: z.string(),
  description: z.string(),
  domains: z.array(z.string()),
  comingSoon: z.boolean().default(false),
});

export type PlatformInfo = z.infer<typeof platformInfoSchema>;

/** Connector test input. */
export const connectorTestInputSchema = z.object({
  id: z.string().uuid(),
});

export type ConnectorTestInput = z.infer<typeof connectorTestInputSchema>;

/** Connector test output. */
export const connectorTestOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  severity: z.enum(["success", "warning", "error"]),
});

export type ConnectorTestOutput = z.infer<typeof connectorTestOutputSchema>;

/** Affected insight during removal. */
export const affectedInsightSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
});

export type AffectedInsight = z.infer<typeof affectedInsightSchema>;

/** Removal preview output. */
export const connectorRemovalPreviewSchema = z.object({
  connector: z.object({
    id: z.string().uuid(),
    name: z.string(),
    platform: connectorTypeSchema,
  }),
  impacts: z.array(z.string()),
  affectedInsights: z.array(affectedInsightSchema),
  dataRetentionDays: z.number().int(),
});

export type ConnectorRemovalPreview = z.infer<typeof connectorRemovalPreviewSchema>;
