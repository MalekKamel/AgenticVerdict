/**
 * Notification Preferences Contract
 *
 * Defines the tRPC router contract for notification settings operations.
 * All procedures are protected and require authentication.
 *
 * Router Path: settings.notifications
 */

import { z } from 'zod'

/**
 * Schemas
 */

export const NotificationChannelSchema = z.enum(['email', 'in_app'])
export type NotificationChannel = z.infer<typeof NotificationChannelSchema>

export const DigestFrequencySchema = z.enum(['immediate', 'hourly', 'daily', 'weekly'])
export type DigestFrequency = z.infer<typeof DigestFrequencySchema>

export const NotificationTypeSchema = z.enum(['insights', 'reports', 'alerts', 'team', 'billing'])
export type NotificationType = z.infer<typeof NotificationTypeSchema>

export const NotificationPreferencesUpdateSchema = z.object({
  // Channel preferences
  emailEnabled: z.boolean().default(true),
  inAppEnabled: z.boolean().default(true),

  // Frequency settings
  digestFrequency: DigestFrequencySchema.default('immediate'),

  // Quiet hours (optional - if not set, no quiet hours)
  quietHoursEnabled: z.boolean().default(false),
  quietHoursStart: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)').optional(),
  quietHoursEnd: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)').optional(),

  // Per-type preferences
  typePreferences: z.record(NotificationTypeSchema, z.boolean()).default({
    insights: true,
    reports: true,
    alerts: true,
    team: true,
    billing: true,
  }),
})

export type NotificationPreferencesUpdateInput = z.infer<typeof NotificationPreferencesUpdateSchema>

export const NotificationPreferencesSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  tenantId: z.string().uuid(),

  // Channel preferences
  emailEnabled: z.boolean(),
  inAppEnabled: z.boolean(),

  // Frequency
  digestFrequency: DigestFrequencySchema,

  // Quiet hours
  quietHoursStart: z.string().nullable(),
  quietHoursEnd: z.string().nullable(),

  // Per-type preferences
  typePreferences: z.record(NotificationTypeSchema, z.boolean()),

  createdAt: z.date(),
  updatedAt: z.date(),
})

export type NotificationPreferences = z.infer<typeof NotificationPreferencesSchema>

/**
 * Router Contract
 */

export interface NotificationRouterContract {
  /**
   * Get user's notification preferences
   *
   * Returns the authenticated user's notification preferences including
   * enabled channels, digest frequency, quiet hours, and per-type settings.
   *
   * @query - No input required
   * @returns {NotificationPreferences} User notification preferences
   *
   * Errors:
   * - UNAUTHORIZED: User not authenticated
   * - NOT_FOUND: Preferences not found (should auto-create with defaults)
   */
  get: {
    input: z.object({})
    output: NotificationPreferencesSchema
  }

  /**
   * Update notification preferences
   *
   * Updates the authenticated user's notification preferences. Changes take
   * effect immediately (within 5 seconds for cached preferences).
   *
   * If all channels are disabled, a warning is returned but the operation
   * succeeds (user's choice to receive no notifications).
   *
   * @mutation - Notification preferences update data
   * @returns {success: boolean, warning?: string} Operation result with optional warning
   *
   * Errors:
   * - UNAUTHORIZED: User not authenticated
   * - BAD_REQUEST: Validation error (e.g., invalid time format)
   */
  update: {
    input: NotificationPreferencesUpdateSchema
    output: z.object({
      success: z.boolean(),
      warning: z.string().optional(),
    })
  }

  /**
   * Send test notification
   *
   * Sends a test notification to verify notification delivery. Tests both
   * email and in-app channels if enabled.
   *
   * @mutation - No input required
   * @returns {success: boolean, channels: string[]} Operation result with tested channels
   *
   * Errors:
   * - UNAUTHORIZED: User not authenticated
   * - TOO_MANY_REQUESTS: Rate limit exceeded (max 5 per hour)
   */
  sendTest: {
    input: z.object({
      channel: NotificationChannelSchema.optional(),
    })
    output: z.object({
      success: z.boolean(),
      channels: z.array(NotificationChannelSchema),
    })
  }

  /**
   * Get notification history
   *
   * Returns recent notifications sent to the user, including delivery
   * status and timestamps. Useful for debugging notification issues.
   *
   * @query - Pagination parameters
   * @returns {notifications: NotificationHistoryItem[], total: number} Notification history
   *
   * Errors:
   * - UNAUTHORIZED: User not authenticated
   */
  getHistory: {
    input: z.object({
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
    })
    output: z.object({
      notifications: z.array(z.object({
        id: z.string().uuid(),
        type: NotificationTypeSchema,
        channel: NotificationChannelSchema,
        status: z.enum(['pending', 'sent', 'delivered', 'failed']),
        subject: z.string(),
        sentAt: z.date(),
        error: z.string().nullable(),
      })),
      total: z.number(),
    })
  }
}

/**
 * Implementation Notes
 *
 * 1. Digest Frequency:
 *    - immediate: Send each notification individually
 *    - hourly: Batch notifications and send hourly
 *    - daily: Batch notifications and send daily at 9 AM user time
 *    - weekly: Batch notifications and send weekly on Monday at 9 AM user time
 *
 * 2. Quiet Hours:
 *    - If current time is within quiet hours, notifications are queued
 *    - Queued notifications are delivered after quiet hours end
 *    - Urgent alerts (system-level) may bypass quiet hours
 *
 * 3. Type Preferences:
 *    - Each notification type can be enabled/disabled independently
 *    - Default: all types enabled
 *    - Type preferences are AND with channel preferences (both must be true)
 *
 * 4. Delivery Implementation:
 *    - Use BullMQ jobs for background notification delivery
 *    - Store notification history in notification_history table
 *    - Implement retry logic with exponential backoff for failed notifications
 *    - Track delivery status (pending → sent → delivered/failed)
 *
 * 5. Caching:
 *    - Cache preferences for 5 minutes to avoid frequent DB queries
 *    - Invalidate cache on update
 *    - Use tenant context + user ID as cache key
 */
