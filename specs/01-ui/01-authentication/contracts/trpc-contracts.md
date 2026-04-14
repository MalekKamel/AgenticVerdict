# tRPC Contracts: Authentication

**Feature**: Authentication (Phase 01)  
**Version**: 1.0  
**Last Updated**: 2026-04-14

This document defines the tRPC procedure contracts (input/output schemas) for authentication-related API calls between the TanStack Start frontend and the tRPC v11 backend.

---

## Overview

All authentication procedures are exposed under the `auth` router:

```typescript
const authRouter = router({
  login,
  register,
  logout,
  getSession,
  verifyEmail,
  requestPasswordReset,
  confirmPasswordReset,
})
```

---

## Procedure: auth.login

**Description**: Authenticates a user with email and password, creates a session, and returns user data.

### Input Schema

```typescript
import { z } from 'zod'

export const loginInputSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(false),
})

export type LoginInput = z.infer<typeof loginInputSchema>
```

### Output Schema

```typescript
export const loginOutputSchema = z.object({
  success: z.boolean(),
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    firstName: z.string(),
    lastName: z.string(),
    emailVerified: z.boolean(),
    tenantId: z.string().uuid(),
  }),
  sessionExpiresAt: z.datetime(), // ISO 8601 datetime string
})

export type LoginOutput = z.infer<typeof loginOutputSchema>
```

### Error Responses

- `UNAUTHORIZED`: Invalid email or password
- `RATE_LIMIT_EXCEEDED`: Too many login attempts
- `EMAIL_NOT_VERIFIED`: Email address not verified (includes resend option)

### Example Usage

```typescript
// Frontend
const { data, error } = await trpc.auth.login.mutate({
  email: 'user@example.com',
  password: 'SecurePassword123!',
  rememberMe: true,
})
```

---

## Procedure: auth.register

**Description**: Registers a new user account and sends a verification email.

### Input Schema

```typescript
export const registerInputSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  tenantId: z.string().uuid().optional(), // For multi-tenant signup
})

export type RegisterInput = z.infer<typeof registerInputSchema>
```

### Output Schema

```typescript
export const registerOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(), // "Verification email sent to {email}"
  userId: z.string().uuid(),
})

export type RegisterOutput = z.infer<typeof registerOutputSchema>
```

### Error Responses

- `CONFLICT`: Email already exists
- `RATE_LIMIT_EXCEEDED`: Too many registration attempts
- `WEAK_PASSWORD`: Password doesn't meet strength requirements

### Example Usage

```typescript
// Frontend
const { data, error } = await trpc.auth.register.mutate({
  email: 'newuser@example.com',
  password: 'SecurePassword123!',
  firstName: 'John',
  lastName: 'Doe',
})
```

---

## Procedure: auth.logout

**Description**: Invalidates the current user session.

### Input Schema

```typescript
export const logoutInputSchema = z.object({
  // No input required - session identified via HTTP-only cookie
})

export type LogoutInput = z.infer<typeof logoutInputSchema>
```

### Output Schema

```typescript
export const logoutOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(), // "Logged out successfully"
})

export type LogoutOutput = z.infer<typeof logoutOutputSchema>
```

### Error Responses

- `UNAUTHORIZED`: No active session to logout

### Example Usage

```typescript
// Frontend
const { data } = await trpc.auth.logout.mutate()
```

---

## Procedure: auth.getSession

**Description**: Returns the current active session user data (used for session validation on route loaders).

### Input Schema

```typescript
export const getSessionInputSchema = z.object({
  // No input required - session identified via HTTP-only cookie
})

export type GetSessionInput = z.infer<typeof getSessionInputSchema>
```

### Output Schema

```typescript
export const getSessionOutputSchema = z.object({
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    firstName: z.string(),
    lastName: z.string(),
    emailVerified: z.boolean(),
    tenantId: z.string().uuid(),
  }).nullable(), // null if no active session
  sessionExpiresAt: z.datetime().nullable(),
})

export type GetSessionOutput = z.infer<typeof getSessionOutputSchema>
```

### Error Responses

- None (returns null user if no session)

### Example Usage

```typescript
// Frontend (in route loader)
const { data } = await trpc.auth.getSession.query()
if (!data.user) {
  throw redirect({ to: '/auth/login' })
}
```

---

## Procedure: auth.verifyEmail

**Description**: Verifies a user's email address using a token from the verification email.

### Input Schema

```typescript
export const verifyEmailInputSchema = z.object({
  token: z.string().min(1, 'Token is required'),
})

export type VerifyEmailInput = z.infer<typeof verifyEmailInputSchema>
```

### Output Schema

```typescript
export const verifyEmailOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(), // "Email verified successfully"
})

export type VerifyEmailOutput = z.infer<typeof verifyEmailOutputSchema>
```

### Error Responses

- `NOT_FOUND`: Invalid token
- `GONE`: Token expired (24 hour expiry)

### Example Usage

```typescript
// Frontend (in verify-email route loader)
const { data, error } = await trpc.auth.verifyEmail.mutate({
  token: searchParams.token,
})
```

---

## Procedure: auth.requestPasswordReset

**Description**: Initiates password reset flow by sending a reset link email.

### Input Schema

```typescript
export const requestPasswordResetInputSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export type RequestPasswordResetInput = z.infer<typeof requestPasswordResetInputSchema>
```

### Output Schema

