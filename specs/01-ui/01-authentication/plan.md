# Implementation Plan: Authentication

**Branch**: `01-ui-authentication` | **Date**: 2026-04-14 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/01-ui/01-authentication/spec.md`

---

## Summary

Phase 01 (Authentication) implements the complete user authentication flow for AgenticVerdict using TanStack Start file-based routing, Mantine v9 form components, and tRPC v11 mutations. This includes login, registration with email verification, password reset (request + confirm), auth layout wrapper, comprehensive error handling, and full WCAG 2.1 AA accessibility with RTL/LTR support for multi-language authentication.

**Primary Requirements**: Enable secure user authentication with email verification, password reset, and accessible, internationalized auth pages that serve as the entry point for all platform features.

**Technical Approach**: 
- TanStack Start with file-based routing (`routes/auth/login.tsx`, `routes/auth/register.tsx`, etc.)
- Mantine v9 form components with `@mantine/form` for validation
- tRPC v11 mutations for server-side authentication procedures
- TanStack Store (`@tanstack/store`) for client-side auth state management
- TanStack Router i18n for multi-language support with automatic RTL/LTR layout
- Server-side session management via HTTP-only cookies (no tokens in localStorage)
- Playwright for E2E testing of critical auth flows
- Vitest for unit testing of components and hooks

---

## Technical Context

**Language/Version**: TypeScript 5.3+ (strict mode), React 19+  
**Primary Dependencies**: TanStack Start, Mantine v9, tRPC v11, TanStack Store  
**Storage**: PostgreSQL 16 (via tRPC API layer - not directly accessed by frontend)  
**Testing**: Playwright (E2E), Vitest (unit), @axe-core/playwright (accessibility)  
**Target Platform**: Web browsers (Chrome, Firefox, Safari, Edge - current and previous 2 versions), Mobile browsers (iOS Safari, Chrome Mobile)  
**Project Type**: Web application (TanStack Start with file-based routing)  
**Performance Goals**: <1.5s page load on 3G, <2s form submission, <300KB initial bundle gzipped  
**Constraints**: WCAG 2.1 AA compliance required, zero `any` types, no hardcoded company logic, all strings externalized for i18n  
**Scale/Scope**: 7 routes (login, register, verify-email, forgot-password, reset-password, auth layout wrapper), 10+ form components, 5+ custom hooks, 70%+ test coverage target (80%+ for auth logic)

---

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

✅ **Type Safety**: All components use TypeScript strict mode, Zod schemas for validation, tRPC for end-to-end type safety  
✅ **Multi-Tenancy**: Auth operations are tenant-aware via tRPC context, user sessions include tenantId  
✅ **Configuration-Driven**: Auth flows inject company branding via design tokens, no hardcoded company-specific logic  
✅ **Accessibility**: WCAG 2.1 AA compliance is non-negotiable, all forms tested with axe-core and screen readers  
✅ **Internationalization**: RTL/LTR support from day one, all strings externalized, locale-aware date/currency formatting  
✅ **Performance**: Bundle size budgets enforced, route-based code splitting automatic with TanStack Start  
✅ **Testing**: 70%+ coverage target (80%+ for auth logic), E2E tests for critical user journeys  

---

## Project Structure

### Documentation (this feature)

```text
specs/01-ui/01-authentication/
├── plan.md              # This file
├── spec.md              # Feature specification with user stories
├── tasks.md             # Implementation tasks (to be generated via /speckit.tasks)
├── contracts/           # tRPC procedure schemas (input/output Zod schemas)
└── checklists/          # Pre-flight and completion checklists
```

### Source Code (monorepo)

```text
apps/web/
├── routes/
│   ├── __root.tsx              # Root layout with providers
│   ├── index.tsx               # Landing page (redirects if authenticated)
│   ├── dashboard.tsx           # Protected dashboard route
│   └── auth/
│       ├── __root.tsx          # Auth layout wrapper
│       ├── login.tsx           # Login page
│       ├── register.tsx        # Registration page
│       ├── verify-email.tsx    # Email verification confirmation page
│       ├── forgot-password.tsx # Password reset request page
│       └── reset-password.tsx  # Password reset confirm page
├── stores/
│   └── auth-store.ts           # TanStack Store for auth state
├── hooks/
│   ├── useAuth.ts              # Auth state and operations hook
│   ├── useLoginMutation.ts     # Login tRPC mutation wrapper
│   ├── useRegisterMutation.ts  # Register tRPC mutation wrapper
│   ├── usePasswordReset.ts     # Password reset mutations wrapper
│   └── useRequireAuth.ts       # Protected route guard hook
├── components/
│   ├── auth/
│   │   ├── AuthLayout.tsx      # Auth layout wrapper component
│   │   ├── LoginForm.tsx       # Login form component
│   │   ├── RegisterForm.tsx    # Registration form component
│   │   ├── ForgotPasswordForm.tsx      # Password reset request form
│   │   ├── ResetPasswordForm.tsx       # Password reset confirm form
│   │   ├── PasswordInput.tsx   # Password input with visibility toggle and strength meter
│   │   ├── AuthError.tsx       # Error display component
│   │   └── AuthSuccess.tsx     # Success message component
│   └── ui/                     # Base UI components from Phase 00-foundation
│       ├── AppTextInput.tsx
│       ├── AppButton.tsx
│       └── AppCard.tsx
├── lib/
│   ├── validations/
│   │   ├── auth.ts             # Auth form validation schemas
│   │   └── password.ts         # Password strength validation
│   └── utils/
│       ├── accessibility.ts    # ARIA utilities, focus management
│       └── i18n.ts             # Translation utilities
└── i18n/
    └── locales/
        ├── en.json             # English translations
        ├── ar.json             # Arabic translations
        └── fr.json             # French translations

