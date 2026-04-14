/**
 * Profile Settings Contract
 *
 * Defines the tRPC router contract for user profile settings operations.
 * All procedures are protected and require authentication.
 *
 * Router Path: settings.profile
 */

import { z } from 'zod'

/**
 * Schemas
 */

export const ProfileUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  email: z.string().email('Invalid email format'),
  language: z.enum(['en', 'ar', 'fr'], {
    errorMap: () => ({ message: 'Language must be one of: en, ar, fr' })
  }),
  timezone: z.string().min(1, 'Timezone is required'),
})

export type ProfileUpdateInput = z.infer<typeof ProfileUpdateSchema>

export const UserProfileSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  tenantId: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  language: z.enum(['en', 'ar', 'fr']),
  timezone: z.string(),
  emailVerified: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export type UserProfile = z.infer<typeof UserProfileSchema>

/**
 * Router Contract
 */

export interface ProfileRouterContract {
  /**
   * Get current user's profile
   *
   * Returns the authenticated user's profile information including
   * name, email, language preference, and timezone.
   *
   * @query - No input required
   * @returns {UserProfile} User profile data
   *
   * Errors:
   * - UNAUTHORIZED: User not authenticated
   * - NOT_FOUND: Profile not found (should auto-create)
   */
  get: {
    input: z.object({})
    output: UserProfileSchema
  }

  /**
   * Update user profile
   *
   * Updates the authenticated user's profile information. If the email
   * changes, a verification email is sent and the email is marked as
   * unverified until confirmed.
   *
   * Language changes trigger immediate RTL/LTR layout switch on the
   * frontend by invalidating the user query and forcing route reload.
   *
   * @mutation - Profile update data
   * @returns {success: boolean} Operation result
   *
   * Errors:
   * - UNAUTHORIZED: User not authenticated
   * - BAD_REQUEST: Validation error (see error message for details)
   * - CONFLICT: Email already exists (different user)
   */
  update: {
    input: ProfileUpdateSchema
    output: z.object({
      success: z.boolean(),
      emailVerificationRequired: z.boolean().optional(),
    })
  }

  /**
   * Request email verification
   *
   * Sends a verification email to the user's current email address.
   * Used when the previous verification link expired or was lost.
   *
   * @mutation - No input required
   * @returns {success: boolean, expiresAt: Date} Operation result with expiration
   *
   * Errors:
   * - UNAUTHORIZED: User not authenticated
   * - TOO_MANY_REQUESTS: Rate limit exceeded (max 3 per hour)
   */
  sendEmailVerification: {
    input: z.object({})
    output: z.object({
      success: z.boolean(),
      expiresAt: z.date(),
    })
  }

  /**
   * Verify email address
   *
   * Verifies the user's email address using a token from the verification
   * email. This procedure is typically called from a link in the email.
   *
   * @mutation - Verification token
   * @returns {success: boolean} Operation result
   *
   * Errors:
   * - BAD_REQUEST: Invalid token
   * - UNAUTHORIZED: Token expired or already used
   */
  verifyEmail: {
    input: z.object({
      token: z.string().min(1, 'Token is required'),
    })
    output: z.object({
      success: z.boolean(),
    })
  }
}

/**
 * Implementation Notes
 *
 * 1. Language Change Handling:
 *    - When language changes from LTR to AR (or vice versa), the frontend
 *      must invalidate the user query and reload the route to apply the
 *      new layout direction.
 *    - Use: queryClient.invalidateQueries([['user']]); router.invalidate();
 *
 * 2. Email Verification Flow:
 *    - If email changes, send verification email and set emailVerified = false
 *    - User cannot log in with unverified email (optional, depends on policy)
 *    - Verification tokens expire after 24 hours
 *    - Old tokens are invalidated when new token is generated
 *
 * 3. Tenant Isolation:
 *    - All queries use dbScoped() wrapper for tenant context
 *    - Row-level security enforced at database level
 *    - Users can only access their own profile (not other users)
 *
 * 4. Audit Logging:
 *    - Log all profile updates (especially email changes)
 *    - Include timestamp, IP address, and changed fields
 *    - Use auditConfigChange from @agenticverdict/database
 */