```typescript
export const requestPasswordResetOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(), // Generic: "If an account exists, a reset link was sent"
})

export type RequestPasswordResetOutput = z.infer<typeof requestPasswordResetOutputSchema>
```

### Error Responses

- `RATE_LIMIT_EXCEEDED`: Too many password reset requests
- Note: Always returns success message (even for non-existent emails) to prevent email enumeration

### Example Usage

```typescript
// Frontend
const { data } = await trpc.auth.requestPasswordReset.mutate({
  email: 'user@example.com',
})
```

---

## Procedure: auth.confirmPasswordReset

**Description**: Sets a new password using a valid reset token.

### Input Schema

```typescript
export const confirmPasswordResetInputSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
})

export type ConfirmPasswordResetInput = z.infer<typeof confirmPasswordResetInputSchema>
```

### Output Schema

```typescript
export const confirmPasswordResetOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(), // "Password reset successfully"
})

export type ConfirmPasswordResetOutput = z.infer<typeof confirmPasswordResetOutputSchema>
```

### Error Responses

- `NOT_FOUND`: Invalid token
- `GONE`: Token expired (1 hour expiry)
- `BAD_REQUEST`: Token already used

### Example Usage

```typescript
// Frontend
const { data, error } = await trpc.auth.confirmPasswordReset.mutate({
  token: searchParams.token,
  newPassword: 'NewSecurePassword123!',
})
```

---

## Complete Router Definition

```typescript
// packages/api/src/routers/auth.router.ts
import { z } from 'zod'
import { router, publicProcedure } from '../trpc'
import {
  loginInputSchema,
  registerInputSchema,
  verifyEmailInputSchema,
  requestPasswordResetInputSchema,
  confirmPasswordResetInputSchema,
} from '@agenticverdict/types/auth'

export const authRouter = router({
  login: publicProcedure
    .input(loginInputSchema)
    .mutation(async ({ input, ctx }) => {
      // Implementation in backend
    }),

  register: publicProcedure
    .input(registerInputSchema)
    .mutation(async ({ input, ctx }) => {
      // Implementation in backend
    }),

  logout: publicProcedure
    .mutation(async ({ ctx }) => {
      // Implementation in backend
    }),

  getSession: publicProcedure
    .query(async ({ ctx }) => {
      // Implementation in backend
    }),

  verifyEmail: publicProcedure
    .input(verifyEmailInputSchema)
    .mutation(async ({ input, ctx }) => {
      // Implementation in backend
    }),

  requestPasswordReset: publicProcedure
    .input(requestPasswordResetInputSchema)
    .mutation(async ({ input, ctx }) => {
      // Implementation in backend
    }),

  confirmPasswordReset: publicProcedure
    .input(confirmPasswordResetInputSchema)
    .mutation(async ({ input, ctx }) => {
      // Implementation in backend
    }),
})
```

---

## Type Export for Frontend

```typescript
// packages/types/src/auth.ts
export { loginInputSchema, type LoginInput } from './auth/login'
export { registerInputSchema, type RegisterInput } from './auth/register'
export { verifyEmailInputSchema, type VerifyEmailInput } from './auth/verify-email'
export { requestPasswordResetInputSchema, type RequestPasswordResetInput } from './auth/request-password-reset'
export { confirmPasswordResetInputSchema, type ConfirmPasswordResetInput } from './auth/confirm-password-reset'
```

---

## Security Considerations

1. **All auth procedures** (except `getSession`) are `publicProcedure` - no authentication required to call them
2. **Session identification** via HTTP-only cookies passed from browser
3. **Rate limiting** enforced at procedure level (5 attempts per 15 minutes per IP)
4. **Token expiration**:
   - Email verification tokens: 24 hours
   - Password reset tokens: 1 hour
5. **Generic error messages** to prevent email enumeration
6. **Password requirements** enforced via Zod schema (8+ chars, uppercase, lowercase, number, special)

---

## Testing Contracts

### Contract Test Example (Vitest)

```typescript
// tests/contract/auth-contract.test.ts
import { describe, it, expect } from 'vitest'
import { loginInputSchema, registerInputSchema } from '@agenticverdict/types/auth'

describe('Auth Contracts', () => {
  describe('loginInputSchema', () => {
    it('should validate valid input', () => {
      const result = loginInputSchema.safeParse({
        email: 'user@example.com',
        password: 'SecurePassword123!',
        rememberMe: true,
      })
      expect(result.success).toBe(true)
    })

    it('should reject invalid email', () => {
      const result = loginInputSchema.safeParse({
        email: 'not-an-email',
        password: 'SecurePassword123!',
      })
      expect(result.success).toBe(false)
    })

    it('should reject missing password', () => {
      const result = loginInputSchema.safeParse({
        email: 'user@example.com',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('registerInputSchema', () => {
    it('should validate valid input', () => {
      const result = registerInputSchema.safeParse({
        email: 'newuser@example.com',
        password: 'SecurePassword123!',
        firstName: 'John',
        lastName: 'Doe',
      })
      expect(result.success).toBe(true)
    })

    it('should reject weak password', () => {
      const result = registerInputSchema.safeParse({
        email: 'newuser@example.com',
        password: 'weak',
        firstName: 'John',
        lastName: 'Doe',
      })
      expect(result.success).toBe(false)
    })
  })
})
```

---

**Document Status**: Draft  
**Last Updated**: 2026-04-14  
**Next Review**: After backend implementation
