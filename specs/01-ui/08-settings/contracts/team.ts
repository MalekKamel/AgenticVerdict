/**
 * Team Management Contract
 *
 * Defines the tRPC router contract for team management operations.
 * All procedures require authentication and admin role.
 *
 * Router Path: settings.team
 */

import { z } from 'zod'

/**
 * Schemas
 */

export const TeamMemberRoleSchema = z.enum(['admin', 'analyst', 'viewer'])
export type TeamMemberRole = z.infer<typeof TeamMemberRoleSchema>

export const TeamMemberStatusSchema = z.enum(['active', 'pending', 'inactive'])
export type TeamMemberStatus = z.infer<typeof TeamMemberStatusSchema>

export const InviteTeamMemberSchema = z.object({
  email: z.string().email('Invalid email format'),
  role: TeamMemberRoleSchema,
})

export type InviteTeamMemberInput = z.infer<typeof InviteTeamMemberSchema>

export const UpdateTeamMemberRoleSchema = z.object({
  memberId: z.string().uuid('Invalid member ID'),
  role: TeamMemberRoleSchema,
})

export type UpdateTeamMemberRoleInput = z.infer<typeof UpdateTeamMemberRoleSchema>

export const TeamMemberSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  tenantId: z.string().uuid(),
  name: z.string().nullable(), // null for pending invitations
  email: z.string(),
  role: TeamMemberRoleSchema,
  status: TeamMemberStatusSchema,
  invitedBy: z.string().uuid(),
  joinedAt: z.date().nullable(),
  createdAt: z.date(),
})

export type TeamMember = z.infer<typeof TeamMemberSchema>

export const TeamInvitationSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  email: z.string().email(),
  role: TeamMemberRoleSchema,
  invitedBy: z.string().uuid(),
  expiresAt: z.date(),
  createdAt: z.date(),
})

export type TeamInvitation = z.infer<typeof TeamInvitationSchema>

/**
 * Router Contract
 */

export interface TeamRouterContract {
  /**
   * List team members
   *
   * Returns all team members for the current tenant, including pending
   * invitations. Requires admin role.
   *
   * @query - No input required
   * @returns {TeamMember[]} Array of team members
   *
   * Errors:
   * - UNAUTHORIZED: User not authenticated
   * - FORBIDDEN: User does not have admin role
   */
  list: {
    input: z.object({}),
    output: z.array(TeamMemberSchema)
  }

  /**
   * Invite team member
   *
   * Sends an invitation email to the specified email address. The invitee
   * can accept the invitation to join the team with the assigned role.
   * Invitations expire after 7 days.
   *
   * Requires admin role.
   *
   * @mutation - Invitation data (email, role)
   * @returns {success: boolean, invitationId: string, expiresAt: Date} Operation result
   *
   * Errors:
   * - UNAUTHORIZED: User not authenticated
   * - FORBIDDEN: User does not have admin role
   * - BAD_REQUEST: Validation error (e.g., invalid email)
   * - CONFLICT: User already a team member or has pending invitation
   * - TOO_MANY_REQUESTS: Rate limit exceeded (max 10 invitations per hour)
   */
  invite: {
    input: InviteTeamMemberSchema
    output: z.object({
      success: z.boolean(),
      invitationId: z.string().uuid(),
      expiresAt: z.date(),
    })
  }

  /**
   * Update team member role
   *
   * Changes the role of an existing team member. Cannot change your own
   * role if you're the only admin (prevents locking yourself out).
   *
   * Requires admin role.
   *
   * @mutation - Member ID and new role
   * @returns {success: boolean} Operation result
   *
   * Errors:
   * - UNAUTHORIZED: User not authenticated
   * - FORBIDDEN: User does not have admin role
   * - BAD_REQUEST: Attempting to change own role when only admin
   * - NOT_FOUND: Team member not found
   */
  updateRole: {
    input: UpdateTeamMemberRoleSchema
    output: z.object({
      success: z.boolean(),
    })
  }

