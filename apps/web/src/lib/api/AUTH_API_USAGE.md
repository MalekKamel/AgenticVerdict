# Auth API Integration Pattern - Usage Guide

This guide explains how to use the authentication API integration pattern in the AgenticVerdict application.

## Overview

The auth API integration uses **tRPC v11** with **React Query** for type-safe, cache-enabled authentication operations. The pattern consists of:

1. **API Client** (`/lib/api/auth-api.ts`) - Type-safe API wrapper
2. **Mutation Hooks** (`/hooks/useAuthMutation.ts`) - React Query mutations
3. **Query Hooks** (`/hooks/useSessionQuery.ts`) - Session management
4. **Auth Store** (`/stores/auth-store.ts`) - TanStack Store for state
5. **tRPC Provider** (`/components/providers/trpc-provider.tsx`) - App wrapper

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     React Components                         │
│  ┌──────────────────┐         ┌──────────────────┐         │
│  │   LoginForm      │         │   Dashboard      │         │
│  └────────┬─────────┘         └────────┬─────────┘         │
│           │                            │                     │
│           ▼                            ▼                     │
│  ┌──────────────────┐         ┌──────────────────┐         │
│  │ useAuthMutations │         │ useSessionQuery  │         │
│  │   (useLogin...)  │         │ (getSession...)  │         │
│  └────────┬─────────┘         └────────┬─────────┘         │
│           │                            │                     │
│           ▼                            ▼                     │
│  ┌──────────────────┐         ┌──────────────────┐         │
│  │    authApi       │         │    authApi       │         │
│  │  .login()        │         │  .getSession()   │         │
│  └────────┬─────────┘         └────────┬─────────┘         │
│           │                            │                     │
│           └────────────┬───────────────┘                     │
│                        │                                     │
│                        ▼                                     │
│  ┌───────────────────────────────────────────────────┐     │
│  │              tRPC Client (type-safe)               │     │
│  │     HTTP-only cookies for session management      │     │
│  └─────────────────────┬─────────────────────────────┘     │
│                        │                                     │
│                        ▼                                     │
│  ┌───────────────────────────────────────────────────┐     │
│  │          Backend API (Fastify + tRPC v11)          │     │
│  └───────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

## Setup

### 1. Wrap App with tRPC Provider

In your root layout (`routes/__root.tsx`):

```tsx
import { TRPCProvider } from "@/components/providers/trpc-provider";
import { MantineProvider } from "@mantine/core";

export function Route() {
  return (
    <TRPCProvider>
      <MantineProvider>{/* Your app content */}</MantineProvider>
    </TRPCProvider>
  );
}
```

### 2. Import Auth Hooks

```tsx
import { useLoginMutation } from "@/hooks/useAuthMutation";
import { useSessionQuery } from "@/hooks/useSessionQuery";
import { useAuth } from "@/hooks/useAuth";
```

## Usage Examples

### Login Form

```tsx
import { useForm } from "@mantine/form";
import { useLoginMutation } from "@/hooks/useAuthMutation";
import { useRouter } from "@tanstack/react-router";

export function LoginForm() {
  const router = useRouter();
  const login = useLoginMutation();

  const form = useForm({
    initialValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : "Invalid email"),
      password: (value) => (value.length > 0 ? null : "Password required"),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    login.mutate(values, {
      onSuccess: (data) => {
        console.log("Logged in:", data.user.email);
        router.navigate({ to: "/dashboard" });
      },
      onError: (error) => {
        console.error("Login failed:", error.message);
      },
    });
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <input {...form.getInputProps("email")} placeholder="Email" />
      <input {...form.getInputProps("password")} type="password" placeholder="Password" />
      <button type="submit" disabled={login.isPending}>
        {login.isPending ? "Logging in..." : "Sign In"}
      </button>
      {login.error && <div className="error">{login.error.message}</div>}
    </form>
  );
}
```

### Registration Form

```tsx
import { useForm } from "@mantine/form";
import { useRegisterMutation } from "@/hooks/useAuthMutation";

export function RegisterForm() {
  const register = useRegisterMutation();

  const form = useForm({
    initialValues: {
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : "Invalid email"),
      password: (value) => (value.length >= 8 ? null : "Password too short"),
      confirmPassword: (value, values) =>
        value === values.password ? null : "Passwords don't match",
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    register.mutate(
      {
        email: values.email,
        password: values.password,
        firstName: values.firstName,
        lastName: values.lastName,
      },
      {
        onSuccess: (data) => {
          console.log("Registration successful:", data.message);
          // Navigate to email verification page
        },
      },
    );
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      {/* Form fields */}
      <button type="submit" disabled={register.isPending}>
        {register.isPending ? "Creating account..." : "Sign Up"}
      </button>
    </form>
  );
}
```

### Protected Route

```tsx
import { useSessionQuery } from "@/hooks/useSessionQuery";
import { useRequireAuth } from "@/hooks/useSessionQuery";

export function Dashboard() {
  const { user, isLoading } = useRequireAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Welcome, {user?.firstName}!</h1>
      <p>Email: {user?.email}</p>
      <p>Tenant ID: {user?.tenantId}</p>
    </div>
  );
}
```

### Logout Button

```tsx
import { useLogoutMutation } from "@/hooks/useAuthMutation";

export function LogoutButton() {
  const logout = useLogoutMutation();

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        console.log("Logged out successfully");
        // Navigate to login page
      },
    });
  };

  return (
    <button onClick={handleLogout} disabled={logout.isPending}>
      {logout.isPending ? "Logging out..." : "Logout"}
    </button>
  );
}
```

### Password Reset