packages/api/
├── src/
│   ├── routers/
│   │   ├── auth.router.ts      # Auth tRPC procedures (login, register, etc.)
│   │   └── index.ts            # Root tRPC router
│   └── middleware/
│       └── auth.ts             # Auth middleware for tRPC procedures

tests/
├── e2e/
│   ├── auth/
│   │   ├── login.spec.ts       # Login flow E2E tests
│   │   ├── register.spec.ts    # Registration flow E2E tests
│   │   ├── password-reset.spec.ts  # Password reset flow E2E tests
│   │   └── accessibility.spec.ts   # Auth accessibility E2E tests
└── unit/
    ├── components/
    │   ├── LoginForm.test.tsx
    │   ├── RegisterForm.test.tsx
    │   └── PasswordInput.test.tsx
    └── hooks/
        ├── useAuth.test.ts
        └── useRequireAuth.test.ts
```

**Structure Decision**: Monorepo with `apps/web` for TanStack Start frontend, `packages/api` for tRPC procedures. Auth components organized by feature under `components/auth/`, shared UI components from Phase 00-foundation in `components/ui/`. State management via TanStack Store in `stores/auth-store.ts`. tRPC mutations wrapped in custom hooks under `hooks/` for reusability and testing.

---

## Architecture Overview

### Frontend Architecture (TanStack Start)

```
┌─────────────────────────────────────────────────────────────┐
│                     TanStack Start App                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐         ┌──────────────┐                  │
│  │   __root     │────────▶│   __root     │                  │
│  │  (app root)  │         │  (auth root) │                  │
│  └──────────────┘         └──────┬───────┘                  │
│                                   │                          │
│                          ┌────────┴─────────┐               │
│                          │                  │               │
│                    ┌─────▼─────┐      ┌────▼────┐          │
│                    │  login    │      │register │          │
│                    └───────────┘      └─────────┘          │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Component Layer                          │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐    │   │
│  │  │ LoginForm│  │Register  │  │  AuthLayout      │    │   │
│  │  │          │  │Form      │  │                  │    │   │
│  │  └──────────┘  └──────────┘  └──────────────────┘    │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Hooks Layer                              │   │
│  │  ┌──────────────────┐  ┌─────────────────────────┐   │   │
│  │  │useLoginMutation  │  │useAuth (state & ops)   │   │   │
│  │  └──────────────────┘  └─────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              State Layer                              │   │
│  │  ┌──────────────────────────────────────────────┐    │   │
│  │  │auth-store.ts (TanStack Store)                │    │   │
│  │  │- isAuthenticated                            │    │   │
│  │  │- user                                        │    │   │
│  │  │- tenantId                                    │    │   │
│  │  └──────────────────────────────────────────────┘    │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                                │
                                │ tRPC client (type-safe)
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                  API Layer (Fastify + tRPC v11)             │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Auth Router                             │   │
│  │  ┌────────────┐  ┌────────────┐  ┌──────────────┐   │   │
│  │  │   login    │  │  register  │  │verifyEmail   │   │   │
│  │  └────────────┘  └────────────┘  └──────────────┘   │   │
│  │  ┌────────────┐  ┌────────────┐                      │   │
│  │  │  logout    │  │requestPwReset│                     │   │
│  │  └────────────┘  └────────────┘                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Auth Middleware                          │   │
│  │  - Session validation                                 │   │
│  │  - Tenant context propagation                         │   │
│  │  - CSRF protection                                    │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                  Database Layer (PostgreSQL)                 │
├─────────────────────────────────────────────────────────────┤
│  Tables: users, sessions, email_verification_tokens,        │
│          password_reset_tokens, audit_logs                   │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow: Login Example

