# @agenticverdict/frontend

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

### TanStack stack versions (SSOT)

Pinned in `package.json` (keep aligned with [web TanStack implementation plan](/docs/03-technology-research/frontend/web-tanstack-start-recommendations-implementation-plan-2026-04-17.md) Phase 1):

| Package                                             | Range / version |
| --------------------------------------------------- | --------------- |
| `@tanstack/react-start`                             | `^1.167.39`     |
| `@tanstack/react-router`                            | `^1.168.21`     |
| `@tanstack/router-plugin`                           | `^1.167.22`     |
| `@tanstack/react-query`                             | `^5.99.0`       |
| `@trpc/client`, `@trpc/react-query`, `@trpc/server` | `^11.16.0`      |
| `vite`                                              | `^8.0.8`        |

### File-based routing

- Routes are defined under `src/routes/` using `createFileRoute` / `createRootRoute` (see [`TanStack Router — file-based routing`](https://tanstack.com/router/latest/docs/framework/react/routing/file-based-routing)).
- `src/routeTree.gen.ts` is **generated** by the Router Vite plugin during `pnpm build` (and dev). It is **gitignored**; CI and local builds must run a web build so the file exists before typecheck where required.
- The `$locale` segment is the i18n root; invalid locales redirect to the default locale (see `src/routes/$locale/route.tsx`).

### Tenant context + tRPC headers

- **`TenantProvider`** (`src/providers/TenantProvider.tsx`) exposes the resolved tenant UUID for UI (from session store + optional dev default).
- **tRPC** (`src/lib/api/trpc-client.ts`) sends `x-tenant-id` when a UUID is known (same resolution as the provider), plus `x-request-id` per request for correlation. Domain RPC remains on the Fastify API per [Decision 11](/docs/architecture/ui/04-decision-record.md#decision-11-trpc-as-unified-api-layer-for-multi-client-support).

### Shared `AppRouter` type (SSOT)

The React tRPC client is typed with **`AppRouter` from `@agenticverdict/api/trpc`**, exported alongside the Fastify-mounted router in `apps/api`. Do not define a parallel router shape in `apps/frontend`; procedure renames and inputs/outputs are enforced by TypeScript across the monorepo.

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

# Set to "false" to call the real Fastify tRPC auth API during local dev (default: mock in-memory session)
# VITE_PUBLIC_AUTH_API_MOCK=false

# Feature flags (example — wire in app as needed)
# VITE_PUBLIC_ENABLE_AUTH=true

# Optional: default tenant UUID for local/dev when not yet authenticated (must be a valid UUID)
# VITE_PUBLIC_DEFAULT_TENANT_ID=11111111-1111-4111-8111-111111111111

# Optional: browser telemetry → POST JSON to this URL (e.g. https://api.example.com/api/v1/telemetry/ingest)
# VITE_PUBLIC_TELEMETRY_INGEST_URL=
# When the API enforces ingest auth, set to the same value as server TELEMETRY_INGEST_SECRET:
# VITE_PUBLIC_TELEMETRY_INGEST_TOKEN=
# Optional: client-side send probability 0–1 (reduces browser POST volume; default 1):
# VITE_PUBLIC_TELEMETRY_SAMPLE_RATE=0.25
```

### Content-Security-Policy (production)

Nitro `routeRules` in `vite.config.ts` set **`X-Frame-Options: DENY`** and other non-CSP headers. The **`Content-Security-Policy`** header is set **per request** in `src/start.ts`: a cryptographically random nonce is emitted via `crypto.randomBytes`, stored in `AsyncLocalStorage` (`src/lib/csp-nonce.server.ts`), applied to the router (`router.options.ssr.nonce` for streaming, `<HeadContent />`, `<Scripts />`, and the `<meta property="csp-nonce">` hydration tag), and reflected in **`script-src`** and **`style-src`** with **`'nonce-…'`** (see `buildContentSecurityPolicy` in `src/lib/csp.ts`). **`style-src-attr 'unsafe-inline'`** allows React **`style={{…}}`** on elements (CSP Level 3); the client bundle resolves **`@web-csp-nonce`** to a helper that reads the same nonce from **`meta[property="csp-nonce"]`**. After deploy, verify the browser console on **home**, **login**, and **dashboard** for CSP violations.

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

### Protected routes (SSR vs client)

- **`/$locale/dashboard`** (and nested routes such as **`/dashboard/feature-flags`**) use **`beforeLoad`** plus `fetchProtectedRouteSession` (`src/lib/auth/protected-route-session.ts`). The server forwards `Authorization`, `Cookie`, and `x-tenant-id` to the Fastify **`auth.getSession`** tRPC procedure so anonymous users are sent to **`/{locale}/auth/login?redirect=…`** before the dashboard shell renders.
- **Default dev auth mock** (`VITE_PUBLIC_AUTH_API_MOCK` not set to `"false"`): the SSR gate is **skipped** because the in-memory mock exists only in the browser; **`useRequireAuth`** still guards after hydration.
- **Production and Playwright E2E** (production build): the mock is off; see `e2e/protected-routes.spec.ts`.

### Using Auth Components

#### LoginForm

```tsx
import { LoginForm } from "@agenticverdict/frontend/components/auth";

export default function LoginPage() {
  return <LoginForm onSuccess={() => router.push("/dashboard")} />;
}
```

**Props:**

- `onSuccess?: () => void` - Callback after successful login
- `redirectTo?: string` - Override default redirect path

#### RegisterForm

```tsx
import { RegisterForm } from "@agenticverdict/frontend/components/auth";

export default function RegisterPage() {
  return <RegisterForm onSuccess={() => router.push("/auth/verify-email")} />;
}
```

**Props:**

- `onSuccess?: () => void` - Callback after successful registration

#### ForgotPasswordForm

```tsx
import { ForgotPasswordForm } from "@agenticverdict/frontend/components/auth";

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
```

#### ResetPasswordForm

```tsx
import { ResetPasswordForm } from "@agenticverdict/frontend/components/auth";

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
import { useAuth } from "@agenticverdict/frontend/hooks/useAuth";

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
import { useRequireAuth } from "@agenticverdict/frontend/hooks/useRequireAuth";

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
import { useLoginMutation } from "@agenticverdict/frontend/hooks/useLoginMutation";

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
import { useRegisterMutation } from "@agenticverdict/frontend/hooks/useRegisterMutation";

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
import { loginSchema, registerSchema } from "@agenticverdict/frontend/lib/validations/auth";

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
apps/frontend/src/
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
