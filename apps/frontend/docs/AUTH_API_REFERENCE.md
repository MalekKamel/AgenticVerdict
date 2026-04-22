# Authentication API Reference

Complete API reference for AgenticVerdict authentication components and hooks.

---

## Components

### AuthLayout

Layout wrapper for all authentication pages.

**Import:**

```tsx
import { AuthLayout } from "@agenticverdict/frontend/components/auth/AuthLayout";
```

**Props:**

```tsx
interface AuthLayoutProps {
  children: React.ReactNode;
  title?: string; // Page title (default: from SEO)
  subtitle?: string; // Page subtitle/description
}
```

**Usage:**

```tsx
<AuthLayout title="Sign In" subtitle="Welcome back! Please sign in to your account.">
  <LoginForm />
</AuthLayout>
```

---

### LoginForm

Login form with email/password authentication and remember-me functionality.

**Import:**

```tsx
import { LoginForm } from "@agenticverdict/frontend/components/auth/LoginForm";
```

**Props:**

```tsx
interface LoginFormProps {
  onSuccess?: () => void; // Callback after successful login
  redirectTo?: string; // Override default redirect path
  initialEmail?: string; // Pre-fill email field
  showRememberMe?: boolean; // Show remember-me checkbox (default: true)
}
```

**Features:**

- Email and password validation
- Remember me checkbox (7-day vs 24-hour session)
- Loading states with spinner
- Error display with ARIA alerts
- Keyboard navigation (Enter to submit)
- Auto-focus on email input
- Navigation to forgot-password and registration
- Full RTL/LTR support

**Usage:**

```tsx
import { LoginForm } from "@agenticverdict/frontend/components/auth/LoginForm";

export default function LoginPage() {
  return <LoginForm onSuccess={() => console.log("Logged in!")} redirectTo="/dashboard" />;
}
```

**Accessibility:**

- `role="form"` with proper labeling
- `aria-invalid` on invalid fields
- `aria-describedby` for error messages
- Keyboard: Enter submits, Tab navigates

---

### RegisterForm

User registration form with password strength indicator and email verification flow.

**Import:**

```tsx
import { RegisterForm } from "@agenticverdict/frontend/components/auth/RegisterForm";
```

**Props:**

```tsx
interface RegisterFormProps {
  onSuccess?: () => void; // Callback after successful registration
  redirectTo?: string; // Redirect path after registration (default: /auth/verify-email)
  showTerms?: boolean; // Show terms agreement checkbox (default: true)
}
```

**Features:**

- Email validation with format checking
- Password strength indicator (5 levels)
- Real-time password requirements checklist
- Password confirmation with matching validation
- Terms of Service agreement checkbox
- First/last name fields
- Loading states
- Error handling
- Keyboard navigation
- Full RTL/LTR support

**Password Requirements:**

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

**Usage:**

```tsx
import { RegisterForm } from "@agenticverdict/frontend/components/auth/RegisterForm";

export default function RegisterPage() {
  return <RegisterForm onSuccess={() => router.push("/auth/verify-email")} />;
}
```

**Accessibility:**

- Password strength announced to screen readers
- Requirement checklist uses ARIA roles
- Form validation with `aria-invalid`
- Keyboard navigation support

---

### ForgotPasswordForm

Password reset request form with generic security messages (prevents email enumeration).

**Import:**

```tsx
import { ForgotPasswordForm } from "@agenticverdict/frontend/components/auth/ForgotPasswordForm";
```

**Props:**

```tsx
interface ForgotPasswordFormProps {
  onSuccess?: () => void; // Callback after successful request
  backToLoginPath?: string; // Path for "Back to Sign In" link (default: /auth/login)
}
```

**Features:**

- Email validation
- Generic success message (prevents email enumeration)
- Loading states
- Error handling
- Navigation back to login
- Auto-focus on email input
- Keyboard navigation

**Security:**

- Generic success message for both existing and non-existing emails
- Prevents attackers from determining registered email addresses

**Usage:**

```tsx
import { ForgotPasswordForm } from "@agenticverdict/frontend/components/auth/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
```

---

### ResetPasswordForm

Password reset confirmation form with token validation and password strength indicator.

**Import:**

```tsx
import { ResetPasswordForm } from "@agenticverdict/frontend/components/auth/ResetPasswordForm";
```

**Props:**