```typescript
// 1. User enters credentials in LoginForm component
<LoginForm onSubmit={handleSubmit} />

// 2. Form validation (client-side)
const validateLogin = (values: LoginInput) => {
  return z.object({
    email: z.string().email(),
    password: z.string().min(8),
  }).parse(values)
}

// 3. tRPC mutation (type-safe)
const loginMutation = useMutation({
  mutationFn: (input: LoginInput) => trpc.auth.login.mutate(input),
})

// 4. API layer processes login
// tRPC router → auth.login procedure → database check → session creation

// 5. Response updates auth store
authStore.setState({
  isAuthenticated: true,
  user: response.user,
  tenantId: response.user.tenantId,
})

// 6. Router navigates to dashboard
router.navigate({ to: '/dashboard' })
```

### Route Structure (TanStack Start File-Based Routing)

```text
routes/
├── __root.tsx                          # Root layout with providers
├── index.tsx                           # Landing page
├── dashboard.tsx                       # Protected dashboard (with auth guard)
└── auth/
    ├── __root.tsx                      # Auth layout wrapper
    ├── login.tsx                       # /auth/login
    ├── register.tsx                    # /auth/register
    ├── verify-email.tsx                # /auth/verify-email?token=xxx
    ├── forgot-password.tsx             # /auth/forgot-password
    └── reset-password.tsx              # /auth/reset-password?token=xxx
```

---

## Technology Stack Details

### Frontend Framework
- **TanStack Start** (`@tanstack/start`): File-based routing, SSR/SSG, type-safe navigation
- **TanStack Router** (`@tanstack/react-router`): Client-side routing, route loaders/actions
- **React** 19+: UI library with concurrent features
- **TypeScript** 5.3+: Static typing with strict mode

### UI Components
- **Mantine v9** (`@mantine/core`): Primary component library with built-in RTL support
- **@mantine/form**: Form state management and validation
- **@mantine/hooks**: Custom React hooks (useDisclosure, useMediaQuery, etc.)

### State Management
- **TanStack Store** (`@tanstack/store`): Lightweight auth state management
- **React Context**: Provider pattern for auth context (derived from TanStack Store)

### API Layer
- **tRPC v11** (`@trpc/client`): Type-safe API calls without code generation
- **@tanstack/start-trpc**: TanStack Start integration for tRPC

### Internationalization
- **TanStack Router i18n**: Built-in i18n support with locale-aware routing
- **Translation files**: JSON files under `i18n/locales/` for each language

### Styling
- **CSS-in-JS** (Mantine v9): Theme integration, automatic RTL handling
- **PostCSS**: CSS processing with Mantine presets

