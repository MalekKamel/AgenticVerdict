# Users and Permissions Entity

**Version:** 1.0
**Last Updated:** 2026-04-13
**Status:** Active
**Related Specs:**

- [Business Architecture](/docs/architecture/business/business-architecture.md#multi-tenancy-model)
- [Technical Architecture](/docs/architecture/business/technical-architecture.md#5-security-architecture)

---

## Overview

**Users** represent individuals who access the AgenticVerdict platform, with **role-based permissions** determining their capabilities within each tenant. The platform supports both **direct business users** (belonging to one tenant) and **agency partner users** (accessing multiple client tenants). All user operations are tenant-scoped, ensuring complete multi-tenant isolation.

**Key Concept:** Users have a **global identity** (email, password, name) but **tenant-specific roles and permissions**. An agency partner user can have different roles (e.g., Admin for one client, Viewer for another) across multiple tenants.

---

## Purpose

### User Goals

- **Business Owners:** Invite team members with appropriate access levels
- **Marketing Managers:** Manage campaigns and view insights
- **Analysts:** Create and configure insights without full admin access
- **Agency Partners:** Switch between clients with appropriate permissions
- **Viewers:** Access reports without modification rights

### Business Functions

- Multi-tenant user management
- Role-based access control (RBAC)
- Agency partner multi-tenant access
- User invitation and onboarding
- Audit logging for compliance

---

## User Entity

### Properties

#### Core Properties

| Property      | Type     | Validation             | Display Format     | Description                        |
| ------------- | -------- | ---------------------- | ------------------ | ---------------------------------- |
| `userId`      | UUID     | Required, unique       | `usr-abc-123`      | Unique user identifier             |
| `email`       | String   | Required, email format | Email input        | User email (unique globally)       |
| `name`        | String   | Required, min 2 chars  | Text input         | Full name                          |
| `avatarUrl`   | String   | URL, optional          | Avatar uploader    | Profile picture                    |
| `status`      | Enum     | Required               | Badge with color   | User status (see Lifecycle States) |
| `createdAt`   | DateTime | Auto-generated         | "2026-04-13"       | Account creation timestamp         |
| `lastLoginAt` | DateTime | Auto-updated           | "2026-04-13 14:30" | Last login timestamp               |
| `language`    | Enum     | Optional               | Dropdown           | UI language preference             |

#### Tenant-Specific Properties

| Property                  | Type     | Validation     | Display Format    | Description                            |
| ------------------------- | -------- | -------------- | ----------------- | -------------------------------------- |
| `tenantUsers.role`        | Enum     | Required       | Role selector     | User's role within tenant              |
| `tenantUsers.status`      | Enum     | Required       | Badge             | Tenant membership status               |
| `tenantUsers.joinedAt`    | DateTime | Auto-generated | "2026-04-13"      | When user joined tenant                |
| `tenantUsers.invitedBy`   | UUID     | Foreign key    | User ID           | Who invited user to tenant             |
| `tenantUsers.permissions` | Object   | Role-based     | Permission matrix | Granular permissions (see Permissions) |

---

## Roles and Permissions

### Role Definitions

| Role        | Description                  | Typical Users                      | Capabilities                                              |
| ----------- | ---------------------------- | ---------------------------------- | --------------------------------------------------------- |
| **Owner**   | Full control, billing access | Business owners, agency principals | All actions + billing + user management + tenant deletion |
| **Admin**   | Full operational control     | IT managers, operations leads      | All actions except billing and tenant deletion            |
| **Analyst** | Create and manage insights   | Marketing managers, analysts       | Create/edit insights, manage connectors, view reports     |
| **Viewer**  | Read-only access             | Executives, stakeholders           | View insights and reports only                            |

### Permission Matrix

| Action                 | Owner | Admin | Analyst | Viewer |
| ---------------------- | ----- | ----- | ------- | ------ |
| **Tenant Settings**    |
| View tenant settings   | ✅    | ✅    | ❌      | ❌     |
| Edit tenant settings   | ✅    | ✅    | ❌      | ❌     |
| Manage branding        | ✅    | ✅    | ❌      | ❌     |
| Manage features        | ✅    | ✅    | ❌      | ❌     |
| Access billing         | ✅    | ❌    | ❌      | ❌     |
| Delete tenant          | ✅    | ❌    | ❌      | ❌     |
| **User Management**    |
| Invite users           | ✅    | ✅    | ❌      | ❌     |
| Remove users           | ✅    | ✅    | ❌      | ❌     |
| Change user roles      | ✅    | ✅    | ❌      | ❌     |
| View all users         | ✅    | ✅    | ✅      | ❌     |
| **Connectors**         |
| Add connectors         | ✅    | ✅    | ✅      | ❌     |
| Edit connectors        | ✅    | ✅    | ✅      | ❌     |
| Remove connectors      | ✅    | ✅    | ✅      | ❌     |
| View connectors        | ✅    | ✅    | ✅      | ✅     |
| Sync connectors        | ✅    | ✅    | ✅      | ❌     |
| **Insights**           |
| Create insights        | ✅    | ✅    | ✅      | ❌     |
| Edit own insights      | ✅    | ✅    | ✅      | ❌     |
| Edit all insights      | ✅    | ✅    | ❌      | ❌     |
| Delete insights        | ✅    | ✅    | ✅      | ❌     |
| View insights          | ✅    | ✅    | ✅      | ✅     |
| Generate reports       | ✅    | ✅    | ✅      | ❌     |
| **Reports**            |
| View all reports       | ✅    | ✅    | ✅      | ✅     |
| Download reports       | ✅    | ✅    | ✅      | ✅     |
| Resend reports         | ✅    | ✅    | ✅      | ❌     |
| **Templates**          |
| Create templates       | ✅    | ✅    | ❌      | ❌     |
| Edit templates         | ✅    | ✅    | ❌      | ❌     |
| Delete templates       | ✅    | ✅    | ❌      | ❌     |
| **Agency Partner**     |
| Switch tenants         | ✅    | ✅    | ✅      | ✅     |
| View client list       | ✅    | ✅    | ✅      | ✅     |
| Access client insights | ✅    | ✅    | ✅      | ✅     |

### Granular Permissions (Future Enhancement)

For advanced use cases, permissions can be fine-tuned beyond roles:

```json
{
  "connectors": {
    "create": true,
    "read": true,
    "update": true,
    "delete": false,
    "sync": true
  },
  "insights": {
    "create": true,
    "read": true,
    "update": "own", // "own" or "all"
    "delete": "own",
    "generate": true
  },
  "reports": {
    "read": true,
    "download": true,
    "resend": false
  }
}
```

---

## Lifecycle States

### User States

| State           | Description                       | UI Representation           | Business Rules                       |
| --------------- | --------------------------------- | --------------------------- | ------------------------------------ |
| **PENDING**     | Invitation sent, not yet accepted | Badge: "Pending" (yellow)   | Cannot log in, can resend invitation |
| **ACTIVE**      | Fully operational                 | Badge: "Active" (green)     | Full access based on role            |
| **SUSPENDED**   | Temporarily disabled              | Badge: "Suspended" (orange) | Cannot log in, data preserved        |
| **DEACTIVATED** | Account closed                    | Badge: "Deactivated" (gray) | Cannot log in, soft delete           |
| **DELETED**     | Purged from system                | Hidden                      | Hard delete after retention          |

### Tenant Membership States

| State         | Description                   | UI Representation           | Business Rules                          |
| ------------- | ----------------------------- | --------------------------- | --------------------------------------- |
| **INVITED**   | Invitation sent, not accepted | Badge: "Invited" (yellow)   | No tenant access, can cancel invitation |
| **ACTIVE**    | Full tenant access            | Badge: "Active" (green)     | Access based on role                    |
| **SUSPENDED** | Access temporarily revoked    | Badge: "Suspended" (orange) | Cannot access tenant                    |
| **REMOVED**   | Removed from tenant           | Badge: "Removed" (gray)     | No tenant access                        |

### State Transitions

```
// User lifecycle
PENDING → ACTIVE (user accepts invitation)
ACTIVE → SUSPENDED (admin action)
SUSPENDED → ACTIVE (admin reinstates)
ACTIVE → DEACTIVATED (user or admin closes account)
DEACTIVATED → DELETED (purge after retention)

// Tenant membership lifecycle
INVITED → ACTIVE (user accepts invitation)
ACTIVE → SUSPENDED (admin action)
SUSPENDED → ACTIVE (admin reinstates)
ACTIVE → REMOVED (admin removes user)
INVITED → REMOVED (invitation cancelled)
```

---

## Actions

### User CRUD Operations

#### Create User (Self-Registration)

- **Permission:** Public (with invitation token)
- **Input:** Invitation token, name, password
- **Validation:** Valid token, strong password
- **Output:** User in PENDING state, tenant memberships in INVITED state
- **Next Action:** User logs in, memberships become ACTIVE

#### Invite User to Tenant

- **Permission:** Tenant admins
- **Input:** Email, role, tenant ID
- **Validation:** Valid email, user not already in tenant
- **Output:** Invitation email sent, tenant membership in INVITED state
- **Side Effects:** Create user account if doesn't exist

#### Read User

- **Permission:** Tenant users (own profile), tenant admins (tenant users)
- **Input:** User ID
- **Output:** User profile with tenant memberships
- **Privacy:** Only show memberships in accessible tenants

#### Update User

- **Permission:** User (own profile), tenant admins (tenant-specific properties)
- **Input:** Partial update (name, avatar, language)
- **Validation:** Maintain data integrity
- **Output:** Updated user profile

#### Delete User

- **Permission:** Platform admins
- **Input:** User ID
- **Validation:** No critical data dependencies
- **Output:** Confirmation
- **Side Effects:** Soft delete, purge after retention period

### User Actions

#### Accept Invitation

- **Permission:** Invited users
- **Input:** Invitation token
- **Validation:** Valid token, not expired
- **Output:** User in ACTIVE state, tenant memberships ACTIVE
- **Side Effects:** Send welcome email

#### Login

- **Permission:** Active users
- **Input:** Email, password
- **Validation:** Valid credentials
- **Output:** JWT token, refresh token
- **Side Effects:** Update lastLoginAt, log audit event

#### Switch Tenant (Agency Partners)

- **Permission:** Agency partner users
- **Input:** Target tenant ID
- **Validation:** User has ACTIVE membership in target tenant
- **Output:** Tenant context switched
- **Side Effects:** Update UI with tenant-specific data

#### Update Profile

- **Permission:** Authenticated users
- **Input:** Name, avatar, language preference
- **Validation:** Valid data
- **Output:** Updated profile
- **Side Effects:** Re-render UI with new preferences

#### Change Password

- **Permission:** Authenticated users
- **Input:** Current password, new password
- **Validation:** Strong password, current password correct
- **Output:** Password updated
- **Side Effects:** Invalidate existing tokens, require re-login

#### Reset Password

- **Permission:** Public (with reset token)
- **Input:** Reset token, new password
- **Validation:** Valid token, not expired
- **Output:** Password updated
- **Side Effects:** Invalidate existing tokens

### Tenant Membership Actions

#### Invite to Tenant

- **Permission:** Tenant admins
- **Input:** Email, role
- **Validation:** Valid email, within plan limits
- **Output:** Invitation sent
- **Side Effects:** Create user if doesn't exist

#### Update Role

- **Permission:** Tenant admins
- **Input:** User ID, new role
- **Validation:** User is tenant member
- **Output:** Role updated
- **Side Effects:** Log audit event, user notified

#### Remove from Tenant

- **Permission:** Tenant admins
- **Input:** User ID
- **Validation:** Not removing last owner
- **Output:** Membership in REMOVED state
- **Side Effects:** User notified, access revoked

#### Suspend Membership

- **Permission:** Tenant admins
- **Input:** User ID
- **Output:** Membership in SUSPENDED state
- **Side Effects:** User notified, access revoked

#### Reinstate Membership

- **Permission:** Tenant admins
- **Input:** User ID
- **Output:** Membership in ACTIVE state
- **Side Effects:** User notified, access restored

---

## Accessibility Requirements

### WCAG 2.1 Compliance

#### User Management Tables

- **Table Headers:** Proper `<th>` elements with `scope`
- **Row Actions:** Keyboard-accessible action buttons
- **Status Badges:** Color + text (never color alone)
- **Role Indicators:** Clear role labels with descriptions
- **Pagination:** Keyboard-accessible page controls

#### User Invitation Form

- **Form Labels:** Explicit labels for all inputs
- **Role Selection:** Accessible dropdown with descriptions
- **Email Validation:** Inline error messages with `aria-invalid`
- **Submit Button:** Clear button label
- **Success Feedback:** Confirmation message with focus management

#### Login Form

- **Form Labels:** Explicit labels for email/password
- **Password Visibility:** Toggle button with accessible label
- **Error Messages:** Clear error descriptions
- **Forgot Password:** Accessible link with clear purpose
- **Focus Management:** Focus on first field on load

#### Profile Settings

- **Avatar Upload:** Accessible file input with preview
- **Language Selection:** Accessible dropdown
- **Password Change:** Accessible form with strength indicator
- **Save Button:** Clear button label
- **Success Feedback:** Confirmation message

#### Tenant Switcher (Agency Partners)

- **Dropdown:** Keyboard navigation with arrow keys
- **Screen Reader:** Announces current tenant and options
- **Visual Indicator:** Clear display of current tenant
- **Focus Management:** Returns focus after switch

### Error Recovery

- **Clear Error Messages:** Specific error descriptions
- **Validation Feedback:** Inline errors with suggested corrections
- **Retry Mechanisms:** Allow resending invitations
- **Undo Actions:** Confirmation before destructive actions

---

## Internationalization

### Translation Keys

```json
{
  "user.role.owner": "Owner",
  "user.role.admin": "Admin",
  "user.role.analyst": "Analyst",
  "user.role.viewer": "Viewer",
  "user.status.pending": "Pending",
  "user.status.active": "Active",
  "user.status.suspended": "Suspended",
  "user.membership.invited": "Invited",
  "user.membership.active": "Active",
  "user.membership.suspended": "Suspended",
  "user.membership.removed": "Removed",
  "user.action.invite": "Invite User",
  "user.action.remove": "Remove User",
  "user.action.changeRole": "Change Role",
  "user.action.suspend": "Suspend",
  "user.action.reinstate": "Reinstate",
  "user.action.switchTenant": "Switch Company",
  "user.action.acceptInvitation": "Accept Invitation",
  "user.action.updateProfile": "Update Profile",
  "user.action.changePassword": "Change Password",
  "user.login.title": "Sign In",
  "user.login.email": "Email",
  "user.login.password": "Password",
  "user.login.forgotPassword": "Forgot Password?",
  "user.login.submit": "Sign In",
  "user.profile.language": "Language",
  "user.profile.avatar": "Profile Picture"
}
```

### RTL/LTR Considerations

#### User Management Tables

- **Table Layout:** Tables align right in RTL
- **Headers:** Headers align right in RTL
- **Action Buttons:** Buttons align left in RTL
- **Role Badges:** Badges maintain readability

#### User Invitation Form

- **Form Layout:** Labels above inputs (works for both directions)
- **Dropdown Menus:** Dropdowns open left in RTL
- **Help Text:** Aligns right below inputs in RTL

#### Login Form

- **Form Layout:** Centered, works for both directions
- **Input Fields:** Text aligns right in RTL
- **Button:** Centered, works for both directions

#### Profile Settings

- **Form Layout:** Labels above inputs (works for both directions)
- **Avatar Preview:** Centered, works for both directions
- **Language Selector:** Dropdown opens left in RTL

#### Tenant Switcher

- **Dropdown:** Opens left in RTL
- **Current Tenant Display:** Aligns right in RTL
- **Tenant List:** Items align right in RTL

---

## Related Components/Pages

### User Management Pages

| Page                  | Route                    | Description              | Key Components                |
| --------------------- | ------------------------ | ------------------------ | ----------------------------- |
| **User List**         | `/settings/users`        | Browse and manage users  | UserTable, InviteButton       |
| **User Profile**      | `/settings/profile`      | Edit own profile         | ProfileForm, AvatarUploader   |
| **Login**             | `/login`                 | User authentication      | LoginForm, ForgotPasswordLink |
| **Accept Invitation** | `/invite/:token`         | Accept tenant invitation | InvitationAcceptanceForm      |
| **Reset Password**    | `/reset-password/:token` | Reset forgotten password | PasswordResetForm             |

### Components

| Component              | Description                     | Props                                  |
| ---------------------- | ------------------------------- | -------------------------------------- |
| **UserTable**          | Table of tenant users           | `users`, `onRemove`, `onChangeRole`    |
| **UserRow**            | Single user row                 | `user`, `actions`                      |
| **InviteUserForm**     | Invite user to tenant           | `onInvite`, `roles`                    |
| **RoleSelector**       | Select user role                | `selected`, `onChange`, `disabled`     |
| **ProfileForm**        | Edit user profile               | `user`, `onUpdate`                     |
| \*\*AvatarUploader`    | Upload profile picture          | `currentAvatar`, `onUpload`            |
| **PasswordChangeForm** | Change password                 | `onChange`                             |
| **TenantSwitcher**     | Agency partner tenant switching | `currentTenant`, `tenants`, `onSwitch` |
| **UserBadge**          | Display user role/status        | `user`                                 |
| **PermissionMatrix**   | Display role permissions        | `role`                                 |

### Cross-References

- **[Tenant/Company](./tenant-company.md)** — Users belong to tenants
- **[Insights](./insights-reports.md)** — Users create and manage insights
- **[Connectors](./connectors.md)** — Users manage connectors

---

## Usage Examples

### User Table Component

```typescript
function UserTable() {
  const { data: users } = trpc.users.list.useQuery()
  const removeUser = trpc.users.remove.useMutation()
  const changeRole = trpc.users.changeRole.useMutation()

  return (
    <Table>
      <thead>
        <tr>
          <th>User</th>
          <th>Role</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {users?.map((user) => (
          <tr key={user.userId}>
            <td>
              <Group>
                <Avatar src={user.avatarUrl} />
                <div>
                  <Text weight={500}>{user.name}</Text>
                  <Text size="sm">{user.email}</Text>
                </div>
              </Group>
            </td>
            <td>
              <RoleSelector
                selected={user.role}
                onChange={(role) => changeRole.mutate({ userId: user.userId, role })}
              />
            </td>
            <td>
              <UserBadge status={user.status} />
            </td>
            <td>
              <ActionIcon
                color="red"
                onClick={() => removeUser.mutate({ userId: user.userId })}
              >
                <IconTrash />
              </ActionIcon>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  )
}
```

### Tenant Switcher (Agency Partners)

```typescript
function TenantSwitcher() {
  const { data: tenants } = trpc.tenants.list.useQuery()
  const [currentTenant, setCurrentTenant] = useTenantContext()

  return (
    <Menu>
      <Menu.Target>
        <Button>
          <Group>
            <IconBuilding />
            <Text>{currentTenant.name}</Text>
            <IconChevronDown />
          </Group>
        </Button>
      </Menu.Target>

      <Menu.Dropdown>
        {tenants?.map((tenant) => (
          <Menu.Item
            key={tenant.tenantId}
            onClick={() => setCurrentTenant(tenant)}
            active={tenant.tenantId === currentTenant.tenantId}
          >
            <Group>
              <Avatar src={tenant.logoUrl} />
              <Text>{tenant.name}</Text>
              {tenant.tenantId === currentTenant.tenantId && <IconCheck />}
            </Group>
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  )
}
```

### Invitation Acceptance Flow

```typescript
function AcceptInvitation({ token }: { token: string }) {
  const [step, setStep] = useState(1)
  const accept = trpc.users.acceptInvitation.useMutation()

  const handleAccept = async (data: AcceptInvitationInput) => {
    await accept.mutateAsync({ token, ...data })
    setStep(2)
  }

  if (step === 1) {
    return (
      <Card>
        <Title>Accept Invitation</Title>
        <AcceptInvitationForm onSubmit={handleAccept} />
      </Card>
    )
  }

  return (
    <Card>
      <Group>
        <IconCheck color="green" />
        <div>
          <Title>Invitation Accepted!</Title>
          <Text>You can now sign in to your account.</Text>
        </div>
      </Group>
      <Button component={Link} to="/login">
        Go to Sign In
      </Button>
    </Card>
  )
}
```

---

## Data Model

### Database Schema (Drizzle ORM)

```typescript
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  avatarUrl: text("avatar_url"),
  status: userStatusEnum("status").notNull().default("pending"),
  language: text("language").notNull().default("en"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastLoginAt: timestamp("last_login_at"),
});

export const tenantUsers = pgTable("tenant_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .references(() => companies.id)
    .notNull(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  role: userRoleEnum("role").notNull().default("viewer"),
  status: membershipStatusEnum("status").notNull().default("invited"),
  invitedBy: uuid("invited_by").references(() => users.id),
  joinedAt: timestamp("joined_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),

  // Unique constraint: one user per tenant
  unique: ["tenantId", "userId"],
});
```

---

## Testing Requirements

### Unit Tests

- Role permission checks
- User state transitions
- Tenant membership logic
- Invitation token validation

### Integration Tests

- User invitation flow
- Multi-tenant access control
- Agency partner tenant switching
- Permission enforcement

### E2E Tests

- User registration and login
- User invitation and acceptance
- Role-based access control
- Multi-tenant management

---

## Maintenance

**Document Version:** 1.0
**Last Updated:** 2026-04-13
**Status:** Active
**Next Review:** After Phase 1 completion
**Maintainer:** Security Team