  /**
   * Remove team member
   *
   * Removes a team member from the organization. Cannot remove yourself
   * if you're the only admin (prevents locking yourself out).
   *
   * Requires admin role.
   *
   * @mutation - Member ID to remove
   * @returns {success: boolean} Operation result
   *
   * Errors:
   * - UNAUTHORIZED: User not authenticated
   * - FORBIDDEN: User does not have admin role
   * - BAD_REQUEST: Attempting to remove self when only admin
   * - NOT_FOUND: Team member not found
   */
  remove: {
    input: z.object({
      memberId: z.string().uuid('Invalid member ID'),
    })
    output: z.object({
      success: z.boolean(),
    })
  }

  /**
   * Resend invitation
   *
   * Resends the invitation email for a pending team member. Invalidates
   * the old invitation link and creates a new one with updated expiration.
   *
   * Requires admin role.
   *
   * @mutation - Member ID (must be pending status)
   * @returns {success: boolean, expiresAt: Date} Operation result with new expiration
   *
   * Errors:
   * - UNAUTHORIZED: User not authenticated
   * - FORBIDDEN: User does not have admin role
   * - BAD_REQUEST: Member is not in pending status
   * - NOT_FOUND: Team member not found
   */
  resendInvitation: {
    input: z.object({
      memberId: z.string().uuid('Invalid member ID'),
    })
    output: z.object({
      success: z.boolean(),
      expiresAt: z.date(),
    })
  }

  /**
   * Cancel invitation
   *
   * Cancels a pending team member invitation. The invitation link becomes
   * invalid and the invitee cannot join using that link.
   *
   * Requires admin role.
   *
   * @mutation - Member ID (must be pending status)
   * @returns {success: boolean} Operation result
   *
   * Errors:
   * - UNAUTHORIZED: User not authenticated
   * - FORBIDDEN: User does not have admin role
   * - BAD_REQUEST: Member is not in pending status
   * - NOT_FOUND: Team member not found
   */
  cancelInvitation: {
    input: z.object({
      memberId: z.string().uuid('Invalid member ID'),
    })
    output: z.object({
      success: z.boolean(),
    })
  }

  /**
   * Get team statistics
   *
   * Returns team statistics including member count by role, active vs pending
   * members, and seat usage vs plan limits.
   *
   * Requires admin role.
   *
   * @query - No input required
   * @returns {stats: TeamStats} Team statistics
   *
   * Errors:
   * - UNAUTHORIZED: User not authenticated
   * - FORBIDDEN: User does not have admin role
   */
  getStats: {
    input: z.object({})
    output: z.object({
      totalMembers: z.number(),
      activeMembers: z.number(),
      pendingInvitations: z.number(),
      membersByRole: z.record(TeamMemberRoleSchema, z.number()),
      seatsUsed: z.number(),
      seatsLimit: z.number(),
      canInviteMore: z.boolean(),
    })
  }
}

/**
 * Implementation Notes
 *
 * 1. Role Permissions:
 *    - admin: Full access including team management, billing, settings
 *    - analyst: Can create/edit insights, view reports, manage connectors
 *    - viewer: Read-only access to dashboards and reports
 *
 * 2. Invitation Flow:
 *    - Invitation sent via email with unique token
 *    - Link redirects to signup/login with invitation token
 *    - Upon acceptance, user account created (if new) and added to team
 *    - Invitation expires after 7 days
 *    - Admin can resend or cancel invitations
 *
 * 3. Safety Checks:
 *    - Cannot remove own account if only admin
 *    - Cannot change own role if only admin
 *    - These checks prevent accidental lockout
 *
 * 4. Tenant Isolation:
 *    - All queries scoped to current tenant
 *    - Row-level security enforced at database level
 *    - Users can only manage their own team members
 *
 * 5. Audit Logging:
 *    - Log all team management actions (invite, update role, remove)
 *    - Include timestamp, admin user, target user, action type
 *    - Use auditConfigChange from @agenticverdict/database
 *
 * 6. Seat Limits:
 *    - Check plan limits before inviting new members
 *    - Return canInviteMore flag in getStats
 *    - Enforce limits at API level
 */