### Testing
- **Playwright** (`@playwright/test`): E2E testing for critical auth flows
- **@axe-core/playwright**: Accessibility testing integration
- **Vitest** (`vitest`): Unit testing for components and hooks
- **React Testing Library** (`@testing-library/react`): Component testing utilities

### Development Tools
- **Vite**: Build tool and dev server (via TanStack Start)
- **ESLint**: Linting with Next.js config
- **TypeScript**: Type checking
- **Prettier** (optional): Code formatting

---

## Key Design Decisions

### 1. TanStack Start over Next.js
**Decision**: Use TanStack Start as the frontend framework instead of Next.js.  
**Rationale**: Better type safety with TanStack Router, superior developer experience, file-based routing like Next.js but with more flexibility, excellent tRPC integration.  
**Trade-off**: Smaller ecosystem than Next.js, but growing rapidly and sufficient for our needs.

### 2. TanStack Store over React Context/Zustand
**Decision**: Use TanStack Store for auth state management.  
**Rationale**: Lightweight (1KB), minimal boilerplate, excellent TypeScript support, no need for Context Provider overhead, works great with TanStack ecosystem.  
**Trade-off**: Less feature-rich than Zustand, but auth state is simple and doesn't need advanced features.

### 3. Mantine v9 over Custom Component Library
**Decision**: Use Mantine v9 as the primary component library.  
**Rationale**: Built-in RTL support, excellent accessibility (WCAG 2.1 AA out of the box), comprehensive component library, active maintenance, great TypeScript support.  
**Trade-off**: Larger bundle size than headless UI libraries, but acceptable with route-based code splitting.

### 4. HTTP-Only Cookies over LocalStorage Tokens
**Decision**: Store session tokens in HTTP-only cookies managed by the server.  
**Rationale**: More secure than localStorage (XSS protection), automatic CSRF protection, browser-managed secure storage, simpler session invalidation.  
**Trade-off**: Requires server-side session management, but this is already implemented in the API layer.

### 5. Server-Side Session Validation over Client-Side JWT Claims
**Decision**: Validate sessions on the server via database check rather than trusting JWT claims.  
**Rationale**: More secure (can invalidate sessions immediately), tenant isolation enforcement, audit logging, supports session management features.  
**Trade-off**: Slightly slower (database round-trip), but acceptable with proper caching and database indexing.

### 6. tRPC Mutations over REST API
**Decision**: Use tRPC v11 for all auth API calls.  
**Rationale**: End-to-end type safety, automatic type inference, no code generation needed, excellent developer experience, zero duplicate type definitions.  
**Trade-off**: Tied to tRPC ecosystem, but this is already our standard for all API calls.

### 7. Custom Hook Wrappers over Direct tRPC Calls
**Decision**: Wrap tRPC mutations in custom hooks (`useLoginMutation`, `useRegisterMutation`, etc.).  
**Rationale**: Reusable logic across components, centralized error handling, consistent loading states, easier testing, separation of concerns.  
**Trade-off**: Additional abstraction layer, but improves code organization and maintainability.

### 8. File-Based Routing over Config-Based Routing
**Decision**: Use TanStack Start's file-based routing (`routes/auth/login.tsx`).  
**Rationale**: Convention over configuration, easier to understand, collocated route config with components, automatic code splitting, familiar to Next.js developers.  
**Trade-off**: Less flexible than config-based routing, but sufficient for our needs.

### 9. Generic Error Messages over Specific Errors
**Decision**: Use generic error messages like "Invalid email or password" instead of "Email not found" or "Wrong password".  
**Rationale**: Prevents email enumeration attacks, improves security, aligns with OWASP recommendations.  
**Trade-off**: Slightly worse user experience, but security is more important for authentication.

### 10. Email Verification before Access
**Decision**: Require email verification before allowing account access.  
**Rationale**: Ensures email deliverability, reduces fake accounts, enables important notifications (password resets, reports), prevents typo-based registrations.  
**Trade-off**: Adds friction to signup, but necessary for email-dependent features and security.

---

## Component Architecture

### Atomic Design Organization

