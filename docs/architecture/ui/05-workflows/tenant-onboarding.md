# Tenant Onboarding Workflow

**Version:** 1.0
**Last Updated:** 2026-04-13
**Status:** Active
**Related Specs:**

- [Business Architecture: Multi-Tenancy Model](/docs/architecture/business/business-architecture.md#multi-tenancy-model)
- [UI Business Requirements: Tenant Setup](/docs/architecture/ui/BUSINESS_REQUIREMENTS.md#core-business-capabilities)
- [Technical Architecture: Tenant Isolation](/docs/architecture/business/technical-architecture.md#security-architecture)

---

## Overview

The Tenant Onboarding workflow guides new users through setting up their company or agency account on the AgenticVerdict platform. This comprehensive workflow captures essential business information, configures localization preferences, creates the first admin user, connects initial data platforms, generates the first insight from a recommended template, invites team members (optional), and completes with an interactive tutorial. The workflow is designed for both direct businesses and agency partners, with conditional paths for each user type.

**Business Context:** Tenant onboarding is the critical first impression that determines user activation and long-term retention. The workflow must balance comprehensive setup with frictionless progress, offering "skip for later" options while ensuring sufficient configuration for immediate value.

---

## User Goal

Set up a new company or agency account on AgenticVerdict with sufficient configuration to start receiving AI-powered insights within the first session.

**Primary Users:**

- **Direct Business Owners**: Setting up their own company account
- **Agency Owners**: Setting up agency account to manage multiple clients
- **IT Administrators**: Configuring platform on behalf of business users

---

## Workflow States

```
┌─────────────┐
│   Entry     │
│ (Registration│
│    Link)    │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 1: Agency/Business Registration                            │
│ - Select account type (Agency or Direct Business)              │
│ - Agency: Upload verification documents                        │
│ - Business: Company information entry                          │
└──────┬──────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 2: Company Information                                     │
│ - Company name, industry, region                               │
│ - Website URL, company size                                    │
└──────┬──────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 3: Localization Preferences                               │
│ - Language (English/Arabic with RTL auto-detection)            │
│ - Currency, timezone, date format                              │
└──────┬──────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 4: First User Setup (Admin)                               │
│ - Admin name, email, password                                  │
│ - Password strength validation                                 │
└──────┬──────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 5: Initial Connectors (Guided Selection)                  │
│ - Business need questionnaire (3-5 questions)                  │
│ - Recommended connectors based on answers                      │
│ - Connect first platform (OAuth flow)                          │
└──────┬──────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 6: First Insight Creation (Recommended Template)          │
│ - Select template based on business domain                     │
│ - Pre-fill with connected connector                            │
│ - Schedule first report                                        │
└──────┬──────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 7: Team Invitation (Optional)                             │
│ - Enter team member emails                                     │
│ - Assign roles (Admin, Analyst, Viewer)                        │
│ - Skip available                                               │
└──────┬──────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 8: Tutorial/Onboarding Tour                               │
│ - Interactive walkthrough of key features                      │
│ - Skip available                                               │
└──────┬──────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────┐
│   Complete  │
│ (Launch to  │
│  Dashboard) │
└─────────────┘
```

**Progress Indicator:** Continuous progress bar showing "Step X of 8" with percentage completion

**Save and Continue:** Users can save progress at any step and return via email link

**Skip for Later:** Most steps (except Steps 1-4) offer skip options to accelerate time-to-value

---

## Workflow Steps

### Step 1: Agency/Business Registration

**Entry Criteria:** User clicks registration link from email or landing page

**UI Components:**

- `AccountTypeSelector` - Card-based selection (Agency vs. Direct Business)
- `AccountTypeCard` - Details about each type with benefits
- `AgencyVerificationForm` - Document upload for agencies (conditional)
- `BusinessInfoForm` - Basic company information (conditional)

**Actions:**

- User views account type options with explanations
- User selects account type (Agency or Direct Business)
- **If Agency:** Uploads verification documents (business license, etc.)
- **If Business:** Enters basic company info
- User clicks "Continue"

**Exit Criteria:** Account type selected, required fields entered

**Validation:**

- Account type required
- Agency documents: PDF/JPEG, max 5MB
- Business info: Name required

**Skip:** Not allowed (critical for tenant setup)

**Translation Keys:**

```typescript
{
  "tenant.onboarding.step1.title": "Welcome to AgenticVerdict",
  "tenant.onboarding.step1.subtitle": "Let's set up your account in a few simple steps",
  "tenant.onboarding.step1.type": "Account Type",
  "tenant.onboarding.step1.type.agency": "Agency Partner",
  "tenant.onboarding.step1.type.business": "Direct Business",
  "tenant.onboarding.step1.agency.description": "Manage multiple client accounts with advanced reporting",
  "tenant.onboarding.step1.business.description": "Connect your own business data and insights",
  "tenant.onboarding.step1.agency.verification": "Upload verification documents",
  "tenant.onboarding.step1.business.info": "Company Information",
  "tenant.onboarding.step1.continue": "Continue"
}
```

---

### Step 2: Company Information

**Entry Criteria:** Account type selected and verified

**UI Components:**

- `CompanyInfoForm` - Company details form
- `IndustrySelector` - Dropdown with industry options
- `RegionSelector` - Country/region dropdown
- `SizeSelector` - Company size (employees, revenue)
- `WebsiteInput` - URL validation

**Actions:**

- User enters company name
- User selects industry from dropdown
- User selects country/region
- User selects company size (optional)
- User enters website URL (optional)
- User clicks "Continue"

**Exit Criteria:** Company name, industry, and region entered

**Validation:**

- Company name required (2-100 characters)
- Industry required
- Region required
- Website URL valid format (if entered)

**Smart Defaults:**

- Region: Detected from user IP/Browser locale
- Industry: Most common for user's region

**Translation Keys:**

```typescript
{
  "tenant.onboarding.step2.title": "Tell Us About Your Company",
  "tenant.onboarding.step2.companyName": "Company Name",
  "tenant.onboarding.step2.industry": "Industry",
  "tenant.onboarding.step2.region": "Country/Region",
  "tenant.onboarding.step2.size": "Company Size (Optional)",
  "tenant.onboarding.step2.website": "Website URL (Optional)",
  "tenant.onboarding.step2.continue": "Continue"
}
```

---

### Step 3: Localization Preferences

**Entry Criteria:** Company information entered

**UI Components:**

- `LanguageSelector` - Language selection with preview
- `RTLDemoCard` - Side-by-side LTR/RTL preview
- `CurrencySelector` - Currency dropdown
- `TimezoneSelector` - Timezone dropdown with search
- `DateFormatSelector` - Date format options

**Actions:**

- User selects language (English/Arabic for foundation)
- User views RTL/LTR preview (if switching between Arabic and English)
- User selects currency
- User selects timezone (auto-detected from browser)
- User selects date format
- User clicks "Continue"

**Exit Criteria:** Language, currency, timezone selected

**Validation:**

- Language required
- Currency required
- Timezone required

**Smart Defaults:**

- Language: English (can switch to Arabic)
- Currency: Based on selected region
- Timezone: Detected from browser
- Date format: Based on locale

**RTL Preview:**

```
┌─────────────────────────────────────────┐
│ English (LTR)        │  Arabic (RTL)   │
│ "Hello, World!"      │  "مرحبا بالعالم"│
│                      │                 │
│ [Text aligned left]  │ [Text aligned  │
│                      │  right]         │
└─────────────────────────────────────────┘
```

**Translation Keys:**

```typescript
{
  "tenant.onboarding.step3.title": "Set Your Preferences",
  "tenant.onboarding.step3.subtitle": "Customize language, currency, and timezone",
  "tenant.onboarding.step3.language": "Language",
  "tenant.onboarding.step3.language.english": "English",
  "tenant.onboarding.step3.language.arabic": "العربية",
  "tenant.onboarding.step3.preview": "Preview",
  "tenant.onboarding.step3.currency": "Currency",
  "tenant.onboarding.step3.timezone": "Timezone",
  "tenant.onboarding.step3.dateFormat": "Date Format",
  "tenant.onboarding.step3.continue": "Apply & Continue"
}
```

---

### Step 4: First User Setup (Admin)

**Entry Criteria:** Localization preferences configured

**UI Components:**

- `AdminUserForm` - Admin account creation form
- `NameInput` - First/last name fields
- `EmailInput` - Email with validation
- `PasswordInput` - Password with strength indicator
- `PasswordStrengthMeter` - Visual strength indicator
- `TermsCheckbox` - Terms of service acceptance

**Actions:**

- User enters first name
- User enters last name
- User enters email address
- User creates password (with strength validation)
- User confirms password
- User accepts terms of service
- User clicks "Create Account"

**Exit Criteria:** All admin fields valid, terms accepted

**Validation:**

- First/last name required (2-50 characters each)
- Email required, valid format, not already registered
- Password required: min 12 chars, uppercase, lowercase, number, special
- Passwords must match
- Terms acceptance required

**Password Requirements:**

- Minimum 12 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

**Translation Keys:**

```typescript
{
  "tenant.onboarding.step4.title": "Create Your Admin Account",
  "tenant.onboarding.step4.firstName": "First Name",
  "tenant.onboarding.step4.lastName": "Last Name",
  "tenant.onboarding.step4.email": "Email Address",
  "tenant.onboarding.step4.password": "Password",
  "tenant.onboarding.step4.confirmPassword": "Confirm Password",
  "tenant.onboarding.step4.terms": "I accept the Terms of Service",
  "tenant.onboarding.step4.passwordStrength": "Password Strength",
  "tenant.onboarding.step4.strength.weak": "Weak",
  "tenant.onboarding.step4.strength.medium": "Medium",
  "tenant.onboarding.step4.strength.strong": "Strong",
  "tenant.onboarding.step4.createAccount": "Create Account & Continue"
}
```

---

### Step 5: Initial Connectors (Guided Selection)

**Entry Criteria:** Admin account created

**UI Components:**

- `BusinessNeedQuestionnaire` - 3-5 question quiz
- `QuestionCard` - Single question with multiple choice answers
- `RecommendedConnectors` - List of suggested platforms
- `ConnectorConnectButton` - Connect button triggering OAuth

**Actions:**

- User answers 3-5 questions about business needs:
  1. "What are your primary business goals?" (Marketing/Finance/Operations/etc.)
  2. "Which platforms do you currently use?" (Meta/Google/Salesforce/etc.)
  3. "What data is most important to you?" (Campaign performance/Revenue/etc.)
- System recommends 3-5 connectors based on answers
- User views recommended connectors
- User clicks "Connect" for first connector (triggers OAuth flow)
- User completes OAuth authorization
- User optionally connects additional recommended connectors
- User clicks "Continue" (can skip if at least one connected)

**Exit Criteria:** At least one connector connected OR user skips

**Validation:**

- None required (skip available)
- Warning if skipped: "You can add connectors later from Settings"

**Smart Recommendations:**

```typescript
// Example recommendation logic
const recommendConnectors = (answers) => {
  if (answers.goal === "marketing" && answers.platforms.includes("meta")) {
    return ["meta", "google-analytics", "linkedin"];
  }
  if (answers.goal === "finance") {
    return ["quickbooks", "salesforce"];
  }
  // ... more logic
};
```

**Translation Keys:**

```typescript
{
  "tenant.onboarding.step5.title": "Connect Your Data",
  "tenant.onboarding.step5.subtitle": "Answer a few questions to get personalized platform recommendations",
  "tenant.onboarding.step5.question1": "What are your primary business goals?",
  "tenant.onboarding.step5.question2": "Which platforms do you currently use?",
  "tenant.onboarding.step5.question3": "What data is most important to you?",
  "tenant.onboarding.step5.recommendations": "Recommended for You",
  "tenant.onboarding.step5.connect": "Connect",
  "tenant.onboarding.step5.connected": "Connected",
  "tenant.onboarding.step5.skip": "Skip for Now",
  "tenant.onboarding.step5.skipWarning": "You can add connectors later from Settings"
}
```

---

### Step 6: First Insight Creation (Recommended Template)

**Entry Criteria:** At least one connector connected OR user skipped

**UI Components:**

- `TemplateRecommendation` - Single recommended template
- `TemplatePreviewCard` - Preview of recommended template
- `InsightConfigForm` - Simplified insight configuration
- `ScheduleSelector` - Pre-configured schedule options

**Actions:**

- System recommends template based on:
  - Business domain (from Step 2)
  - Connected connectors (from Step 5)
  - User goals (from Step 5 questionnaire)
- User views recommended template with preview
- User clicks "Use This Template" or "Choose Different Template"
- System pre-fills insight configuration:
  - Name: "{{TemplateName}} - {{CompanyName}}"
  - Connectors: Pre-selected from Step 5
  - Metrics: Recommended defaults
  - Schedule: Weekly, Monday 9:00 AM
- User optionally customizes settings
- User clicks "Create Insight"

**Exit Criteria:** Insight created with template OR user skips

**Validation:**

- None required if using template
- Basic validation if customizing

**Skip Available:** Yes (with warning: "You can create insights later from Dashboard")

**Translation Keys:**

```typescript
{
  "tenant.onboarding.step6.title": "Create Your First Insight",
  "tenant.onboarding.step6.subtitle": "We recommend this template based on your setup",
  "tenant.onboarding.step6.recommended": "Recommended for You",
  "tenant.onboarding.step6.useTemplate": "Use This Template",
  "tenant.onboarding.step6.chooseDifferent": "Choose Different Template",
  "tenant.onboarding.step6.skip": "Skip for Now",
  "tenant.onboarding.step6.skipWarning": "You can create insights later from Dashboard",
  "tenant.onboarding.step6.create": "Create Insight"
}
```

---

### Step 7: Team Invitation (Optional)

**Entry Criteria:** First insight created OR skipped

**UI Components:**

- `TeamInvitationForm` - Multi-email input
- `RoleSelector` - Role assignment per email
- `InvitationPreview` - Preview invitation email
- `SkipButton` - Skip to next step

**Actions:**

- User enters team member email addresses (comma-separated)
- User assigns roles to each email (Admin, Analyst, Viewer)
- User optionally views invitation preview
- User clicks "Send Invitations" OR "Skip This Step"

**Exit Criteria:** Invitations sent OR step skipped

**Validation:**

- None required (skip available)
- Email validation for entered addresses

**Role Descriptions:**

- **Admin:** Full access, manage users, configure connectors
- **Analyst:** Create/edit insights, view reports
- **Viewer:** View reports only

**Translation Keys:**

```typescript
{
  "tenant.onboarding.step7.title": "Invite Your Team",
  "tenant.onboarding.step7.subtitle": "Add team members to collaborate on insights (optional)",
  "tenant.onboarding.step7.emails": "Email Addresses",
  "tenant.onboarding.step7.emails.placeholder": "email1@example.com, email2@example.com",
  "tenant.onboarding.step7.role": "Role",
  "tenant.onboarding.step7.role.admin": "Admin",
  "tenant.onboarding.step7.role.analyst": "Analyst",
  "tenant.onboarding.step7.role.viewer": "Viewer",
  "tenant.onboarding.step7.send": "Send Invitations",
  "tenant.onboarding.step7.skip": "Skip This Step"
}
```

---

### Step 8: Tutorial/Onboarding Tour

**Entry Criteria:** Team invitations sent OR skipped

**UI Components:**

- `InteractiveTour` - Step-by-step feature walkthrough
- `TourTooltip` - Highlighted UI elements with explanations
- `TourProgress` - Tour progress indicator (Step X of Y)
- `SkipTourButton` - Skip tour option

**Actions:**

- System launches interactive tour highlighting:
  1. Dashboard navigation and key metrics
  2. Insights list and status indicators
  3. Connector management and health status
  4. Report viewing and download
  5. Settings and configuration
- User clicks "Next" to advance tour
- User can skip tour at any point
- User clicks "Finish" to complete onboarding

**Exit Criteria:** Tour completed OR skipped

**Validation:** None

**Tour Highlights:**

- Dashboard overview with KPI cards
- Connector status indicators
- Scheduled reports list
- Recent reports with download buttons
- Settings navigation

**Translation Keys:**

```typescript
{
  "tenant.onboarding.step8.title": "Welcome to AgenticVerdict!",
  "tenant.onboarding.step8.subtitle": "Let's take a quick tour of the platform",
  "tenant.onboarding.step8.tour1.title": "Your Dashboard",
  "tenant.onboarding.step8.tour1.description": "View all your key metrics and insights at a glance",
  "tenant.onboarding.step8.tour2.title": "Connectors",
  "tenant.onboarding.step8.tour2.description": "Manage your connected data platforms and monitor health",
  "tenant.onboarding.step8.tour3.title": "Insights",
  "tenant.onboarding.step8.tour3.description": "View, edit, and create scheduled AI-powered insights",
  "tenant.onboarding.step8.tour4.title": "Reports",
  "tenant.onboarding.step8.tour4.description": "Access and download your generated reports",
  "tenant.onboarding.step8.tour5.title": "Settings",
  "tenant.onboarding.step8.tour5.description": "Configure connectors, manage users, and customize preferences",
  "tenant.onboarding.step8.next": "Next",
  "tenant.onboarding.step8.finish": "Finish",
  "tenant.onboarding.step8.skip": "Skip Tour"
}
```

---

## Completion

**Exit Criteria:** All required steps (1-4) completed, optional steps (5-8) completed or skipped

**UI Components:**

- `CompletionMessage` - Success message with animation
- `DashboardPreviewCard` - Preview of what to expect
- `GetStartedButton` - Primary CTA to launch dashboard

**Actions:**

- User views completion message
- System shows dashboard preview
- User clicks "Go to Dashboard"
- System redirects to main dashboard

**Post-Onboarding State:**

- Tenant fully configured in database
- Admin user logged in
- First connector connected (if not skipped)
- First insight created (if not skipped)
- Team invitations sent (if not skipped)

**Translation Keys:**

```typescript
{
  "tenant.onboarding.complete.title": "You're All Set!",
  "tenant.onboarding.complete.message": "Your account is ready. Start exploring your insights.",
  "tenant.onboarding.complete.dashboard": "Go to Dashboard",
  "tenant.onboarding.complete.setup": "Complete Setup",
  "tenant.onboarding.complete.progress": "Setup Progress: {{percentage}}% Complete"
}
```

---

## Save and Continue

### Auto-Save

- **Trigger:** Every 30 seconds or on step change
- **Storage:** Database with onboarding session ID
- **Notification:** Toast message "Progress saved"

### Resume Flow

1. User clicks email link "Continue your setup"
2. Link contains onboarding session ID
3. System loads saved progress
4. User resumes from last saved step

### Session Expiry

- **Expiry:** 7 days after last save
- **Notification:** Email reminder 3 days before expiry
- **Expired Sessions:** Marked as abandoned, admin notified

---

## Skip for Later

### Available Skips

| Step              | Skip Available? | Consequence                               |
| ----------------- | --------------- | ----------------------------------------- |
| 1 (Registration)  | No              | Cannot proceed                            |
| 2 (Company Info)  | No              | Cannot proceed                            |
| 3 (Localization)  | No              | Cannot proceed                            |
| 4 (Admin Setup)   | No              | Cannot proceed                            |
| 5 (Connectors)    | Yes             | Warning: Add connectors later             |
| 6 (First Insight) | Yes             | Warning: Create insights later            |
| 7 (Team Invite)   | Yes             | No warning                                |
| 8 (Tutorial)      | Yes             | No warning, tour available from help menu |

### Re-Engagement

If users skip critical steps (5-6), send guided emails:

- **Day 1:** "Connect your first platform to unlock insights"
- **Day 3:** "Create your first insight from our template gallery"
- **Day 7:** "Your account is waiting - complete setup to get value"

---

## Related Pages/Components

### Pages

- **[Dashboard](/docs/architecture/ui/04-pages/dashboard.md)**: Post-onboarding destination
- **[Settings](/docs/architecture/ui/04-pages/settings.md)**: Complete skipped setup items

### Components

- **`AccountTypeSelector`**: Agency vs. business selection (Step 1)
- **`CompanyInfoForm`**: Company information (Step 2)
- **`LanguageSelector`**: Language/localization (Step 3)
- **`AdminUserForm`**: Admin account creation (Step 4)
- **`BusinessNeedQuestionnaire`**: Connector recommendations (Step 5)
- **`TemplateRecommendation`**: First insight template (Step 6)
- **`TeamInvitationForm`**: Team member invitations (Step 7)
- **`InteractiveTour`**: Feature walkthrough (Step 8)

---

## Version History

| Version | Date       | Changes                        | Author               |
| ------- | ---------- | ------------------------------ | -------------------- |
| 1.0     | 2026-04-13 | Initial workflow specification | UI Architecture Team |

---

**Maintainer**: UI Architecture Team
**Next Review**: After tenant onboarding implementation (estimated 5 weeks)
**Status**: ✅ Active