```tsx
import { useForm } from "@mantine/form";
import { useRequestPasswordResetMutation } from "@/hooks/useAuthMutation";

export function ForgotPasswordForm() {
  const requestReset = useRequestPasswordResetMutation();

  const form = useForm({
    initialValues: { email: "" },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : "Invalid email"),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    requestReset.mutate(values, {
      onSuccess: (data) => {
        console.log(data.message); // "If an account exists, a reset link was sent"
        // Show success message
      },
    });
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <input {...form.getInputProps("email")} placeholder="Email" />
      <button type="submit" disabled={requestReset.isPending}>
        Send Reset Link
      </button>
    </form>
  );
}
```

### Email Verification

```tsx
import { useVerifyEmailMutation } from "@/hooks/useAuthMutation";
import { useSearchParams } from "@tanstack/react-router";

export function VerifyEmailPage() {
  const verifyEmail = useVerifyEmailMutation();
  const searchParams = useSearchParams({ from: "/auth/verify-email" });
  const token = searchParams.token ?? "";

  const handleVerify = () => {
    verifyEmail.mutate(
      { token },
      {
        onSuccess: () => {
          console.log("Email verified successfully");
          // Navigate to login page
        },
      },
    );
  };

  return (
    <div>
      <button onClick={handleVerify} disabled={verifyEmail.isPending}>
        {verifyEmail.isPending ? "Verifying..." : "Verify Email"}
      </button>
    </div>
  );
}
```

## Error Handling

All auth mutations and queries follow a consistent error handling pattern:

```tsx
const login = useLoginMutation();

login.mutate(values, {
  onSuccess: (data) => {
    // Success - data contains the response
  },
  onError: (error) => {
    // Error - error.message contains user-friendly message
    // Common error codes:
    // - UNAUTHORIZED: Invalid credentials
    // - RATE_LIMIT_EXCEEDED: Too many attempts
    // - EMAIL_NOT_VERIFIED: Email not verified
  },
});
```

## Session Management

### Check Authentication Status

```tsx
import { useIsAuthenticated } from "@/hooks/useSessionQuery";

function Navbar() {
  const { isAuthenticated, isLoading } = useIsAuthenticated();

  if (isLoading) return <div>Loading...</div>;

  return <nav>{isAuthenticated ? <AuthenticatedNav /> : <PublicNav />}</nav>;
}
```

### Access User Data

```tsx
import { useAuth } from "@/hooks/useAuth";

function UserProfile() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }

  return (
    <div>
      <h1>
        {user?.firstName} {user?.lastName}
      </h1>
      <p>{user?.email}</p>
      {user?.emailVerified ? <p>Verified ✓</p> : <p>Not verified</p>}
    </div>
  );
}
```

### Manual Session Refresh

```tsx
import { useSessionQuery } from "@/hooks/useSessionQuery";

function MyComponent() {
  const { refetch } = useSessionQuery();

  const handleRefresh = () => {
    refetch();
  };

  return <button onClick={handleRefresh}>Refresh Session</button>;
}
```

## Type Safety

All operations are fully type-safe. TypeScript will infer the correct types:

```tsx
// Input types are validated
const login = useLoginMutation();

login.mutate({
  email: "user@example.com",
  password: "password",
  rememberMe: true,
  // TypeScript will error if you add invalid fields
});

// Response types are known
login.mutate(values, {
  onSuccess: (data) => {
    // data.user is typed as AuthUserData
    console.log(data.user.firstName);
    // data.sessionExpiresAt is a string (ISO 8601)
    console.log(new Date(data.sessionExpiresAt));
  },
});
```

## Environment Configuration

Configure the API URL in your environment variables:

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3001

# Production
NEXT_PUBLIC_API_URL=https://api.agenticverdict.com
```

## Testing

Mock the auth API in tests:

```tsx
import { renderHook, waitFor } from '@testing-library/react'
import { useLoginMutation } from '@/hooks/useAuthMutation'

vi.mock('@/lib/api/auth-api', () => ({
  authApi: {
    login: vi.fn().mockResolvedValue({
      success: true,
      data: {
        user: { id: '1', email: 'test@example.com', ... },
        sessionExpiresAt: '2024-01-01T00:00:00Z',
      },
    }),
  },
}))

test('login mutation works', async () => {
  const { result } = renderHook(() => useLoginMutation())

  result.current.mutate({ email: 'test@example.com', password: 'password' })

  await waitFor(() => {
    expect(result.current.isSuccess).toBe(true)
  })
})
```

## Migration from REST API

If you're currently using REST/fetch, here's how to migrate:

**Before (REST):**

```tsx
const response = await fetch("/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
});
const data = await response.json();
```

**After (tRPC):**

```tsx
const login = useLoginMutation();
login.mutate(
  { email, password },
  {
    onSuccess: (data) => {
      // data is fully typed!
    },
  },
);
```

## Next Steps

1. **Wrap your app** with `TRPCProvider` in the root layout
2. **Replace existing auth calls** with the new hooks
3. **Remove fetch/REST code** for auth operations
4. **Update error handling** to use the new error format
5. **Test all auth flows** (login, register, password reset)

## Troubleshooting

### "Cannot find module '@agenticverdict/api'"

The tRPC router types are not yet exported from the API package. This is expected during development - the mock implementations in `auth-api.ts` will be used until the backend router is ready.

### Session not persisting

Ensure HTTP-only cookies are being set by the backend. Check browser DevTools > Application > Cookies.

### Type errors

Run `pnpm typecheck` to ensure all packages are built and types are up to date.

### CORS errors

Configure the API backend to allow requests from your frontend origin with credentials.