```text
components/auth/
├── atoms/                    # Basic building blocks
│   ├── PasswordInput.tsx    # Password input with visibility toggle
│   ├── AuthError.tsx        # Error display component
│   └── AuthSuccess.tsx      # Success message component
├── molecules/                # Simple combinations
│   ├── LoginForm.tsx        # Login form with email/password
│   ├── RegisterForm.tsx     # Registration form with all fields
│   ├── ForgotPasswordForm.tsx  # Password reset request form
│   └── ResetPasswordForm.tsx   # Password reset confirm form
└── organisms/                # Complex, reusable sections
    └── AuthLayout.tsx       # Full-page auth layout wrapper
```

### Component Dependencies

```
AuthLayout (organism)
    ├── LoginForm (molecule)
    │   ├── AppTextInput (atom - from Phase 00)
    │   ├── PasswordInput (atom)
    │   ├── AppButton (atom - from Phase 00)
    │   └── AuthError (atom)
    ├── RegisterForm (molecule)
    │   ├── AppTextInput (atom)
    │   ├── PasswordInput (atom)
    │   ├── AppButton (atom)
    │   └── AuthError (atom)
    └── ForgotPasswordForm (molecule)
        ├── AppTextInput (atom)
        ├── AppButton (atom)
        ├── AuthError (atom)
        └── AuthSuccess (atom)
```

---

## State Management Architecture

### Auth Store (TanStack Store)

```typescript
// stores/auth-store.ts
import { createStore } from '@tanstack/store'

interface AuthState {
  isAuthenticated: boolean
  user: User | null
  tenantId: string | null
  isLoading: boolean
  error: string | null
}

interface AuthActions {
  login: (user: User, tenantId: string) => void
  logout: () => void
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
}

export const authStore = createStore<AuthState & AuthActions>({
  initialState: {
    isAuthenticated: false,
    user: null,
    tenantId: null,
    isLoading: false,
    error: null,
  },
  actions: (set) => ({
    login: (user, tenantId) => set({
      isAuthenticated: true,
      user,
      tenantId,
      error: null,
    }),
    logout: () => set({
      isAuthenticated: false,
      user: null,
      tenantId: null,
      error: null,
    }),
    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),
    clearError: () => set({ error: null }),
  }),
})
```

### Custom Hooks

```typescript
// hooks/useAuth.ts
import { useStore } from '@tanstack/react-store'
import { authStore } from '@/stores/auth-store'

export function useAuth() {
  const auth = useStore(authStore)

  return {
    ...auth,
    isAuthenticated: auth.isAuthenticated,
    user: auth.user,
    tenantId: auth.tenantId,
    isLoading: auth.isLoading,
    error: auth.error,
  }
}
```

---

## Route Protection Strategy

### Auth Guard Hook

```typescript
// hooks/useRequireAuth.ts
import { useNavigate } from '@tanstack/react-router'
import { useAuth } from './useAuth'
import { useEffect } from 'react'

export function useRequireAuth() {
  const { isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate({ to: '/auth/login', replace: true })
    }
  }, [isAuthenticated, isLoading, navigate])

  return { isAuthenticated, isLoading }
}
```

### Protected Route Example

```typescript
// routes/dashboard.tsx
import { createFileRoute } from '@tanstack/react-router'
import { useRequireAuth } from '@/hooks/useRequireAuth'

export const Route = createFileRoute('/dashboard')({
  component: Dashboard,
})

function Dashboard() {
  const { isAuthenticated, isLoading } = useRequireAuth()

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!isAuthenticated) {
    return null // Will redirect via useRequireAuth
  }

  return <div>Welcome to Dashboard</div>
}
```

---

## Form Validation Strategy

### Client-Side Validation (Zod)

```typescript
// lib/validations/auth.ts
import { z } from 'zod'

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  password: z
    .string()
    .min(1, 'Password is required'),
})

export const registerSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string(),
  firstName: z
    .string()
    .min(1, 'First name is required')
    .min(2, 'First name must be at least 2 characters'),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .min(2, 'Last name must be at least 2 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
})

export const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})
```

### Form Integration with Mantine