```tsx
interface ResetPasswordFormProps {
  token: string; // Reset token from URL query parameter
  onSuccess?: () => void; // Callback after successful reset
  backToLoginPath?: string; // Path for "Back to Sign In" link
}
```

**Features:**

- New password field with strength indicator
- Confirm password field with matching validation
- Token validation from URL
- Real-time password requirements checklist
- Visual strength indicator (color-coded)
- Expired/used token error handling
- "Request new link" option for invalid tokens
- Loading states
- Auto-redirect to login after success
- Keyboard navigation

**Usage:**

```tsx
"use client";

import { ResetPasswordForm } from "@agenticverdict/frontend/components/auth/ResetPasswordForm";
import { useRouterState } from "@tanstack/react-router";

export default function ResetPasswordPage() {
  const search = useRouterState({ select: (s) => s.location.search });
  const token = new URLSearchParams(search).get("token") || "";

  if (!token) {
    return <div>Invalid reset link</div>;
  }

  return <ResetPasswordForm token={token} />;
}
```

---

### PasswordInput

Password input field with visibility toggle (show/hide).

**Import:**

```tsx
import { PasswordInput } from "@agenticverdict/frontend/components/auth/PasswordInput";
```

**Props:**

```tsx
interface PasswordInputProps extends Omit<React.ComponentProps<"input">, "type"> {
  label?: string; // Field label
  placeholder?: string; // Placeholder text
  error?: string; // Error message to display
  required?: boolean; // Required field (default: false)
  showStrengthIndicator?: boolean; // Show password strength (default: false)
  value: string;
  onChange: (value: string) => void;
}
```

**Features:**

- Show/hide password toggle with eye icon
- ARIA label for toggle button
- Error display with icon
- Optional password strength indicator
- Full RTL support

**Usage:**

```tsx
import { PasswordInput } from "@agenticverdict/frontend/components/auth/PasswordInput";

function MyForm() {
  const [password, setPassword] = useState("");

  return (
    <PasswordInput
      label="Password"
      placeholder="Enter your password"
      value={password}
      onChange={setPassword}
      required
      showStrengthIndicator
    />
  );
}
```

---

### AuthError

Error message display component with ARIA alerts.

**Import:**

```tsx
import { AuthError } from "@agenticverdict/frontend/components/auth/AuthError";
```

**Props:**

```tsx
interface AuthErrorProps {
  message: string; // Error message to display
  onDismiss?: () => void; // Optional dismiss callback
  dismissible?: boolean; // Show dismiss button (default: true)
  icon?: React.ReactNode; // Custom icon (default: error icon)
}
```

**Features:**

- Error icon
- Dismissible (X button)
- `role="alert"` for screen readers
- `aria-live="assertive"` for immediate announcement
- Auto-dismiss option
- Error styling

**Usage:**

```tsx
import { AuthError } from "@agenticverdict/frontend/components/auth/AuthError";

function LoginForm() {
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      {error && <AuthError message={error} onDismiss={() => setError(null)} />}
      {/* Form fields */}
    </>
  );
}
```

---

### AuthSuccess

Success message display component with ARIA live regions.

**Import:**

```tsx
import { AuthSuccess } from "@agenticverdict/frontend/components/auth/AuthSuccess";
```

**Props:**

```tsx
interface AuthSuccessProps {
  message: string; // Success message to display
  onDismiss?: () => void; // Optional dismiss callback
  autoDismiss?: boolean; // Auto-dismiss after 5 seconds (default: true)
  autoDismissDelay?: number; // Delay before auto-dismiss (ms)
}
```

**Features:**

- Success icon (checkmark)
- Green theme
- `role="status"` for screen readers
- `aria-live="polite"` for non-urgent announcement
- Auto-dismiss (default: 5 seconds)
- Dismissible (X button)

**Usage:**

```tsx
import { AuthSuccess } from "@agenticverdict/frontend/components/auth/AuthSuccess";

function ResetPasswordForm() {
  const [success, setSuccess] = useState(false);

  return (
    <>
      {success && (
        <AuthSuccess message="Password reset successfully!" onDismiss={() => setSuccess(false)} />
      )}
      {/* Form fields */}
    </>
  );
}
```

---

## Hooks

### useAuth

Access authentication state and actions from TanStack Store.

**Import:**

```tsx
import { useAuth } from "@agenticverdict/frontend/hooks/useAuth";
```

