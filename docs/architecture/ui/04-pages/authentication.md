# Authentication Pages

**Version:** 1.0
**Last Updated:** 2026-04-13
**Status:** Active
**Related Specs:**

- [Business Architecture: Multi-Tenancy](/docs/architecture/business/business-architecture.md#6-multi-tenancy-model)
- [Technical Architecture: Security](/docs/architecture/business/technical-architecture.md#security-architecture)
- [UI Overview: Accessibility](/docs/architecture/ui/00-overview.md#1-accessibility-without-compromise)

---

## Table of Contents

1. [Login Page](#login-page)
2. [Registration Page](#registration-page)
3. [Password Reset Request Page](#password-reset-request-page)
4. [Password Reset Confirm Page](#password-reset-confirm-page)
5. [Email Verification Page](#email-verification-page)

---

## Login Page

### Overview

Primary authentication entry point for existing users. Supports email/password authentication, OAuth providers, session persistence, and password recovery initiation.

### User Goal

- **Primary Goal:** Authenticate and access the platform dashboard
- **Secondary Goals:** Recover forgotten password, register new account, switch OAuth providers

### Page Layout

**Wireframe Description:**

```
┌─────────────────────────────────────────────────────┐
│                    [Logo]                           │
│               AgenticVerdict                        │
│                                                       │
│              Welcome Back!                          │
│           Sign in to your account                   │
│                                                       │
│  ┌─────────────────────────────────────────────┐   │
│  │  Email                                       │   │
│  │  [email input field]                         │   │
│  └─────────────────────────────────────────────┘   │
│                                                       │
│  ┌─────────────────────────────────────────────┐   │
│  │  Password                                    │   │
│  │  [password field]  [Show/Hide]              │   │
│  └─────────────────────────────────────────────┘   │
│                                                       │
│  [x] Remember me    Forgot password?                │
│                                                       │
│  ┌─────────────────────────────────────────────┐   │
│  │         [Sign In]                            │   │
│  └─────────────────────────────────────────────┘   │
│                                                       │
│              ──── or ────                            │
│                                                       │
│   [Google]    [Microsoft]    [Apple]                 │
│                                                       │
│          Don't have an account?                      │
│              Sign up now                             │
│                                                       │
│          © 2026 AgenticVerdict                       │
└─────────────────────────────────────────────────────┘
```

**Layout Behavior:**

- **Desktop (>1024px):** Centered card, 480px width, full vertical center
- **Tablet (768-1024px):** Centered card, 400px width, vertical center
- **Mobile (<768px):** Full-width card, 24px horizontal padding

### Components

**Component Tree:**

```
AuthLayout (Template)
├── AuthCard (Organism)
│   ├── Logo (Atom)
│   ├── Typography (Atom) - "Welcome Back!"
│   ├── Form (Organism)
│   │   ├── FormField (Molecule)
│   │   │   ├── Label (Atom)
│   │   │   ├── TextInput (Atom)
│   │   │   └── ErrorText (Atom)
│   │   ├── FormField (Molecule)
│   │   │   ├── Label (Atom)
│   │   │   ├── PasswordInput (Molecule)
│   │   │   │   ├── TextInput (Atom)
│   │   │   │   └── IconButton (Atom) - Show/Hide
│   │   │   └── ErrorText (Atom)
│   │   ├── Checkbox (Molecule)
│   │   │   ├── CheckboxInput (Atom)
│   │   │   └── Label (Atom) - "Remember me"
│   │   └── Link (Atom) - "Forgot password?"
│   ├── Button (Atom) - Primary "Sign In"
│   ├── Divider (Atom) - "or"
│   ├── OAuthButtons (Organism)
│   │   ├── OAuthButton (Molecule) - Google
│   │   ├── OAuthButton (Molecule) - Microsoft
│   │   └── OAuthButton (Molecule) - Apple
│   └── Footer (Molecule)
│       ├── Typography (Atom) - "Don't have an account?"
│       └── Link (Atom) - "Sign up now"
└── Footer (Organism)
    ├── Typography (Atom) - Copyright
    └── Links (Molecule) - Privacy, Terms
```

**Component Details:**

**AuthCard**

- Background: White with subtle shadow
- Border radius: 12px
- Padding: 40px (desktop), 32px (tablet), 24px (mobile)
- Max width: 480px

**FormField**

- Label: 14px, semibold, text-secondary
- Input: 44px height, full width, 8px border radius
- Error: 12px, text-error, below input
- Focus: 2px primary color border, offset

**OAuthButton**

- Icon + provider name (e.g., "Continue with Google")
- Full width, 44px height
- Provider brand colors (Google blue, Microsoft blue, Apple black)
- Hover: Slight background darken

### States

**1. Initial State**

- Email and password fields empty
- Sign in button disabled
- "Remember me" unchecked by default
- No validation errors

**2. Validation State**

- Email: Shows error if invalid format
- Password: Shows error if empty (< 8 characters)
- Real-time validation on blur
- Submit button disabled until valid

**3. Loading State**

- Submit button shows spinner
- Button text changes to "Signing in..."
- All form fields disabled
- OAuth buttons disabled
- Prevent double submission

**4. Error State**

- Toast notification: "Invalid email or password"
- Inline field errors for specific issues
- Button returns to normal state
- Form remains populated for retry
- "Contact support" link if persists

**5. Success State**

- Button shows success checkmark
- Brief success message
- Auto-redirect to dashboard after 500ms
- Session token stored

**6. Rate Limit State**

- Error: "Too many login attempts. Please try again in 15 minutes."
- Countdown timer shown
- "Forgot password?" link emphasized
- Support contact option

### Navigation

**Entry Points:**

- Direct URL: `/login`
- Redirect from protected routes when unauthenticated
- OAuth provider redirect callback
- Post-registration redirect
- Post-password-reset redirect

**Exits:**

- **Successful login:** Redirect to dashboard (`/dashboard`)
- **OAuth login:** Redirect to OAuth provider, then back
- **Forgot password:** Navigate to `/forgot-password`
- **Sign up:** Navigate to `/register`

**Query Parameters:**

- `?redirect=/path` - Post-login redirect destination
- `?session=expired` - Show "session expired" message
- `?oauth=provider` - Auto-trigger OAuth flow

### Permissions

- **Public Access:** No authentication required
- **Rate Limiting:** 5 attempts per 15 minutes per IP
- **Account Lockout:** Temporary lock after 10 failed attempts

### Responsive Breakpoints

**Desktop (>1024px):**

- Centered card with 480px max width
- Full vertical centering
- OAuth buttons in row (3 columns)
- Ambient background pattern

**Tablet (768-1024px):**

- Centered card with 400px max width
- OAuth buttons in row (3 columns)
- Reduced padding (32px)

**Mobile (<768px):**

- Full-width card (100% - 48px)
- OAuth buttons stacked vertically
- 24px horizontal padding
- Simplified background

### Accessibility

**Focus Management:**

- Auto-focus email field on page load
- Logical tab order: email → password → checkbox → sign in → OAuth → links
- Visible focus indicator: 2px primary color outline
- Focus trap within modal (if implemented)

**Screen Reader Support:**

- `role="form"` with `aria-label="Login form"`
- `aria-required="true"` for required fields
- `aria-invalid="true"` for validation errors
- `aria-describedby` links error messages to inputs
- `aria-live="polite"` for toast notifications

**Keyboard Navigation:**

- Enter submits form when valid
- Escape clears form (optional)
- Tab/Shift+Tab navigates all controls
- Shortcuts not applicable (form context)

**Color Contrast:**

- Text: Minimum 4.5:1 against background
- Links: 3:1 for interactive elements
- Focus indicators: 3:1 against adjacent colors
- Error messages: 4.5:1 (text-error color)

**ARIA Labels:**

```html
<form role="form" aria-label="Login form">
  <input
    aria-label="Email address"
    aria-required="true"
    aria-invalid="false"
    aria-describedby="email-error"
  />
  <div id="email-error" role="alert" aria-live="polite"></div>
</form>
```

### Internationalization

**Translation Keys:**

```typescript
// Page structure
'auth.login.title': 'Welcome Back!'
'auth.login.subtitle': 'Sign in to your account'
'auth.login.email': 'Email'
'auth.login.password': 'Password'
'auth.login.rememberMe': 'Remember me'
'auth.login.forgotPassword': 'Forgot password?'
'auth.login.submit': 'Sign In'
'auth.login.or': 'or'
'auth.login.oauth.google': 'Continue with Google'
'auth.login.oauth.microsoft': 'Continue with Microsoft'
'auth.login.oauth.apple': 'Continue with Apple'
'auth.login.noAccount': "Don't have an account?"
'auth.login.signUp': 'Sign up now'
'auth.login.footer.copyright': '© 2026 AgenticVerdict'

// Validation
'auth.login.errors.emailInvalid': 'Please enter a valid email address'
'auth.login.errors.emailRequired': 'Email is required'
'auth.login.errors.passwordRequired': 'Password is required'
'auth.login.errors.passwordTooShort': 'Password must be at least 8 characters'
'auth.login.errors.invalidCredentials': 'Invalid email or password'
'auth.login.errors.tooManyAttempts': 'Too many login attempts. Please try again in {minutes} minutes.'
'auth.login.errors.accountLocked': 'Account temporarily locked. Please reset your password.'

// Success messages
'auth.login.success': 'Login successful. Redirecting...'
```

**RTL Layout Differences:**

- Logo centered (no change)
- Form fields mirrored (text-align: start)
- Checkbox checkmark on right (logical)
- "Remember me" checkbox positioned before label text (RTL: after)
- OAuth buttons maintain left-to-right icon positioning
- Footer links mirrored

**Text Alignment:**

- LTR: `text-align: left`
- RTL: `text-align: right`
- Centered elements remain centered

**Icon Mirroring:**

- Arrow icons (if any) flipped horizontally
- Caret icons in dropdowns mirrored
- Checkbox icons mirrored

### Related Entities/Workflows

**Business Processes:**

- [User Authentication](/docs/architecture/business/business-architecture.md#3-business-processes)
- [Session Management](/docs/architecture/business/technical-architecture.md#security-architecture)
- [OAuth Integration](/docs/architecture/business/technical-architecture.md#authentication-authorization)

**Technical Specifications:**

- JWT token storage (HttpOnly cookies)
- Session refresh flow
- OAuth provider integrations (Google, Microsoft, Apple)
- Password hashing (bcrypt)
- Rate limiting implementation

---

## Registration Page

### Overview

Multi-step registration flow for new companies and users. Collects company information, user details, and authentication credentials. Supports both direct businesses and agency partners.

### User Goal

- **Primary Goal:** Create a new company account and user credentials
- **Secondary Goals:** Select plan type, understand feature differences, complete onboarding

### Page Layout

**Multi-Step Flow:**

```
Step 1: Account Type → Step 2: Company Info → Step 3: User Account → Step 4: Confirmation
```

**Wireframe Description (Step 2 - Company Info):**

```
┌─────────────────────────────────────────────────────┐
│                    [Logo]                           │
│               Create Your Account                   │
│                                                       │
│  ┌────┐   ┌────┐   ┌────┐   ┌────┐                 │
│  │ 1  │ → │ 2  │ → │ 3  │ → │ 4  │                 │
│  │ ✓  │   │ ●  │   │    │   │    │                 │
│  └────┘   └────┘   └────┘   └────┘                 │
│                                                       │
│  Step 2 of 4: Company Information                    │
│                                                       │
│  ┌─────────────────────────────────────────────┐   │
│  │  Company Name                                │   │
│  │  [input field]                               │   │
│  └─────────────────────────────────────────────┘   │
│                                                       │
│  ┌─────────────────────────────────────────────┐   │
│  │  Industry                                    │   │
│  │  [select dropdown]                           │   │
│  └─────────────────────────────────────────────┘   │
│                                                       │
│  ┌─────────────────────────────────────────────┐   │
│  │  Company Size                                │   │
│  │  ○ 1-10 employees   ○ 11-50 employees       │   │
│  │  ○ 51-200 employees ○ 200+ employees        │   │
│  └─────────────────────────────────────────────┘   │
│                                                       │
│  ┌─────────────────────────────────────────────┐   │
│  │  [Upload Logo]                               │   │
│  └─────────────────────────────────────────────┘   │
│                                                       │
│  ┌───────┐         ┌──────────────────────┐        │
│  │ Back  │         │  Continue             │        │
│  └───────┘         └──────────────────────┘        │
│                                                       │
│          Already have an account? Sign in            │
└─────────────────────────────────────────────────────┘
```

**Layout Behavior:**

- **Desktop:** Centered card, 560px width, progress bar visible
- **Tablet:** Centered card, 480px width
- **Mobile:** Full-width card, stacked steps

### Components

**Component Tree (Step 2):**

```
AuthLayout (Template)
├── AuthCard (Organism)
│   ├── Logo (Atom)
│   ├── ProgressStepper (Molecule)
│   │   ├── Step (Atom) - Account Type (completed)
│   │   ├── Step (Atom) - Company Info (current)
│   │   ├── Step (Atom) - User Account (upcoming)
│   │   └── Step (Atom) - Confirmation (upcoming)
│   ├── Typography (Atom) - Step title
│   ├── Form (Organism)
│   │   ├── FormField (Molecule) - Company Name
│   │   ├── FormField (Molecule) - Industry (Select)
│   │   ├── RadioGroup (Molecule) - Company Size
│   │   │   ├── Radio (Atom) - 1-10 employees
│   │   │   ├── Radio (Atom) - 11-50 employees
│   │   │   ├── Radio (Atom) - 51-200 employees
│   │   │   └── Radio (Atom) - 200+ employees
│   │   └── FileUpload (Molecule) - Logo
│   │       ├── Dropzone (Atom)
│   │       ├── FilePreview (Molecule)
│   │       └── RemoveButton (Atom)
│   └── FormActions (Molecule)
│       ├── Button (Atom) - Secondary "Back"
│       └── Button (Atom) - Primary "Continue"
│   └── Footer (Molecule)
│       └── Link (Atom) - "Already have an account? Sign in"
└── Footer (Organism)
```

**Step 1: Account Type**

- Two cards: "Direct Business" vs "Agency Partner"
- Feature comparison table
- Selection explanation
- Continue button

**Step 3: User Account**

- Full name
- Email address
- Password (with strength indicator)
- Confirm password
- Terms of service checkbox
- Create account button

**Step 4: Confirmation**

- Success illustration
- Account created message
- Email verification notice
- "Go to dashboard" button (disabled until verified)

### States

**Step 1 (Account Type):**

- **Initial:** Both options available, none selected
- **Selected:** Highlight card, show brief explanation
- **Loading:** Continue button disabled, spinner
- **Error:** Error toast if type selection fails

**Step 2 (Company Info):**

- **Initial:** All fields empty, back button enabled
- **Validation:** Real-time validation, continue disabled until valid
- **Loading:** Continue button shows spinner
- **Error:** Inline field errors, toast for API failures
- **Success:** Store data, advance to step 3

**Step 3 (User Account):**

- **Initial:** All fields empty, password strength hidden
- **Typing:** Password strength indicator updates (weak/medium/strong)
- **Validation:** Email format, password matching, terms required
- **Loading:** Create account button shows spinner
- **Success:** Advance to step 4

**Step 4 (Confirmation):**

- **Loading:** Show spinner, "Creating your account..."
- **Success:** Success animation, email verification notice
- **Pending Verification:** Dashboard button disabled, "Check your email" message
- **Verified:** Dashboard button enabled, auto-redirect available

### Navigation

**Entry Points:**

- Direct URL: `/register`
- Login page "Sign up now" link
- OAuth registration flow
- Invitations (agency partners inviting team members)

**Exits:**

- **Complete registration:** Redirect to email verification page
- **After verification:** Redirect to dashboard onboarding
- **Cancel:** Return to login page (with confirmation if data entered)
- **OAuth flow:** Redirect to provider, then back with user data

**Query Parameters:**

- `?plan=free|pro|enterprise` - Pre-select plan
- `?type=direct|agency` - Pre-select account type
- `?invite=code` - Accept team invitation
- `?oauth=provider` - Auto-trigger OAuth registration

### Permissions

- **Public Access:** No authentication required
- **Rate Limiting:** 3 registrations per hour per IP
- **Email Verification:** Required before dashboard access
- **Plan Limits:** Enforce connector/user limits based on plan

### Responsive Breakpoints

**Desktop (>1024px):**

- Progress stepper horizontal
- Company type cards side-by-side
- File upload dropzone with preview

**Tablet (768-1024px):**

- Progress stepper horizontal
- Slightly reduced padding
- Company type cards stacked if needed

**Mobile (<768px):**

- Progress stepper vertical (numbered list)
- Company type cards stacked
- File upload simplified (button only)
- Single column layout

### Accessibility

**Focus Management:**

- Focus first field of each step on load
- Focus trap within step until valid
- Logical tab order through form fields
- Focus visible on all interactive elements

**Screen Reader Support:**

- `role="progressbar"` for stepper
- `aria-valuenow="2"` for current step
- `aria-label` for each step
- `aria-invalid` for validation errors
- `aria-describedby` for field help text
- `aria-live` for password strength updates

**Keyboard Navigation:**

- Enter submits step if valid
- Escape shows cancel confirmation
- Arrow keys navigate radio groups
- Tab/Shift+Tab through all controls

**Error Handling:**

- `role="alert"` for error messages
- Clear error text linked to fields
- Suggested corrections when possible
- Error summary at top of form

**ARIA Labels:**

```html
<div
  role="progressbar"
  aria-valuenow="2"
  aria-valuemin="1"
  aria-valuemax="4"
  aria-label="Registration progress: Step 2 of 4"
>
  <span aria-current="step">Company Information</span>
</div>
```

### Internationalization

**Translation Keys:**

```typescript
'auth.register.title': 'Create Your Account'
'auth.register.steps.accountType': 'Account Type'
'auth.register.steps.companyInfo': 'Company Information'
'auth.register.steps.userAccount': 'User Account'
'auth.register.steps.confirmation': 'Confirmation'
'auth.register.types.direct': 'Direct Business'
'auth.register.types.agency': 'Agency Partner'
'auth.register.company.name': 'Company Name'
'auth.register.company.industry': 'Industry'
'auth.register.company.size': 'Company Size'
'auth.register.user.fullName': 'Full Name'
'auth.register.user.email': 'Email Address'
'auth.register.user.password': 'Password'
'auth.register.user.confirmPassword': 'Confirm Password'
'auth.register.user.terms': 'I agree to the Terms of Service and Privacy Policy'
'auth.register.success.title': 'Account Created Successfully!'
'auth.register.success.message': 'Please check your email to verify your account.'
'auth.register.errors.passwordMismatch': 'Passwords do not match'
'auth.register.errors.emailInUse': 'This email is already registered'
'auth.register.errors.termsRequired': 'You must agree to the terms to continue'
```

**RTL Layout Differences:**

- Progress stepper reversed (step 4 → 3 → 2 → 1 visually)
- Radio buttons mirrored (checkmark on right in RTL)
- Step arrows reversed direction
- File upload preview mirrored

**Content Mirroring:**

- Account type cards maintain layout but text aligns RTL
- Logo upload preview aligned appropriately
- Back button positioned right, Continue button left (in RTL)

---

## Password Reset Request Page

### Overview

Initiates password recovery flow by collecting email address and sending reset token via email. Part of the forgot password workflow.

### User Goal

- **Primary Goal:** Request password reset link via email
- **Secondary Goal:** Return to login, contact support

### Page Layout

**Wireframe Description:**

```
┌─────────────────────────────────────────────────────┐
│                    [Logo]                           │
│               Reset Your Password                   │
│                                                       │
│  Enter your email address and we'll send you        │
│  a link to reset your password.                     │
│                                                       │
│  ┌─────────────────────────────────────────────┐   │
│  │  Email Address                               │   │
│  │  [email input field]                         │   │
│  └─────────────────────────────────────────────┘   │
│                                                       │
│  ┌─────────────────────────────────────────────┐   │
│  │         [Send Reset Link]                   │   │
│  └─────────────────────────────────────────────┘   │
│                                                       │
│  [← Back to Login]                                  │
│                                                       │
│          © 2026 AgenticVerdict                       │
└─────────────────────────────────────────────────────┘
```

### Components

**Component Tree:**

```
AuthLayout (Template)
├── AuthCard (Organism)
│   ├── Logo (Atom)
│   ├── Typography (Atom) - Title
│   ├── Typography (Atom) - Description
│   ├── Form (Organism)
│   │   └── FormField (Molecule)
│   │       ├── Label (Atom)
│   │       ├── TextInput (Atom)
│   │       └── ErrorText (Atom)
│   ├── Button (Atom) - Primary "Send Reset Link"
│   └── Link (Atom) - "Back to Login"
└── Footer (Organism)
```

### States

**1. Initial State**

- Email field empty, focused
- Send button disabled
- Back to login enabled

**2. Validation State**

- Email validated on blur
- Format validation: `email` type
- Submit enabled when valid

**3. Loading State**

- Button shows spinner
- Button text: "Sending..."
- Form disabled
- Prevent double submission

**4. Success State**

- Success illustration (checkmark)
- Success message: "Check your email for reset link"
- Email address shown for confirmation
- "Resend link" button appears after 60 seconds
- Back to login link available

**5. Error State**

- Error toast: "Unable to send reset link"
- Inline email validation errors
- Support contact link
- Form remains populated

**6. Rate Limit State**

- Error: "Too many reset requests. Please try again in 15 minutes."
- Countdown timer shown
- Support contact emphasized

### Navigation

**Entry Points:**

- Direct URL: `/forgot-password`
- Login page "Forgot password?" link
- Direct navigation from expired reset link

**Exits:**

- **Success:** Stay on page, show success state, resend option
- **Back to login:** Navigate to `/login`
- **Email link:** Navigate to `/reset-password?token=xxx`

### Permissions

- **Public Access:** No authentication required
- **Rate Limiting:** 3 requests per hour per email
- **Token Expiry:** Reset link expires in 1 hour

---

## Password Reset Confirm Page

### Overview

Final step of password recovery flow. User enters new password after clicking email link with reset token.

### User Goal

- **Primary Goal:** Set new password with valid token
- **Secondary Goal:** Understand why token expired, request new link

### Page Layout

**Wireframe Description:**

```
┌─────────────────────────────────────────────────────┐
│                    [Logo]                           │
│               Set New Password                      │
│                                                       │
│  Enter your new password below.                     │
│                                                       │
│  ┌─────────────────────────────────────────────┐   │
│  │  New Password                                │   │
│  │  [password field]  [Show/Hide]               │   │
│  │  Strength: ████████░░ Strong                 │   │
│  └─────────────────────────────────────────────┘   │
│                                                       │
│  ┌─────────────────────────────────────────────┐   │
│  │  Confirm New Password                        │   │
│  │  [password field]  [Show/Hide]               │   │
│  └─────────────────────────────────────────────┘   │
│                                                       │
│  ✓ At least 8 characters                             │
│  ✓ Contains uppercase and lowercase                 │
│  ✓ Contains number or special character             │
│                                                       │
│  ┌─────────────────────────────────────────────┐   │
│  │         [Reset Password]                    │   │
│  └─────────────────────────────────────────────┘   │
│                                                       │
│          © 2026 AgenticVerdict                       │
└─────────────────────────────────────────────────────┘
```

### Components

**Component Tree:**

```
AuthLayout (Template)
├── AuthCard (Organism)
│   ├── Logo (Atom)
│   ├── Typography (Atom) - Title
│   ├── Typography (Atom) - Description
│   ├── Form (Organism)
│   │   ├── FormField (Molecule) - New Password
│   │   │   ├── Label (Atom)
│   │   │   ├── PasswordInput (Molecule)
│   │   │   ├── PasswordStrength (Molecule)
│   │   │   └── ErrorText (Atom)
│   │   └── FormField (Molecule) - Confirm Password
│   │       ├── Label (Atom)
│   │       ├── PasswordInput (Molecule)
│   │       └── ErrorText (Atom)
│   ├── PasswordRequirements (Molecule)
│   │   ├── Requirement (Atom) - 8+ characters
│   │   ├── Requirement (Atom) - Uppercase/lowercase
│   │   └── Requirement (Atom) - Number/special
│   └── Button (Atom) - Primary "Reset Password"
└── Footer (Organism)
```

### States

**1. Initial State**

- Password fields empty
- Requirements shown with ✓ marks (dimmed)
- Reset button disabled
- Token validated in background

**2. Typing State**

- Password strength indicator updates (weak/medium/strong)
- Requirements check dynamically
- Confirm password validates match
- Reset button enabled when valid

**3. Loading State**

- Reset button shows spinner
- Button text: "Resetting..."
- Form disabled
- Prevent double submission

**4. Success State**

- Success animation (checkmark)
- Success message: "Password reset successfully"
- Auto-redirect to login after 3 seconds
- "Sign in now" button

**5. Error States**

- **Token Invalid:** Error message, "Request new link" button
- **Token Expired:** Error message, "Resend email" button
- **Passwords Don't Match:** Inline error, focus confirm field
- **Password Too Weak:** Inline error, highlight unmet requirements

### Navigation

**Entry Points:**

- Direct URL: `/reset-password?token=xxx`
- Email reset link (only valid entry point)

**Exits:**

- **Success:** Auto-redirect to `/login` after 3 seconds
- **Token Invalid/Expired:** Request new link → `/forgot-password`
- **Cancel:** Return to login (discard changes)

### Permissions

- **Public Access:** Requires valid reset token
- **Token Validation:** Server-side validation
- **Rate Limiting:** 3 attempts per token

---

## Email Verification Page

### Overview

Email ownership confirmation page. Users enter verification code sent to their email address after registration.

### User Goal

- **Primary Goal:** Enter 6-digit code to verify email
- **Secondary Goals:** Resend code, change email, contact support

### Page Layout

**Wireframe Description:**

```
┌─────────────────────────────────────────────────────┐
│                    [Logo]                           │
│               Verify Your Email                     │
│                                                       │
│  We've sent a 6-digit code to:                      │
│           user@example.com                          │
│                                                       │
│  ┌─────────────────────────────────────────────┐   │
│  │  [ □ ]  [ □ ]  [ □ ]  -  [ □ ]  [ □ ]  [ □ ] │   │
│  └─────────────────────────────────────────────┘   │
│                                                       │
│  Didn't receive the code?                            │
│  Resend in 0:59                                      │
│                                                       │
│  ┌─────────────────────────────────────────────┐   │
│  │         [Verify Email]                      │   │
│  └─────────────────────────────────────────────┘   │
│                                                       │
│  Wrong email? [Change email address]                │
│                                                       │
│          © 2026 AgenticVerdict                       │
└─────────────────────────────────────────────────────┘
```

### Components

**Component Tree:**

```
AuthLayout (Template)
├── AuthCard (Organism)
│   ├── Logo (Atom)
│   ├── Typography (Atom) - Title
│   ├── Typography (Atom) - Email address
│   ├── OTPInput (Organism)
│   │   ├── OTPDigit (Atom) - Digit 1
│   │   ├── OTPDigit (Atom) - Digit 2
│   │   ├── OTPDigit (Atom) - Digit 3
│   │   ├── Separator (Atom) - Hyphen
│   │   ├── OTPDigit (Atom) - Digit 4
│   │   ├── OTPDigit (Atom) - Digit 5
│   │   └── OTPDigit (Atom) - Digit 6
│   ├── ResendSection (Molecule)
│   │   ├── Typography (Atom) - "Didn't receive code?"
│   │   ├── Countdown (Atom) - Timer (0:59)
│   │   └── Link (Atom) - "Resend" (disabled until 0:00)
│   ├── Button (Atom) - Primary "Verify Email"
│   └── Link (Atom) - "Change email address"
└── Footer (Organism)
```

### States

**1. Initial State**

- OTP fields empty, first field focused
- Resend link disabled, countdown running
- Verify button disabled
- Email address shown

**2. Typing State**

- Auto-focus next field after each digit
- Auto-focus previous field on backspace
- Paste support (auto-distribute digits)
- Verify button enabled when all 6 digits entered
- Real-time validation (numeric only)

**3. Loading State**

- Verify button shows spinner
- Button text: "Verifying..."
- All fields disabled
- Resend link disabled

**4. Success State**

- Success animation (checkmark)
- Success message: "Email verified successfully"
- Auto-redirect to dashboard after 2 seconds
- "Go to dashboard" button

**5. Error States**

- **Invalid Code:** Error message, clear fields, retry
- **Expired Code:** Error message, "Resend code" button
- **Too Many Attempts:** Rate limit error, countdown timer
- **API Error:** Error toast, support contact link

**6. Resend State**

- Countdown reaches 0:00
- "Resend" link enabled
- Click sends new code, restarts countdown
- Success toast: "New code sent"

### Navigation

**Entry Points:**

- Direct URL: `/verify-email?email=user@example.com`
- Post-registration redirect
- Resend code flow

**Exits:**

- **Success:** Auto-redirect to `/dashboard`
- **Change Email:** Navigate back to registration or show modal
- **Cancel:** Return to login (account not verified)

**Query Parameters:**

- `?email=user@example.com` - Pre-fill email address
- `?resend=true` - Auto-trigger resend (if rate limited)

### Permissions

- **Public Access:** Requires verification token from email
- **Rate Limiting:** 3 resend requests per hour, 5 verification attempts per code
- **Code Expiry:** Verification code expires in 15 minutes

---

## Shared Authentication Patterns

### Loading States Across All Pages

- **Button Loading:** Spinner + text change, prevent double-submit
- **Page Loading:** Skeleton loaders if applicable
- **Async Operations:** Toast notifications for feedback

### Error Handling Patterns

- **Inline Validation:** Real-time field-level feedback
- **API Errors:** Toast notifications with actionable messages
- **Rate Limiting:** Clear countdown timer, support contact
- **Network Errors:** Retry option, offline detection

### Success Feedback

- **Button States:** Checkmark icon, color change
- **Auto-Redirect:** Delayed navigation with countdown
- **Toast Notifications:** Success messages, next steps

### Accessibility Patterns

- **Focus Management:** Logical tab order, visible indicators
- **Screen Readers:** ARIA labels, live regions for updates
- **Keyboard Navigation:** Enter/Escape shortcuts, arrow keys
- **Color Independence:** Not reliant on color alone for meaning

### Internationalization Patterns

- **RTL Support:** Logical properties, layout mirroring
- **Translation Keys:** Namespaced, parameterized
- **Date/Number Formatting:** Locale-aware formatters
- **Text Direction:** Automatic detection via locale

---

## Document Status

**Version:** 1.0
**Last Updated:** 2026-04-13
**Status:** Active
**Next Review:** After usability testing
**Maintainer:** UI/UX Team

**Related Documents:**

- [Technical Architecture: Security](/docs/architecture/business/technical-architecture.md#security-architecture)
- [Business Architecture: Multi-Tenancy](/docs/architecture/business/business-architecture.md#6-multi-tenancy-model)
- [Accessibility Standards](/docs/architecture/ui/01-research-findings/accessibility-standards.md)