```typescript
// components/auth/LoginForm.tsx
import { useForm } from '@mantine/form'
import { loginSchema } from '@/lib/validations/auth'
import { zodResolver } from '@mantine/form/zod-resolver'

export function LoginForm() {
  const form = useForm({
    validate: zodResolver(loginSchema),
    initialValues: {
      email: '',
      password: '',
    },
  })

  // ... rest of component
}
```

---

## Accessibility Strategy

### ARIA Labels and Roles

```typescript
// Example: PasswordInput component
<input
  type={showPassword ? 'text' : 'password'}
  id={id}
  aria-label="Password"
  aria-required="true"
  aria-invalid={hasError}
  aria-describedby={hasError ? `${id}-error` : undefined}
/>
{hasError && (
  <span id={`${id}-error`} role="alert" aria-live="polite">
    {error}
  </span>
)}
```

### Focus Management

```typescript
// Focus first input on mount
useEffect(() => {
  if (emailInputRef.current) {
    emailInputRef.current.focus()
  }
}, [])

// Focus error on validation failure
useEffect(() => {
  if (firstErrorFieldRef.current) {
    firstErrorFieldRef.current.focus()
  }
}, [errors])
```

### Keyboard Navigation

```typescript
// Handle Enter key to submit form
const handleKeyDown = (e: React.KeyboardEvent) => {
  if (e.key === 'Enter' && !isSubmitting) {
    handleSubmit()
  }
}

// Handle Escape key to cancel/close
const handleEscape = (e: React.KeyboardEvent) => {
  if (e.key === 'Escape') {
    handleClose()
  }
}
```

---

## Internationalization Strategy

### Translation File Structure

```json
// i18n/locales/en.json
{
  "auth": {
    "login": {
      "title": "Sign in to your account",
      "email": "Email address",
      "password": "Password",
      "submit": "Sign in",
      "noAccount": "Don't have an account?",
      "register": "Sign up",
      "errors": {
        "invalidCredentials": "Invalid email or password",
        "emailRequired": "Email is required",
        "passwordRequired": "Password is required"
      }
    },
    "register": {
      "title": "Create your account",
      "firstName": "First name",
      "lastName": "Last name",
      "email": "Email address",
      "password": "Password",
      "confirmPassword": "Confirm password",
      "submit": "Create account",
      "haveAccount": "Already have an account?",
      "login": "Sign in",
      "errors": {
        "passwordsMismatch": "Passwords don't match",
        "emailExists": "An account with this email already exists"
      }
    }
  }
}
```

### Translation Hook

```typescript
// hooks/useTranslation.ts
import { useParams } from '@tanstack/react-router'
import en from '@/i18n/locales/en.json'
import ar from '@/i18n/locales/ar.json'
import fr from '@/i18n/locales/fr.json'

const translations = { en, ar, fr }

export function useTranslation() {
  const { locale } = useParams({ strict: false })
  const t = translations[locale as keyof typeof translations] || en

  return { t, locale }
}
```

### RTL Support

```typescript
// Mantine DirectionProvider
import { DirectionProvider } from '@mantine/core'

function App() {
  const { locale } = useTranslation()
  const direction = locale === 'ar' ? 'rtl' : 'ltr'

  return (
    <DirectionProvider initialDirection={direction}>
      {/* App content */}
    </DirectionProvider>
  )
}
```

---

## Testing Strategy

### E2E Tests (Playwright)

```typescript
// tests/e2e/auth/login.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Login Flow', () => {
  test('should login successfully with valid credentials', async ({ page }) => {
    await page.goto('/auth/login')
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'SecurePassword123!')
    await page.click('button[type="submit"]')
    
    await expect(page).toHaveURL('/dashboard')
    await expect(page.locator('text=Welcome')).toBeVisible()
  })

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/auth/login')
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'WrongPassword')
    await page.click('button[type="submit"]')
    
    await expect(page.locator('text=Invalid email or password')).toBeVisible()
  })

  test('should redirect authenticated users to dashboard', async ({ page }) => {
    // Login first
    await page.goto('/auth/login')
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'SecurePassword123!')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/dashboard')
    
    // Try to access login again
    await page.goto('/auth/login')
    await expect(page).toHaveURL('/dashboard')
  })
})
```