**Returns:**

```tsx
interface UseAuthReturn {
  // State
  isAuthenticated: boolean; // Authentication status
  user: User | null; // Current user data
  tenantId: string | null; // Current tenant ID
  isLoading: boolean; // Loading state
  error: Error | null; // Current error

  // Computed
  hasUser: boolean; // Shorthand for user !== null
  isEmailVerified: boolean; // Email verification status
  userFullName: string | undefined; // Full name (firstName + lastName)

  // Actions
  setAuth: (auth: AuthState) => void;
  setUser: (user: User | null) => void;
  setTenantId: (tenantId: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: Error | null) => void;
  clearError: () => void;
  logout: () => Promise<void>;
}
```

**Usage:**

```tsx
import { useAuth } from "@agenticverdict/frontend/hooks/useAuth";

function DashboardHeader() {
  const { user, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) {
    return <PleaseLogin />;
  }

  return (
    <header>
      <h1>Welcome, {user?.firstName}!</h1>
      <button onClick={logout}>Logout</button>
    </header>
  );
}
```

---

### useRequireAuth

Protect routes that require authentication. Redirects unauthenticated users.

**Import:**

```tsx
import { useRequireAuth } from "@agenticverdict/frontend/hooks/useRequireAuth";
```

**Parameters:**

```tsx
interface UseRequireAuthOptions {
  onUnauthorized?: () => void; // Callback when user is not authenticated
  redirectTo?: string; // Redirect path for unauthenticated users
}
```

**Returns:**

```tsx
interface UseRequireAuthReturn {
  user: User; // Current user (guaranteed to be non-null if authenticated)
  isAuthenticated: boolean;
  isLoading: boolean;
}
```

**Usage:**

```tsx
import { useRequireAuth } from "@agenticverdict/frontend/hooks/useRequireAuth";
import { useRouter } from "@/i18n/navigation";

function DashboardPage() {
  const router = useRouter();
  const { user, isLoading } = useRequireAuth({
    onUnauthorized: () => router.push("/auth/login"),
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <h1>Welcome, {user.firstName}!</h1>
      <DashboardContent />
    </div>
  );
}
```

---

### useLoginMutation

Login form mutation hook with tRPC integration.

**Import:**

```tsx
import { useLoginMutation } from "@agenticverdict/frontend/hooks/useLoginMutation";
```

**Returns:**

```tsx
// Returns TanStack Query UseMutationResult
UseMutationResult<
  void, // Success data (void - redirect happens)
  Error, // Error type
  LoginFormData, // Mutation variables
  unknown // Context
>;
```

**Mutation Variables:**

```tsx
interface LoginFormData {
  email: string;
  password: string;
  rememberMe?: boolean;
}
```

**Usage:**

```tsx
import { useLoginMutation } from "@agenticverdict/frontend/hooks/useLoginMutation";
import { useForm } from "@mantine/form";

function LoginForm() {
  const loginMutation = useLoginMutation();
  const form = useForm({
    initialValues: { email: "", password: "", rememberMe: false },
  });

  const handleSubmit = async (values: LoginFormData) => {
    try {
      await loginMutation.mutateAsync(values);
      // Success - redirect happens automatically
    } catch (error) {
      // Error is handled by the hook
    }
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      {/* Form fields */}
      <button type="submit" disabled={loginMutation.isPending}>
        {loginMutation.isPending ? "Signing in..." : "Sign In"}
      </button>
    </form>
  );
}
```

**Behavior:**

- On success: Stores auth data and redirects to `/dashboard`
- On error: Displays generic error message (prevents email enumeration)
- Loading state: `isPending` is true during request

---

### useRegisterMutation

Registration form mutation hook with tRPC integration.

**Import:**

```tsx
import { useRegisterMutation } from "@agenticverdict/frontend/hooks/useRegisterMutation";
```

**Mutation Variables:**

```tsx
interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  acceptTerms: boolean;
}
```

**Usage:**

```tsx
import { useRegisterMutation } from "@agenticverdict/frontend/hooks/useRegisterMutation";

function RegisterForm() {
  const registerMutation = useRegisterMutation();

  const handleSubmit = async (values: RegisterFormData) => {
    try {
      await registerMutation.mutateAsync(values);
      // Success - redirect to verification page
    } catch (error) {
      // Error handling
    }
  };

  return <form onSubmit={handleSubmit}>{/* ... */}</form>;
}
```

