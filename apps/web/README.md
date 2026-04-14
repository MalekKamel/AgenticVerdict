# @agenticverdict/web

AgenticVerdict web application - Multi-business-domain intelligence platform with authentication, multi-language support, and accessibility features.

## Overview

This is the web frontend for AgenticVerdict, built with:

- **Framework**: TanStack Start (Vite + TanStack Router + Nitro)
- **UI Library**: Mantine v7
- **Forms**: @mantine/form + Zod validation
- **State**: TanStack Store
- **API**: tRPC v11 (type-safe)
- **i18n**: JSON messages + `intl-messageformat` (EN, AR, FR message files; routing uses EN/AR with RTL)
- **Testing**: Vitest (unit) + Playwright (E2E)

## Getting Started

### Prerequisites

- Node.js 20 LTS
- pnpm 9+

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Run production server
pnpm start
```

### Environment Variables

Create a `.env.local` file (Vite exposes variables prefixed with `VITE_` to the client):

```bash
# API URL (server-side / SSR; optional client mirror below)
API_URL=http://localhost:3001

# Client-accessible API URL (when needed in the browser bundle)
VITE_PUBLIC_API_URL=http://localhost:3001

# Feature flags (example — wire in app as needed)
# VITE_PUBLIC_ENABLE_AUTH=true
```

## Authentication System

### Features

The authentication system provides:

- **Email/Password Login** - Secure login with remember-me functionality
- **Registration** - User registration with email verification
- **Password Reset** - Self-service password recovery flow
- **Multi-language** - Full support for English, Arabic (RTL), and French
- **Accessibility** - WCAG 2.1 AA compliant with keyboard navigation
- **Error Handling** - User-friendly error messages with screen reader support

### Auth Routes

| Route                   | Description             | Protected |
| ----------------------- | ----------------------- | --------- |
| `/auth/login`           | Login page              | No        |
| `/auth/register`        | Registration page       | No        |
| `/auth/verify-email`    | Email verification      | No        |
| `/auth/forgot-password` | Password reset request  | No        |
| `/auth/reset-password`  | Password reset confirm  | No        |
| `/dashboard`            | Authenticated dashboard | Yes       |

### Using Auth Components

#### LoginForm

```tsx
import { LoginForm } from "@agenticverdict/web/components/auth";

export default function LoginPage() {
  return <LoginForm onSuccess={() => router.push("/dashboard")} />;
}
```

**Props:**

- `onSuccess?: () => void` - Callback after successful login
- `redirectTo?: string` - Override default redirect path

#### RegisterForm

```tsx
import { RegisterForm } from "@agenticverdict/web/components/auth";

export default function RegisterPage() {
  return <RegisterForm onSuccess={() => router.push("/auth/verify-email")} />;
}
```

**Props:**

- `onSuccess?: () => void` - Callback after successful registration

#### ForgotPasswordForm

```tsx
import { ForgotPasswordForm } from "@agenticverdict/web/components/auth";

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
```

#### ResetPasswordForm

```tsx
import { ResetPasswordForm } from "@agenticverdict/web/components/auth";

export default function ResetPasswordPage() {
  // Token is passed via URL query parameter
  return <ResetPasswordForm token={searchParams.token} />;
}
```

**Props:**

- `token: string` - Password reset token from URL

### Using Auth Hooks

#### useAuth

Access authentication state and actions:

```tsx
import { useAuth } from "@agenticverdict/web/hooks/useAuth";

function MyComponent() {
  const { isAuthenticated, user, logout } = useAuth();

  if (!isAuthenticated) {
    return <PleaseLogin />;
  }

  return <Welcome userName={user?.firstName} />;
}
```

**Returns:**

- `isAuthenticated: boolean` - Authentication status
- `user: User | null` - Current user data
- `tenantId: string | null` - Current tenant ID
- `isLoading: boolean` - Loading state
- `error: Error | null` - Current error
- `logout: () => Promise<void>` - Logout function

#### useRequireAuth

Protect routes that require authentication:

```tsx
import { useRequireAuth } from "@agenticverdict/web/hooks/useRequireAuth";

function ProtectedPage() {
  const { user, isLoading } = useRequireAuth({
    onUnauthorized: () => router.push("/auth/login"),
  });

  if (isLoading) return <LoadingSpinner />;
  return <Dashboard user={user} />;
}
```

**Options:**

- `onUnauthorized?: () => void` - Callback when user is not authenticated

#### useLoginMutation

Login form hook:

```tsx
import { useLoginMutation } from "@agenticverdict/web/hooks/useLoginMutation";

function LoginForm() {
  const loginMutation = useLoginMutation();

  const handleSubmit = async (data: LoginFormData) => {
    await loginMutation.mutateAsync(data);
    // Redirect happens automatically
  };

  return <form onSubmit={handleSubmit}>{/* Form fields */}</form>;
}
```

**Returns:** `UseMutationResult` from TanStack Query

#### useRegisterMutation

Registration form hook:

```tsx
import { useRegisterMutation } from "@agenticverdict/web/hooks/useRegisterMutation";

function RegisterForm() {
  const registerMutation = useRegisterMutation();

  const handleSubmit = async (data: RegisterFormData) => {
    await registerMutation.mutateAsync(data);
    // Redirect to verification page
  };

  return <form onSubmit={handleSubmit}>{/* ... */}</form>;
}
```

### Auth Validation Schemas

Zod schemas are available for form validation:

```tsx
import { loginSchema, registerSchema } from "@agenticverdict/web/lib/validations/auth";