### Accessibility Tests (Playwright + axe-core)

```typescript
// tests/e2e/auth/accessibility.spec.ts
import { test, expect } from '@playwright/test'
import { injectAxe, checkA11y } from '@axe-core/playwright'

test.describe('Auth Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await injectAxe(page)
  })

  test('login page should not have accessibility violations', async ({ page }) => {
    await page.goto('/auth/login')
    await checkA11y(page)
  })

  test('register page should not have accessibility violations', async ({ page }) => {
    await page.goto('/auth/register')
    await checkA11y(page)
  })

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/auth/login')
    
    // Tab through form
    await page.keyboard.press('Tab')
    await expect(page.locator('[name="email"]')).toBeFocused()
    
    await page.keyboard.press('Tab')
    await expect(page.locator('[name="password"]')).toBeFocused()
    
    await page.keyboard.press('Tab')
    await expect(page.locator('button[type="submit"]')).toBeFocused()
  })
})
```

### Unit Tests (Vitest)

```typescript
// tests/unit/components/LoginForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { LoginForm } from '@/components/auth/LoginForm'
import { vi } from 'vitest'

describe('LoginForm', () => {
  it('should render email and password fields', () => {
    render(<LoginForm />)
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
  })

  it('should show validation errors for empty fields', async () => {
    render(<LoginForm />)
    
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument()
      expect(screen.getByText(/password is required/i)).toBeInTheDocument()
    })
  })

  it('should call login mutation with form values', async () => {
    const loginMock = vi.fn().mockResolvedValue({ success: true })
    render(<LoginForm onSubmit={loginMock} />)
    
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    })
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    
    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
    })
  })
})
```

---

## Performance Considerations

### Route-Based Code Splitting

TanStack Start automatically splits routes, so auth pages only load their dependencies:

```typescript
// routes/auth/login.tsx only loads:
// - LoginForm component
// - useLoginMutation hook
// - Login-specific translations
// NOT: RegisterForm, Dashboard components, etc.
```

### Lazy Loading for Heavy Components

```typescript
// Lazy load password strength meter
const PasswordStrengthMeter = lazy(() => 
  import('./PasswordStrengthMeter')
)
```

### Image Optimization

```typescript
// Optimize company logo
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/auth/$authType')({
  component: AuthLayout,
  loader: async () => {
    // Preload logo image
    const logo = new Image()
    logo.src = '/logos/masafh.svg'
    return {}
  },
})
```

### Bundle Size Budgets

```javascript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'mantine-core': ['@mantine/core'],
          'mantine-form': ['@mantine/form'],
          'tanstack-router': ['@tanstack/react-router'],
          'tanstack-store': ['@tanstack/store'],
        },
      },
    },
  },
})
```

---

## Security Considerations

### CSRF Protection

```typescript
// tRPC middleware adds CSRF token to mutations
import { initTRPC } from '@trpc/server'

const t = initTRPC.context<Context>().create()

const protectedProcedure = t.procedure.use(async ({ next, ctx }) => {
  // Validate CSRF token
  if (!validateCsrfToken(ctx.csrfToken)) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Invalid CSRF token' })
  }
  return next()
})
```

### Rate Limiting

```typescript
// API-level rate limiting (implemented in backend)
// UI shows user-friendly message when rate limited
const isRateLimited = error?.code === 'RATE_LIMIT_EXCEEDED'

if (isRateLimited) {
  return <AuthError message="Too many attempts. Please try again later." />
}
```

### Password Masking

```typescript
// Never log passwords
console.log('Login attempt:', { email }) // OK
console.log('Login attempt:', { email, password }) // BAD
```

### Secure Autocomplete

```typescript
// Enable password manager integration
<input
  type="password"
  autoComplete="current-password" // Login form
  autoComplete="new-password"     // Registration/reset form
/>
```

---

## Migration Path from Prototype