**Behavior:**

- On success: Redirects to `/auth/verify-email`
- On error: Displays validation or API errors

---

### usePasswordReset

Combined hook for password reset request and confirmation.

**Import:**

```tsx
import { usePasswordReset } from "@agenticverdict/frontend/hooks/usePasswordReset";
```

**Returns:**

```tsx
interface UsePasswordResetReturn {
  // Request password reset
  requestReset: UseMutationResult<void, Error, { email: string }>;

  // Confirm password reset
  confirmReset: UseMutationResult<
    void,
    Error,
    {
      token: string;
      password: string;
      confirmPassword: string;
    }
  >;
}
```

**Usage:**

```tsx
import { usePasswordReset } from "@agenticverdict/frontend/hooks/usePasswordReset";

function ForgotPasswordForm() {
  const { requestReset } = usePasswordReset();

  const handleSubmit = async (email: string) => {
    await requestReset.mutateAsync({ email });
    // Show success message
  };

  return <form onSubmit={handleSubmit}>{/* ... */}</form>;
}

function ResetPasswordForm({ token }: { token: string }) {
  const { confirmReset } = usePasswordReset();

  const handleSubmit = async (password: string, confirmPassword: string) => {
    await confirmReset.mutateAsync({ token, password, confirmPassword });
    // Redirect to login
  };

  return <form onSubmit={handleSubmit}>{/* ... */}</form>;
}
```

---

## Validation Schemas

### loginSchema

Zod schema for login form validation.

```tsx
import { loginSchema } from '@agenticverdict/frontend/lib/validations/auth';

// Schema shape:
{
  email: string (email format, required)
  password: string (min 8 chars, required)
  rememberMe?: boolean (default: false)
}
```

**Usage:**

```tsx
import { useForm } from "@mantine/form";
import { zodResolver } from "@mantine/form/zod-resolver";
import { loginSchema } from "@agenticverdict/frontend/lib/validations/auth";

const form = useForm({
  initialValues: { email: "", password: "", rememberMe: false },
  validate: zodResolver(loginSchema),
});
```

---

### registerSchema

Zod schema for registration form validation.

```tsx
import { registerSchema } from '@agenticverdict/frontend/lib/validations/auth';

// Schema shape:
{
  email: string (email format, required)
  password: string (min 8, uppercase, lowercase, number, special)
  confirmPassword: string (must match password)
  firstName: string (min 2, max 50, required)
  lastName: string (min 2, max 50, required)
  acceptTerms: boolean (must be true)
}
```

---

### forgotPasswordSchema

Zod schema for forgot password form.

```tsx
{
  email: string (email format, required)
}
```

---

### resetPasswordSchema

Zod schema for reset password form.

```tsx
{
  password: string (min 8, uppercase, lowercase, number, special)
  confirmPassword: string (must match password)
}
```

---

## Type Definitions

### User

```tsx
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  emailVerified: boolean;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### AuthState

```tsx
interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  tenantId: string | null;
  isLoading: boolean;
  error: Error | null;
}
```

---

## Best Practices

### 1. Error Handling

Always use AuthError component for user-facing errors:

```tsx
// ✅ Good
{
  error && <AuthError message={error.message} />;
}

// ❌ Bad
{
  error && <div className="error">{error.message}</div>;
}
```

### 2. Loading States

Use mutation's `isPending` state for loading feedback:

```tsx
<button type="submit" disabled={loginMutation.isPending}>
  {loginMutation.isPending ? <Spinner /> : "Sign In"}
</button>
```

### 3. Accessibility

Always provide ARIA labels for icon-only buttons:

```tsx
<Icon aria-label="Toggle password visibility" onClick={toggleVisibility} />
```

### 4. RTL Support

Use logical properties for spacing:

```tsx
// ✅ Good (works for RTL)
style={{ marginInlineStart: '1rem' }}

// ❌ Bad (breaks RTL)
style={{ marginLeft: '1rem' }}
```

### 5. Form Validation

Always use Zod schemas with @mantine/form:

```tsx
import { zodResolver } from "@mantine/form/zod-resolver";

const form = useForm({
  validate: zodResolver(loginSchema),
});
```

---

**Generated**: 2026-04-14
**Version**: 1.0.0
**Maintainer**: AgenticVerdict Team