// Login schema: { email, password, rememberMe }
// Register schema: { email, password, confirmPassword, firstName, lastName, acceptTerms }
```

### Password Requirements

All password fields enforce:

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

## Multi-Language Support

### Supported Languages

- **English (en)** - Default, LTR
- **Arabic (ar)** - RTL layout
- **French (fr)** - LTR

### Language Switching

Use `useLocale` / `useTranslations` from `@/i18n/react`, and locale-aware `Link`, `useRouter`, `usePathname` from `@/i18n/navigation` (paths omit the `/$locale` prefix; navigation adds it automatically).

### Adding Translations

Translation files are in `/messages/{locale}.json`:

```json
{
  "auth": {
    "login": {
      "title": "Sign In",
      "description": "Welcome back! Please sign in to your account."
    }
  }
}
```

Usage in components:

```tsx
import { useTranslations } from "@/i18n/react";

function LoginForm() {
  const t = useTranslations("auth.login");
  return <h1>{t("title")}</h1>; // "Sign In"
}
```

## Accessibility

### WCAG 2.1 AA Compliance

All auth components meet WCAG 2.1 AA standards:

- **Color contrast**: Minimum 4.5:1 for normal text
- **Touch targets**: Minimum 44×44px
- **Keyboard navigation**: Full keyboard support
- **Screen readers**: Proper ARIA labels and roles
- **Focus indicators**: Visible focus states

### Keyboard Navigation

- **Tab**: Move between form fields
- **Shift+Tab**: Reverse navigation
- **Enter**: Submit forms
- **Escape**: Close modals/dismiss alerts

### ARIA Attributes

Components include:

- `role="alert"` for error messages
- `aria-live="polite"` for success messages
- `aria-label` for icon-only buttons
- `aria-describedby` for form field help

## Testing

### Unit Tests

Run unit tests with Vitest:

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

### E2E Tests

Run E2E tests with Playwright:

```bash
# Run all E2E tests
pnpm test:e2e

# Run specific test file
pnpm playwright test login-flow.spec.ts

# Run tests with UI
pnpm playwright test --ui

# Run tests in debug mode
pnpm playwright test --debug
```

### Test Coverage

Current targets:

- **Overall**: 70%+
- **Auth logic**: 80%+
- **Components**: 70%+
- **Hooks**: 85%+

### Manual Testing Checklist

**Accessibility:**

- [ ] Test with NVDA/JAWS/VoiceOver
- [ ] Verify keyboard-only navigation
- [ ] Check color contrast with browser tools
- [ ] Verify focus management

**RTL Support:**

- [ ] Test Arabic layout
- [ ] Verify text direction
- [ ] Check form field alignment
- [ ] Test navigation in RTL

**Multi-language:**

- [ ] Test English (default)
- [ ] Test Arabic (RTL)
- [ ] Test French (LTR)
- [ ] Verify all translations present

## Troubleshooting

### Common Issues

**"Module not found" errors:**

```bash
# Rebuild packages
pnpm --filter @agenticverdict/ui build
pnpm build
```

**tRPC connection errors:**

- Verify API is running on correct port
- Check `API_URL` / `VITE_PUBLIC_API_URL` in `.env.local`
- Ensure CORS is configured on API server

**Translation keys missing:**

- Run `pnpm i18n:extract` to find missing keys
- Run `pnpm i18n:validate` to check for inconsistencies

### Development Tips

- Use `pnpm dev` (Vite dev server) for local development
- Run `pnpm typecheck` to catch TypeScript errors
- Use `pnpm lint` to check code quality
- Check browser console for tRPC errors

## Architecture

### Directory Structure

```
apps/web/src/
├── routes/                 # TanStack Router file routes (UI + server routes)
│   ├── __root.tsx         # HTML shell, global styles
│   ├── index.tsx          # `/` → default locale redirect
│   ├── $locale/           # Locale segment (en, ar)
│   └── api.*.ts           # HTTP handlers (e.g. /api/health)
├── components/            # React components
│   └── auth/              # Auth-specific components
├── hooks/                 # Custom React hooks
├── i18n/                  # Locale routing + `I18nProvider` / navigation helpers
├── lib/                   # Utilities
│   ├── api/               # API clients
│   └── validations/       # Zod schemas
├── stores/                # TanStack stores
└── styles/                # Global styles
```

### Key Dependencies

- `@agenticverdict/config` / `@agenticverdict/i18n` - Config and shared formatters
- `@mantine/core` - UI components
- `@tanstack/react-start` / `@tanstack/react-router` - App framework and routing
- `@tanstack/react-query` - Data fetching
- `@trpc/react-query` - tRPC integration
- `intl-messageformat` - ICU message formatting
- `zod` - Runtime validation

## Security

### Best Practices

- All auth forms use POST requests
- CSRF protection enabled on mutations
- Generic error messages (no email enumeration)
- Passwords never logged or exposed
- HTTP-only cookies for session tokens
- Autocomplete attributes set correctly

### Password Security

- Minimum 8 characters
- Complexity requirements enforced
- Strength indicator for user feedback
- Common patterns rejected

## Contributing

When contributing to the auth system:

1. Follow TDD: Write tests first
2. Ensure WCAG 2.1 AA compliance
3. Add translations for all languages
4. Test keyboard navigation
5. Verify RTL support for Arabic

## License

MIT

---

**Generated**: 2026-04-14
**Maintainer**: AgenticVerdict Team