The existing Next.js prototype (`apps/web/`) is disposable. Migration steps:

1. **Preserve**: Business logic, multi-tenancy patterns, backend architecture (unchanged)
2. **Replace**: Next.js App Router → TanStack Start file-based routing
3. **Replace**: next-intl → TanStack Router i18n
4. **Replace**: next/image → Standard `<img>` with optimization
5. **Preserve**: Mantine v9 components (no changes needed)
6. **Replace**: Client-side routing logic → TanStack Router patterns
7. **Update**: API calls from REST/fetch to tRPC mutations (if not already)

---

## Dependencies & Prerequisites

### Internal Dependencies
- **Phase 00-foundation**: Must complete before Phase 01 can begin
  - Design tokens and theme system
  - Base UI components (AppTextInput, AppButton, AppCard)
  - RTL/LTR layout infrastructure
  - i18n setup with TanStack Router
  - TanStack Start project structure

### External Dependencies
- **tRPC API Layer**: Backend must expose auth procedures
  - `auth.login`
  - `auth.register`
  - `auth.logout`
  - `auth.verifyEmail`
  - `auth.requestPasswordReset`
  - `auth.confirmPasswordReset`
  - `auth.getSession` (for session validation)

### Infrastructure Dependencies
- PostgreSQL database with auth tables
- Email delivery service (Resend/SendGrid) for transactional emails
- Redis/Upstash for rate limiting (if implemented at API layer)

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Email delivery failures | Implement retry logic, provide "resend email" option, monitor delivery rates |
| RTL layout issues | Test Arabic layout continuously, use Mantine's built-in RTL support |
| Accessibility regressions | Automated axe-core testing in CI, manual testing with screen readers |
| tRPC type mismatches | Strict TypeScript configuration, end-to-end type checking in CI |
| Session management bugs | Comprehensive E2E tests for session lifecycle, manual testing for edge cases |
| Password reset link abuse | Short expiration (1 hour), single-use tokens, rate limiting |
| Email enumeration attacks | Generic error messages, consistent responses regardless of email existence |

---

## Success Metrics

### Performance Metrics
- Auth pages load in <1.5s on 3G (Lighthouse)
- Form submissions complete in <2s (API response time)
- Initial bundle <300KB gzipped (bundle analysis)

### Quality Metrics
- 70%+ unit test coverage (80%+ for auth logic)
- Zero axe-core accessibility violations
- All auth pages pass WCAG 2.1 AA audit
- Zero console errors in production

### User Experience Metrics
- 95%+ successful registration rate (form analytics)
- 90%+ successful login rate (analytics)
- <5% password reset request rate (indicates memorable passwords)
- <2% support ticket rate for auth issues

---

## Open Questions

1. **Session Duration**: What should the default session duration be? (Assumption: 24 hours, with "remember me" option extending to 7 days)
2. **Account Lockout**: Should accounts lock after too many failed attempts? If so, after how many? (Assumption: Yes, 5 failed attempts trigger 15-minute lockout)
3. **Email Resend Cooldown**: What's the minimum time between "resend verification email" requests? (Assumption: 30 seconds)
4. **Password Requirements**: Are the stated requirements (8+ chars, uppercase, lowercase, number, special) final? (Assumption: Yes, align with NIST guidelines)
5. **Unverified Account Cleanup**: How long before unverified accounts are deleted? (Assumption: 7 days)
6. **Social Login**: Is social login (Google, Microsoft) planned for Phase 02 or later? (Assumption: Later, not in Phase 01)
7. **2FA**: Is two-factor authentication planned? If so, when? (Assumption: Later, not in Phase 01)

---

## Next Steps

1. **Review and approve** this implementation plan
2. **Generate tasks.md** via `/speckit.tasks` command with user story prioritization
3. **Create tRPC contracts** in `contracts/` directory with Zod schemas
4. **Set up pre-flight checklist** in `checklists/` directory
5. **Begin implementation** starting with Phase 1 (Setup) in tasks.md

---

**Document Status**: Draft  
**Last Updated**: 2026-04-14  
**Next Review**: After task generation
