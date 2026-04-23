# Settings Pages

**Version:** 1.0
**Last Updated:** 2026-04-13
**Status:** Active
**Related Specs:**

- [Business Architecture: Multi-Tenancy Model](/docs/architecture/business/business-architecture.md#6-multi-tenancy-model)
- [Technical Architecture: Security](/docs/architecture/business/technical-architecture.md#security-architecture)
- [Business Architecture: Stakeholder Requirements](/docs/architecture/business/business-architecture.md#4-stakeholder-requirements)

---

## Table of Contents

1. [Tenant Settings Page](#tenant-settings-page)
2. [User Profile Settings Page](#user-profile-settings-page)
3. [Notification Settings Page](#notification-settings-page)
4. [Integration Settings Page](#integration-settings-page)
5. [Team Management Page](#team-management-page)
6. [Billing & Subscription Page](#billing-subscription-page)
7. [Tenant Settings Page](#tenant-settings-page)

---

## Tenant Settings Page

### Overview

Configure tenant-wide settings including name, logo, localization, branding, and business information. These settings affect how the tenant appears in reports and across the platform.

### User Goal

- **Primary Goal:** Manage tenant identity and branding
- **Secondary Goals:** Update localization, configure business details

### Page Layout

**Wireframe Description:**

```
┌─────────────────────────────────────────────────────────────────┐
│ ☰    Settings > Tenant              [Save] [Cancel]           │
├────────┬────────────────────────────────────────────────────────┤
│        │                                                        │
│        │  Tenant Settings                                     │
│        │  Manage your tenant information and branding         │
│        │                                                        │
│        │  ┌─────────────────────────────────────────────────┐  │
│        │  │ General Information                             │  │
│        │  │                                                 │  │
│        │  │ Tenant Name                                    │  │
│        │  │ [Masafh]                                        │  │
│        │  │                                                 │  │
│        │  │ Industry                                        │  │
│        │  │ [GPS Fleet Tracking ▼]                          │  │
│        │  │                                                 │  │
│        │  │ Website                                         │  │
│        │  │ [https://masafh.com]                            │  │
│        │  │                                                 │  │
│        │  │ Tenant Size                                    │  │
│        │  │ ○ 1-10 employees   ○ 11-50 employees            │  │
│        │  │ ◉ 51-200 employees ○ 200+ employees             │  │
│        │  └─────────────────────────────────────────────────┘  │
│        │                                                        │
│        │  ┌─────────────────────────────────────────────────┐  │
│        │  │ Branding                                        │  │
│        │  │                                                 │  │
│        │  │ Tenant Logo                                    │  │
│        │  │ ┌─────────┐                                     │  │
│        │  │ │ [Logo]  │  [Upload New Logo]                 │  │
│        │  │ │  Preview │                                     │  │
│        │  │ └─────────┘  Recommended: 200x200px, PNG/SVG    │  │
│        │  │                                                 │  │
│        │  │ Brand Color                                     │  │
│        │  │ [🎨] #FF6B35  Primary accent color             │  │
│        │  └─────────────────────────────────────────────────┘  │
│        │                                                        │
│        │  ┌─────────────────────────────────────────────────┐  │
│        │  │ Localization                                   │  │
│        │  │                                                 │  │
│        │  │ Primary Language                                │  │
│        │  │ ◉ English (en)   ○ Arabic (ar) │  │
│        │  │                                                 │  │
│        │  │ Region                                          │  │
│        │  │ [Saudi Arabia ▼]                               │  │
│        │  │                                                 │  │
│        │  │ Timezone                                        │  │
│        │  │ [Asia/Riyadh (UTC+3) ▼]                        │  │
│        │  │                                                 │  │
│        │  │ Currency                                        │  │
│        │  │ [Saudi Riyal (SAR) ▼]                          │  │
│        │  │                                                 │  │
│        │  │ Date Format                                     │  │
│        │  │ ○ MM/DD/YYYY   ◉ DD/MM/YYYY   ○ YYYY-MM-DD    │  │
│        │  └─────────────────────────────────────────────────┘  │
│        │                                                        │
│        │  ┌─────────────────────────────────────────────────┐  │
│        │  │ Business Information                           │  │
│        │  │                                                 │  │
│        │  │ Business Address                                │  │
│        │  │ [123 Business Street, Riyadh, Saudi Arabia]    │  │
│        │  │                                                 │  │
│        │  │ Tax ID / VAT Number                             │  │
│        │  │ [300123456700003]                              │  │
│        │  │                                                 │  │
│        │  │ Contact Email                                   │  │
│        │  │ [info@masafh.com]                               │  │
│        │  │                                                 │  │
│        │  │ Contact Phone                                   │  │
│        │  │ [+966 50 123 4567]                              │  │
│        │  └─────────────────────────────────────────────────┘  │
│        │                                                        │
└────────┴────────────────────────────────────────────────────────┘
```

### Components

**Component Tree:**

```
SettingsLayout (Template)
├── SettingsSidebar (Organism)
│   ├── Navigation (Molecule)
│   │   ├── NavItem (Atom) - Tenant (active)
│   │   ├── NavItem (Atom) - Profile
│   │   ├── NavItem (Atom) - Notifications
│   │   ├── NavItem (Atom) - Integrations
│   │   ├── NavItem (Atom) - Team
│   │   ├── NavItem (Atom) - Billing
│   │   └── NavItem (Atom) - Tenant Settings (agencies only)
│   └── HelpSection (Molecule)
│       ├── Link (Atom) - Documentation
│       └── Link (Atom) - Contact Support
└── MainContent (Organism)
    ├── PageHeader (Molecule)
    │   ├── Typography (Atom) - "Tenant Settings"
    │   ├── Typography (Atom) - Description
    │   └── ActionButtons (Molecule)
    │       ├── Button (Atom) - Save
    │       └── Button (Atom) - Cancel
    └── SettingsForm (Organism)
        ├── GeneralInfoSection (Molecule)
        │   ├── FormField (Molecule) - Tenant Name
        │   ├── FormField (Molecule) - Industry
        │   ├── FormField (Molecule) - Website
        │   └── RadioGroup (Molecule) - Tenant Size
        ├── BrandingSection (Molecule)
        │   ├── LogoUpload (Molecule)
        │   │   ├── LogoPreview (Atom)
        │   │   └── UploadButton (Atom)
        │   └── ColorPicker (Molecule)
        ├── LocalizationSection (Molecule)
        │   ├── RadioGroup (Molecule) - Language
        │   ├── Select (Atom) - Region
        │   ├── Select (Atom) - Timezone
        │   ├── Select (Atom) - Currency
        │   └── RadioGroup (Molecule) - Date Format
        └── BusinessInfoSection (Molecule)
            ├── FormField (Molecule) - Address
            ├── FormField (Molecule) - Tax ID
            ├── FormField (Molecule) - Contact Email
            └── FormField (Molecule) - Contact Phone
```

### States

**1. Loading State**

- Fetch current tenant settings
- Populate form fields
- Show loading spinner

**2. Editing State**

- User modifies fields
- "Unsaved changes" indicator
- Save button enabled

**3. Saving State**

- Save button shows spinner
- "Saving settings..." message
- Disable form fields

**4. Success State**

- Success toast
- Settings applied immediately
- Stay on page or return to dashboard

**5. Error State**

- Inline validation errors
- Error banner for API failures
- Form remains populated for retry

### Navigation

**Entry Points:**

- Settings sidebar "Tenant" navigation
- User menu → Settings → Tenant
- Direct URL: `/settings/tenant`

**Exits:**

- **Save:** Save changes, stay on page
- **Cancel:** Discard changes, return to dashboard
- **Sidebar:** Navigate to other settings sections

**Breadcrumb Hierarchy:**

```
Settings > Tenant
```

### Permissions

- **Viewer:** View only
- **Analyst:** View only
- **Admin/Owner:** Full edit access

---

## User Profile Settings Page

### Overview

Manage individual user profile including name, email, password, avatar, and personal preferences. Each user controls their own profile.

### User Goal

- **Primary Goal:** Update personal information and preferences
- **Secondary Goals:** Change password, update avatar, manage account

### Page Layout

**Wireframe Description:**

```
┌─────────────────────────────────────────────────────────────────┐
│ ☰    Settings > Profile              [Save] [Cancel]           │
├────────┬────────────────────────────────────────────────────────┤
│        │                                                        │
│        │  Profile Settings                                     │
│        │  Manage your personal information and preferences     │
│        │                                                        │
│        │  ┌─────────────────────────────────────────────────┐  │
│        │  │ Profile Picture                                 │  │
│        │  │ ┌─────────┐                                     │  │
│        │  │ │ [Avatar]│  [Upload New Photo]                │  │
│        │  │ │ Preview │  Recommended: 200x200px, PNG/JPG    │  │
│        │  │ └─────────┘  [Remove Photo]                    │  │
│        │  └─────────────────────────────────────────────────┘  │
│        │                                                        │
│        │  ┌─────────────────────────────────────────────────┐  │
│        │  │ Personal Information                           │  │
│        │  │                                                 │  │
│        │  │ Full Name                                      │  │
│        │  │ [Ahmed Al-Rashid]                               │  │
│        │  │                                                 │  │
│        │  │ Email Address                                  │  │
│        │  │ [ahmed@masafh.com]  [Verified ✓]                │  │
│        │  │                                                 │  │
│        │  │ Phone Number (Optional)                         │  │
│        │  │ [+966 50 123 4567]                              │  │
│        │  │                                                 │  │
│        │  │ Job Title (Optional)                            │  │
│        │  │ [Marketing Manager]                             │  │
│        │  └─────────────────────────────────────────────────┘  │
│        │                                                        │
│        │  ┌─────────────────────────────────────────────────┐  │
│        │  │ Password                                       │  │
│        │  │                                                 │  │
│        │  │ Current Password                                │  │
│        │  │ [••••••••]  [Show]                              │  │
│        │  │                                                 │  │
│        │  │ New Password                                    │  │
│        │  │ [••••••••]  [Show]                              │  │
│        │  │ Strength: ████░░░░░░ Medium                     │  │
│        │  │                                                 │  │
│        │  │ Confirm New Password                            │  │
│        │  │ [••••••••]  [Show]                              │  │
│        │  │                                                 │  │
│        │  │ [Change Password]                               │  │
│        │  └─────────────────────────────────────────────────┘  │
│        │                                                        │
│        │  ┌─────────────────────────────────────────────────┐  │
│        │  │ Preferences                                    │  │
│        │  │                                                 │  │
│        │  │ Interface Language                              │  │
│        │  │ ◉ English (en)   ○ Arabic (ar)                 │  │
│        │  │                                                 │  │
│        │  │ Timezone                                       │  │
│        │  │ [Asia/Riyadh (UTC+3) ▼]                        │  │
│        │  │                                                 │  │
│        │  │ Email Notifications                             │  │
│        │  │ ☑ Receive email updates                        │  │
│        │  │ ☑ Weekly summary report                        │  │
│        │  │ ☐ Product updates and announcements            │  │
│        │  │                                                 │  │
│        │  │ Two-Factor Authentication                       │  │
│        │  │ ○ Disabled  ◉ Enabled (Authenticator App)      │  │
│        │  │ [Configure 2FA]                                 │  │
│        │  └─────────────────────────────────────────────────┘  │
│        │                                                        │
└────────┴────────────────────────────────────────────────────────┘
```

### Components

**Component Tree:**

```
SettingsLayout (Template)
├── SettingsSidebar (Organism) - [same as tenant settings]
└── MainContent (Organism)
    ├── PageHeader (Molecule) - [similar to tenant settings]
    └── SettingsForm (Organism)
        ├── AvatarSection (Molecule)
        │   ├── AvatarPreview (Atom)
        │   ├── UploadButton (Atom)
        │   └── RemoveButton (Atom)
        ├── PersonalInfoSection (Molecule)
        │   ├── FormField (Molecule) - Full Name
        │   ├── FormField (Molecule) - Email (read-only, verified)
        │   ├── FormField (Molecule) - Phone
        │   └── FormField (Molecule) - Job Title
        ├── PasswordSection (Molecule)
        │   ├── FormField (Molecule) - Current Password
        │   ├── FormField (Molecule) - New Password
        │   ├── PasswordStrengthIndicator (Molecule)
        │   ├── FormField (Molecule) - Confirm New Password
        │   └── ChangePasswordButton (Atom)
        └── PreferencesSection (Molecule)
            ├── RadioGroup (Molecule) - Language
            ├── Select (Atom) - Timezone
            ├── CheckboxGroup (Molecule) - Email Notifications
            └── TwoFactorAuth (Molecule)
                ├── StatusBadge (Atom)
                └── ConfigureButton (Atom)
```

### States

**1. Loading State**

- Fetch current user profile
- Populate form fields
- Show loading spinner

**2. Editing State**

- User modifies fields
- Password change section separate from main profile
- "Unsaved changes" indicator

**3. Changing Password State**

- Password change independent of profile save
- Validation: current password required
- Strength indicator updates in real-time

**4. Saving State**

- Save button shows spinner
- "Saving profile..." message
- Disable form fields

**5. Success State**

- Success toast
- Changes applied immediately
- Stay on page

**6. 2FA Configuration State**

- Open 2FA setup modal
- Scan QR code
- Enter verification code
- Confirm activation

### Navigation

**Entry Points:**

- Settings sidebar "Profile" navigation
- User avatar click → Profile
- Direct URL: `/settings/profile`

**Exits:**

- **Save:** Save changes, stay on page
- **Cancel:** Discard changes, return to dashboard

**Breadcrumb Hierarchy:**

```
Settings > Profile
```

### Permissions

- **All Users:** Full access to own profile only
- **Cannot Change Email:** Requires email verification flow
- **Password Change:** Requires current password

---

## Notification Settings Page

### Overview

Configure notification preferences for various platform events. Users control email frequency, alert types, and notification channels.

### User Goal

- **Primary Goal:** Control which notifications to receive and how
- **Secondary Goals:** Reduce notification noise, customize alert frequency

### Page Layout

**Wireframe Description:**

```
┌─────────────────────────────────────────────────────────────────┐
│ ☰    Settings > Notifications         [Save] [Cancel]           │
├────────┬────────────────────────────────────────────────────────┤
│        │                                                        │
│        │  Notification Settings                                 │
│        │  Choose which notifications you receive and how        │
│        │                                                        │
│        │  ┌─────────────────────────────────────────────────┐  │
│        │  │ Email Notifications                            │  │
│        │  │                                                 │  │
│        │  │ ☑ Send me email notifications                  │  │
│        │  │                                                 │  │
│        │  │ Notification Frequency:                         │  │
│        │  │ ◉ Immediate    ○ Daily Digest    ○ Weekly       │  │
│        │  │                                                 │  │
│        │  │ Notify me about:                                │  │
│        │  │ ☑ Insight reports ready                        │  │
│        │  │ ☑ Connector sync failures                      │  │
│        │  │ ☑ Authentication expiring soon                 │  │
│        │  │ ☐ Team member invitations                      │  │
│        │  │ ☐ Weekly performance summary                   │  │
│        │  │ ☐ Product updates and new features             │  │
│        │  │ ☐ Tips and best practices                      │  │
│        │  └─────────────────────────────────────────────────┘  │
│        │                                                        │
│        │  ┌─────────────────────────────────────────────────┐  │
│        │  │ In-App Notifications                           │  │
│        │  │                                                 │  │
│        │  │ ☑ Show in-app notification bell                │  │
│        │  │                                                 │  │
│        │  │ Notify me about:                                │  │
│        │  │ ☑ Insight reports ready                        │  │
│        │  │ ☑ Connector sync failures                      │  │
│        │  │ ☑ Team member activity                        │  │
│        │  │ ☐ Comments and mentions                       │  │
│        │  │ ☑ System maintenance alerts                   │  │
│        │  └─────────────────────────────────────────────────┘  │
│        │                                                        │
│        │  ┌─────────────────────────────────────────────────┐  │
│        │  │ Mobile Push Notifications (Optional)            │  │
│        │  │                                                 │  │
│        │  │ ☑ Enable push notifications                    │  │
│        │  │                                                 │  │
│        │  │ Notify me about:                                │  │
│        │  │ ☑ Insight reports ready                        │  │
│        │  │ ☑ Critical alerts only                         │  │
│        │  │ ☐ All activity                                 │  │
│        │  └─────────────────────────────────────────────────┘  │
│        │                                                        │
│        │  ┌─────────────────────────────────────────────────┐  │
│        │  │ Slack Integration (Optional)                    │  │
│        │  │                                                 │  │
│        │  │ ☐ Enable Slack notifications                   │  │
│        │  │                                                 │  │
│        │  │ [Connect Slack Workspace]                       │  │
│        │  │                                                 │  │
│        │  │ Select channels:                                │  │
│        │  │ ☑ #insights    ☑ #alerts    ☐ #general        │  │
│        │  └─────────────────────────────────────────────────┘  │
│        │                                                        │
└────────┴────────────────────────────────────────────────────────┘
```

### Components

**Component Tree:**

```
SettingsLayout (Template)
├── SettingsSidebar (Organism) - [standard]
└── MainContent (Organism)
    ├── PageHeader (Molecule) - [standard]
    └── SettingsForm (Organism)
        ├── EmailNotificationsSection (Molecule)
        │   ├── ToggleSwitch (Atom) - Enable/disable
        │   ├── RadioGroup (Molecule) - Frequency
        │   └── CheckboxGroup (Molecule) - Notification types
        ├── InAppNotificationsSection (Molecule)
        │   ├── ToggleSwitch (Atom) - Enable/disable
        │   └── CheckboxGroup (Molecule) - Notification types
        ├── PushNotificationsSection (Molecule)
        │   ├── ToggleSwitch (Atom) - Enable/disable
        │   └── CheckboxGroup (Molecule) - Notification types
        └── SlackIntegrationSection (Molecule)
            ├── ToggleSwitch (Atom) - Enable/disable
            ├── ConnectButton (Atom)
            └── ChannelSelector (Molecule)
```

### States

**1. Loading State**

- Fetch current notification preferences
- Populate form fields
- Show loading spinner

**2. Editing State**

- User toggles checkboxes
- Real-time validation
- "Unsaved changes" indicator

**3. Slack Connection State**

- **Disconnected:** "Connect Slack Workspace" button
- **Connecting:** OAuth flow to Slack
- **Connected:** Show connected workspace, channel selector

**4. Saving State**

- Save button shows spinner
- "Saving preferences..." message
- Disable form fields

**5. Success State**

- Success toast
- Preferences applied immediately
- Stay on page

### Navigation

**Entry Points:**

- Settings sidebar "Notifications" navigation
- Direct URL: `/settings/notifications`

**Exits:**

- **Save:** Save changes, stay on page
- **Cancel:** Discard changes, return to dashboard

**Breadcrumb Hierarchy:**

```
Settings > Notifications
```

### Permissions

- **All Users:** Full access to own notification preferences

---

## Integration Settings Page

### Overview

Manage API keys, webhooks, and third-party integrations. Configure custom integrations, view API documentation, and manage access tokens.

### User Goal

- **Primary Goal:** Set up and manage third-party integrations
- **Secondary Goals:** Generate API keys, configure webhooks, view access logs

### Page Layout

**Wireframe Description:**

```
┌─────────────────────────────────────────────────────────────────┐
│ ☰    Settings > Integrations          [Save] [Cancel]           │
├────────┬────────────────────────────────────────────────────────┤
│        │                                                        │
│        │  Integration Settings                                  │
│        │  Manage API access and third-party integrations       │
│        │                                                        │
│        │  ┌─────────────────────────────────────────────────┐  │
│        │  │ API Access                                      │  │
│        │  │                                                 │  │
│        │  │ API Keys                                        │  │
│        │  │ ┌─────────────────────────────────────────┐    │  │
│        │  │ │ Production Key                          │    │  │
│        │  │ │ av_prod_1234567890abcdef      [Revoke] │    │  │
│        │  │ │ Created: Jan 15, 2026  Last used: Today│    │  │
│        │  │ └─────────────────────────────────────────┘    │  │
│        │  │ ┌─────────────────────────────────────────┐    │  │
│        │  │ │ Test Key                                │    │  │
│        │  │ │ av_test_0987654321fedcba      [Revoke] │    │  │
│        │  │ │ Created: Mar 1, 2026   Last used: Today│    │  │
│        │  │ └─────────────────────────────────────────┘    │  │
│        │  │                                                 │  │
│        │  │ [Generate New API Key]  [View API Docs]         │  │
│        │  └─────────────────────────────────────────────────┘  │
│        │                                                        │
│        │  ┌─────────────────────────────────────────────────┐  │
│        │  │ Webhooks                                        │  │
│        │  │                                                 │  │
│        │  │ Webhook Endpoints                               │  │
│        │  │ ┌─────────────────────────────────────────┐    │  │
│        │  │ │ Insight Reports                         │    │  │
│        │  │ │ https://api.masafh.com/webhook/insights │    │  │
│        │  │ │ Events: insight.completed              │    │  │
│        │  │ │ Status: ✓ Active  Last trigger: 2h ago │    │  │
│        │  │ │ [Test] [Edit] [Disable]                │    │  │
│        │  │ └─────────────────────────────────────────┘    │  │
│        │  │                                                 │  │
│        │  │ [Add Webhook]  [View Event Types]               │  │
│        │  └─────────────────────────────────────────────────┘  │
│        │                                                        │
│        │  ┌─────────────────────────────────────────────────┐  │
│        │  │ Connected Platforms                             │  │
│        │  │                                                 │  │
│        │  │ ┌─────────────────────────────────────────┐    │  │
│        │  │ │ Slack                   [Configure]     │    │  │
│        │  │ │ Connected as @masafh workspace           │    │  │
│        │  │ └─────────────────────────────────────────┘    │  │
│        │  │ ┌─────────────────────────────────────────┐    │  │
│        │  │ │ Zapier                  [Connect]       │    │  │
│        │  │ │ Not connected                            │    │  │
│        │  │ └─────────────────────────────────────────┘    │  │
│        │  └─────────────────────────────────────────────────┘  │
│        │                                                        │
└────────┴────────────────────────────────────────────────────────┘
```

### Components

**Component Tree:**

```
SettingsLayout (Template)
├── SettingsSidebar (Organism) - [standard]
└── MainContent (Organism)
    ├── PageHeader (Molecule) - [standard]
    └── SettingsContent (Organism)
        ├── APIAccessSection (Molecule)
        │   ├── APIKeyList (Organism)
        │   │   └── APIKeyCard (Molecule)
        │   │       ├── KeyName (Atom)
        │   │       ├── KeyPreview (Atom) - Partially masked
        │   │       ├── Metadata (Atom) - Created, Last used
        │   │       └── ActionButtons (Molecule)
        │   ├── GenerateKeyButton (Atom)
        │   └── ViewDocsButton (Atom)
        ├── WebhooksSection (Molecule)
        │   ├── WebhookList (Organism)
        │   │   └── WebhookCard (Molecule)
        │   │       ├── WebhookName (Atom)
        │   │       ├── WebhookURL (Atom)
        │   │       ├── EventTypes (Atom)
        │   │       ├── StatusBadge (Atom)
        │   │       └── ActionButtons (Molecule)
        │   ├── AddWebhookButton (Atom)
        │   └── ViewEventsButton (Atom)
        └── ConnectedPlatformsSection (Molecule)
            ├── PlatformList (Organism)
            │   └── PlatformCard (Molecule)
            │       ├── PlatformName (Atom)
            │       ├── ConnectionStatus (Atom)
            │       └── ActionButton (Atom)
            └── IntegrationDocsLink (Atom)
```

### States

**1. Loading State**

- Fetch API keys, webhooks, integrations
- Populate lists
- Show loading spinners

**2. Generating API Key State**

- Modal: "Generate New API Key"
- Enter key name
- Select permissions (read/write)
- Confirm generation
- Show full key once (copy prompt)

**3. Revoking API Key State**

- Confirmation modal: "Revoke API Key?"
- Warning: This action cannot be undone
- Type key name to confirm
- Revoke button

**4. Adding Webhook State**

- Modal: "Add Webhook"
- Webhook name
- URL input
- Event type checkboxes
- Secret key generation
- Test webhook button

**5. Testing Webhook State**

- Send test payload to webhook
- Show response status
- Success/error message

### Navigation

**Entry Points:**

- Settings sidebar "Integrations" navigation
- Direct URL: `/settings/integrations`

**Exits:**

- **Save:** Not applicable (each action saves immediately)
- **Cancel:** Close modals, return to settings

**Breadcrumb Hierarchy:**

```
Settings > Integrations
```

### Permissions

- **Viewer:** View only
- **Analyst:** View, generate test keys
- **Admin/Owner:** Full access including production keys

---

## Team Management Page

### Overview

Manage team members, roles, and permissions. Invite new users, assign roles, and manage access control. Only available to admins and owners.

### User Goal

- **Primary Goal:** Manage team members and their access
- **Secondary Goals:** Invite new users, change roles, remove members

### Page Layout

**Wireframe Description:**

```
┌─────────────────────────────────────────────────────────────────┐
│ ☰    Settings > Team                   [Invite Member]          │
├────────┬────────────────────────────────────────────────────────┤
│        │                                                        │
│        │  Team Management                                      │
│        │  Manage team members and permissions                  │
│        │                                                        │
│        │  ┌─────────────────────────────────────────────────┐  │
│        │  │ Team Members (4)                                │  │
│        │  │ ┌───────────────────────────────────────────┐  │  │
│        │  │ │ Ahmed Al-Rashid          [Owner]          │  │  │
│        │  │ │ ahmed@masafh.com         You              │  │  │
│        │  │ │ Last active: 2 hours ago                  │  │  │
│        │  │ └───────────────────────────────────────────┘  │  │
│        │  │ ┌───────────────────────────────────────────┐  │  │
│        │  │ │ Sarah Johnson           [Admin ▼]        │  │  │
│        │  │ │ sarah@masafh.com                        │  │  │
│        │  │ │ Last active: Today                      │  │  │
│        │  │ │ [Edit] [Remove]                         │  │  │
│        │  │ └───────────────────────────────────────────┘  │  │
│        │  │ ┌───────────────────────────────────────────┐  │  │
│        │  │ │ Mohammed Ali             [Analyst ▼]      │  │  │
│        │  │ │ mohammed@masafh.com                     │  │  │
│        │  │ │ Last active: Yesterday                   │  │  │
│        │  │ │ [Edit] [Remove]                         │  │  │
│        │  │ └───────────────────────────────────────────┘  │  │
│        │  │ ┌───────────────────────────────────────────┐  │  │
│        │  │ │ Fatima Hassan           [Viewer ▼]       │  │  │
│        │  │ │ fatima@masafh.com                       │  │  │
│        │  │ │ Last active: 3 days ago                  │  │  │
│        │  │ │ [Edit] [Remove]                         │  │  │
│        │  │ └───────────────────────────────────────────┘  │  │
│        │  └─────────────────────────────────────────────────┘  │
│        │                                                        │
│        │  ┌─────────────────────────────────────────────────┐  │
│        │  │ Pending Invitations (1)                         │  │
│        │  │ ┌───────────────────────────────────────────┐  │  │
│        │  │ │ khaled@partner-agency.com                  │  │  │
│        │  │ │ Invited: 2 days ago  Expires in 5 days    │  │  │
│        │  │ │ [Resend] [Cancel]                         │  │  │
│        │  │ └───────────────────────────────────────────┘  │  │
│        │  └─────────────────────────────────────────────────┘  │
│        │                                                        │
│        │  ┌─────────────────────────────────────────────────┐  │
│        │  │ Roles & Permissions                             │  │
│        │  │                                                 │  │
│        │  │ Owner  • Full access to all settings            │  │
│        │  │ Admin  • Manage team, connectors, insights      │  │
│        │  │ Analyst  • Create and view insights             │  │
│        │  │ Viewer  • View only, no actions                 │  │
│        │  │                                                 │  │
│        │  │ [Manage Custom Roles]  [View Permission Docs]   │  │
│        │  └─────────────────────────────────────────────────┘  │
└────────┴────────────────────────────────────────────────────────┘
```

### Components

**Component Tree:**

```
SettingsLayout (Template)
├── SettingsSidebar (Organism) - [standard]
└── MainContent (Organism)
    ├── PageHeader (Molecule)
    │   ├── Typography (Atom) - "Team Management"
    │   ├── Typography (Atom) - Description
    │   └── Button (Atom) - "Invite Member"
    ├── TeamMembersSection (Molecule)
    │   ├── SectionHeader (Molecule) - "Team Members (4)"
    │   └── MemberList (Organism)
    │       └── MemberCard (Molecule)
    │           ├── MemberAvatar (Atom)
    │           ├── MemberName (Atom)
    │           ├── MemberEmail (Atom)
    │           ├── RoleDropdown (Molecule) - Owner/Admin/Analyst/Viewer
    │           ├── LastActive (Atom)
    │           └── ActionButtons (Molecule) - Edit/Remove
    ├── PendingInvitationsSection (Molecule)
    │   ├── SectionHeader (Molecule) - "Pending Invitations (1)"
    │   └── InvitationList (Organism)
    │       └── InvitationCard (Molecule)
    │           ├── InvitationEmail (Atom)
    │           ├── InvitationMetadata (Atom) - Invited, Expires
    │           └── ActionButtons (Molecule) - Resend/Cancel
    └── RolesPermissionsSection (Molecule)
        ├── RoleDescriptions (Organism)
        │   └── RoleCard (Molecule)
        │       ├── RoleName (Atom)
        │       └── RoleDescription (Atom)
        └── ActionButtons (Molecule)
            ├── Button (Atom) - Manage Custom Roles
            └── Link (Atom) - View Permission Docs
```

### States

**1. Loading State**

- Fetch team members and invitations
- Populate lists
- Show loading spinners

**2. Inviting Member State**

- Modal: "Invite Team Member"
- Email input
- Role selection dropdown
- Personal message (optional)
- Send invitation button

**3. Editing Member Role State**

- Modal: "Edit Member Role"
- Member info display
- Role dropdown
- Reason field (optional)
- Save button

**4. Removing Member State**

- Confirmation modal: "Remove Team Member?"
- Warning: Member will lose access immediately
- Type member name to confirm
- Remove button

**5. Resending Invitation State**

- Click "Resend" button
- Show success toast
- Update expiry time

### Navigation

**Entry Points:**

- Settings sidebar "Team" navigation
- Direct URL: `/settings/team`

**Exits:**

- **Invite Member:** Open invite modal
- **Member Role Change:** Update immediately, stay on page
- **Remove Member:** Confirm, then remove from list

**Breadcrumb Hierarchy:**

```
Settings > Team
```

### Permissions

- **Viewer:** View team members only
- **Analyst:** View team members only
- **Admin:** Invite, change roles, remove members (except owner)
- **Owner:** Full access including removing admins

---

## Billing & Subscription Page

### Overview

View and manage subscription plan, usage metrics, payment methods, and billing history. Upgrade/downgrade plans, update payment info, download invoices.

### User Goal

- **Primary Goal:** Manage subscription and payment
- **Secondary Goals:** View usage, download invoices, upgrade plan

### Page Layout

**Wireframe Description:**

```
┌─────────────────────────────────────────────────────────────────┐
│ ☰    Settings > Billing                                         │
├────────┬────────────────────────────────────────────────────────┤
│        │                                                        │
│        │  Billing & Subscription                                │
│        │  Manage your plan and payment                          │
│        │                                                        │
│        │  ┌─────────────────────────────────────────────────┐  │
│        │  │ Current Plan                                   │  │
│        │  │                                                 │  │
│        │  │ Pro Plan                                        │  │
│        │  │ $99/month • Billed annually                     │  │
│        │  │                                                 │  │
│        │  │ Plan Features:                                  │  │
│        │  │ ✓ 10 Connectors                                 │  │
│        │  │ ✓ 50 Insights                                   │  │
│        │  │ ✓ 5 Team Members                                │  │
│        │  │ ✓ Unlimited Reports                             │  │
│        │  │ ✓ Priority Support                              │  │
│        │  │                                                 │  │
│        │  │ Usage:                                          │  │
│        │  │ Connectors: 5/10  Insights: 12/50  Team: 4/5    │  │
│        │  │                                                 │  │
│        │  │ [Upgrade to Enterprise] [Change Plan]            │  │
│        │  └─────────────────────────────────────────────────┘  │
│        │                                                        │
│        │  ┌─────────────────────────────────────────────────┐  │
│        │  │ Payment Method                                  │  │
│        │  │                                                 │  │
│        │  │ Visa ending in 4242  Expires 12/2026             │  │
│        │  │ [Update Payment Method]                         │  │
│        │  └─────────────────────────────────────────────────┘  │
│        │                                                        │
│        │  ┌─────────────────────────────────────────────────┐  │
│        │  │ Billing History                                │  │
│        │  │                                                 │  │
│        │  │ ┌───────────────────────────────────────────┐  │  │
│        │  │ │ Apr 2026              $99.00    [Download]│  │
│        │  │ │ Paid on Apr 1, 2026                       │  │
│        │  │ └───────────────────────────────────────────┘  │  │
│        │  │ ┌───────────────────────────────────────────┐  │  │
│        │  │ │ Mar 2026              $99.00    [Download]│  │
│        │  │ │ Paid on Mar 1, 2026                       │  │
│        │  │ └───────────────────────────────────────────┘  │
│        │  │ ┌───────────────────────────────────────────┐  │  │
│        │  │ │ Feb 2026              $99.00    [Download]│  │
│        │  │ │ Paid on Feb 1, 2026                       │  │
│        │  │ └───────────────────────────────────────────┘  │
│        │  └─────────────────────────────────────────────────┘  │
└────────┴────────────────────────────────────────────────────────┘
```

### Components

**Component Tree:**

```
SettingsLayout (Template)
├── SettingsSidebar (Organism) - [standard]
└── MainContent (Organism)
    ├── PageHeader (Molecule) - [standard]
    └── BillingContent (Organism)
        ├── CurrentPlanSection (Molecule)
        │   ├── PlanName (Atom) - "Pro Plan"
        │   ├── PlanPrice (Atom) - "$99/month"
        │   ├── BillingCycle (Atom) - "Billed annually"
        │   ├── FeatureList (Molecule) - Checkmarks and features
        │   ├── UsageBars (Molecule) - Progress bars for limits
        │   └── ActionButtons (Molecule)
        │       ├── Button (Atom) - Upgrade to Enterprise
        │       └── Button (Atom) - Change Plan
        ├── PaymentMethodSection (Molecule)
        │   ├── CardDisplay (Molecule) - Card type, last 4, expiry
        │   └── UpdateButton (Atom)
        └── BillingHistorySection (Molecule)
            ├── InvoiceList (Organism)
            │   └── InvoiceCard (Molecule)
            │       ├── InvoicePeriod (Atom)
            │       ├── InvoiceAmount (Atom)
            │       ├── InvoiceStatus (Atom)
            │       └── DownloadButton (Atom)
            └── Pagination (Molecule) - For history
```

### States

**1. Loading State**

- Fetch billing information
- Populate plan, usage, invoices
- Show loading spinners

**2. Changing Plan State**

- Modal: "Change Plan"
- Plan comparison (Free → Pro → Enterprise)
- Feature comparison table
- Price preview
- Confirm change button

**3. Updating Payment Method State**

- Modal: "Update Payment Method"
- Card details form
- Billing address
- Save button

**4. Downloading Invoice State**

- Click download button
- Show loading briefly
- Download PDF invoice

### Navigation

**Entry Points:**

- Settings sidebar "Billing" navigation
- Direct URL: `/settings/billing`

**Exits:**

- **Upgrade/Change Plan:** Open plan comparison modal
- **Update Payment:** Open payment method modal
- **Download Invoice:** Start download

**Breadcrumb Hierarchy:**

```
Settings > Billing
```

### Permissions

- **All Roles:** View billing (owner only for sensitive info)
- **Owner:** Full access including upgrade, payment method

---

## Tenant Settings Page

### Overview

Agency partner settings for managing client tenants. Configure client branding, white-label options, and tenant-specific preferences. Only available to agency partners.

### User Goal

- **Primary Goal:** Configure client tenant settings
- **Secondary Goals:** White-label branding, manage client access

### Page Layout

**Wireframe Description:**

```
┌─────────────────────────────────────────────────────────────────┐
│ ☰    Settings > Tenant                [Save] [Cancel]           │
├────────┬────────────────────────────────────────────────────────┤
│        │                                                        │
│        │  Tenant Settings                                      │
│        │  Configure client tenant (Masafh) settings           │
│        │                                                        │
│        │  ┌─────────────────────────────────────────────────┐  │
│        │  │ Client Overview                                 │  │
│        │  │                                                 │  │
│        │  │ Tenant Name: Masafh                            │  │
│        │  │ Industry: GPS Fleet Tracking                    │  │
│        │  │ Plan: Pro (5 connectors, 50 insights)           │  │
│        │  │ Status: Active  Created: Jan 15, 2026            │  │
│        │  │                                                 │  │
│        │  │ [View as Client] [Manage Subscription]           │  │
│        │  └─────────────────────────────────────────────────┘  │
│        │                                                        │
│        │  ┌─────────────────────────────────────────────────┐  │
│        │  │ White-Label Branding                            │  │
│        │  │                                                 │  │
│        │  │ ☑ Apply agency branding to client reports      │  │
│        │  │                                                 │  │
│        │  │ Agency Logo                                     │  │
│        │  │ [Use agency logo]  ○ Use client logo            │  │
│        │  │                                                 │  │
│        │  │ Report Header                                   │  │
│        │  │ ◉ "Powered by [Agency Name]"                    │  │
│        │  │ ○ "[Agency Name] Intelligence for [Client]"    │  │
│        │  │ ○ "[Client Name] Insights" (No agency mention) │  │
│        │  │                                                 │  │
│        │  │ Custom Domain (Optional)                         │  │
│        │  │ [app.masafh.agency.com]  [Configure DNS]        │  │
│        │  └─────────────────────────────────────────────────┘  │
│        │                                                        │
│        │  ┌─────────────────────────────────────────────────┐  │
│        │  │ Access Control                                 │  │
│        │  │                                                 │  │
│        │  │ Agency Access Level                             │  │
│        │  │ ◉ Full Access  ○ Limited Access  ○ View Only   │  │
│        │  │                                                 │  │
│        │  │ Allowed Actions:                                │  │
│        │  │ ☑ Create and edit insights                     │  │
│        │  │ ☑ Manage connectors                            │  │
│        │  │ ☑ View reports and data                        │  │
│        │  │ ☐ Modify tenant settings                      │  │
│        │  │ ☐ Manage team members                          │  │
│        │  │                                                 │  │
│        │  │ Team Member Visibility                          │  │
│        │  │ ◉ Agency team can create client insights       │  │
│        │  │ ○ Agency team view only                        │  │
│        │  └─────────────────────────────────────────────────┘  │
│        │                                                        │
│        │  ┌─────────────────────────────────────────────────┐  │
│        │  │ Notifications                                  │  │
│        │  │                                                 │  │
│        │  │ ☑ Email agency when client insights run        │  │
│        │  │ ☑ Notify agency of connector issues             │  │
│        │  │ ☐ Include agency in client weekly summaries    │  │
│        │  │                                                 │  │
│        │  │ Notification Email:                             │  │
│        │  │ [agency-team@partner-agency.com]                │  │
│        │  └─────────────────────────────────────────────────┘  │
│        │                                                        │
└────────┴────────────────────────────────────────────────────────┘
```

### Components

**Component Tree:**

```
SettingsLayout (Template)
├── SettingsSidebar (Organism) - [standard, with Tenant nav item]
└── MainContent (Organism)
    ├── PageHeader (Molecule) - [standard]
    └── SettingsForm (Organism)
        ├── ClientOverviewSection (Molecule)
        │   ├── ClientInfo (Molecule) - Name, industry, plan, status
        │   └── ActionButtons (Molecule)
        │       ├── Button (Atom) - View as Client
        │       └── Button (Atom) - Manage Subscription
        ├── WhiteLabelBrandingSection (Molecule)
        │   ├── ToggleSwitch (Atom) - Enable agency branding
        │   ├── RadioGroup (Molecule) - Logo selection
        │   ├── RadioGroup (Molecule) - Report header style
        │   └── FormField (Molecule) - Custom domain
        ├── AccessControlSection (Molecule)
        │   ├── RadioGroup (Molecule) - Agency access level
        │   ├── CheckboxGroup (Molecule) - Allowed actions
        │   └── RadioGroup (Molecule) - Team member visibility
        └── NotificationsSection (Molecule)
            ├── CheckboxGroup (Molecule) - Notification preferences
            └── FormField (Molecule) - Notification email
```

### States

**1. Loading State**

- Fetch client tenant settings
- Populate form fields
- Show loading spinner

**2. Editing State**

- User modifies settings
- "Unsaved changes" indicator
- Save button enabled

**3. Viewing as Client State**

- Switch context to client tenant
- Show client's view of platform
- "Return to Agency View" button

**4. Saving State**

- Save button shows spinner
- "Saving tenant settings..." message
- Disable form fields

**5. Success State**

- Success toast
- Settings applied immediately
- Stay on page

### Navigation

**Entry Points:**

- Settings sidebar "Tenant Settings" navigation (agency only)
- Client switcher → "Manage Client"
- Direct URL: `/settings/tenant/[id]`

**Exits:**

- **Save:** Save changes, stay on page
- **Cancel:** Discard changes, return to agency dashboard
- **View as Client:** Switch to client context

**Breadcrumb Hierarchy:**

```
Settings > Tenant > [Client Name]
```

### Permissions

- **Agency Owner/Admin:** Full access
- **Agency Analyst/Viewer:** View only
- **Client Users:** Cannot access agency tenant settings

---

## Shared Settings Patterns

### Settings Navigation

- **Persistent Sidebar:** Left sidebar with all settings sections
- **Active State:** Highlight current section
- **Quick Access:** User menu → Settings dropdown

### Form Patterns

- **Auto-Save:** Some settings save immediately (toggles, selects)
- **Explicit Save:** Others require save button (text inputs, multi-field forms)
- **Unsaved Changes:** Warning when navigating away
- **Validation:** Inline errors, save button disabled until valid

### Permission Checks

- **View-Only:** Lower roles see settings but cannot edit
- **Feature Flags:** Some settings only available with certain plans
- **Tenant Isolation:** Agencies can only access their client settings

### Feedback Patterns

- **Success Toast:** "Settings saved successfully"
- **Error Toast:** "Unable to save settings. Please try again."
- **Loading State:** Spinner + disabling form
- **Confirmation Modals:** For destructive actions (delete, revoke, remove)

---

## Document Status

**Version:** 1.0
**Last Updated:** 2026-04-13
**Status:** Active
**Next Review:** After settings implementation
**Maintainer:** UI/UX Team

**Related Documents:**

- [Business Architecture: Multi-Tenancy Model](/docs/architecture/business/business-architecture.md#6-multi-tenancy-model)
- [Technical Architecture: Security](/docs/architecture/business/technical-architecture.md#security-architecture)
- [Business Architecture: Stakeholder Requirements](/docs/architecture/business/business-architecture.md#4-stakeholder-requirements)
