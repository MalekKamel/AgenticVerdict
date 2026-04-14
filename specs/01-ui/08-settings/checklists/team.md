# Team Management Checklist

**Purpose**: Validation checklist for User Story 4 (Team Management)
**Status**: Draft

---

## Functional Requirements

- [ ] Admins can view all team members
- [ ] Admins can invite new team members
- [ ] Admins can assign roles (Admin, Analyst, Viewer)
- [ ] Admins can update team member roles
- [ ] Admins can remove team members
- [ ] Admins can resend invitations
- [ ] Admins can cancel pending invitations
- [ ] Non-admins cannot access team management
- [ ] Invitation emails are delivered within 1 minute
- [ ] Invitations expire after 7 days
- [ ] Team statistics display correctly

---

## Role-Based Access Control

- [ ] Admin role: Full access to team management
- [ ] Analyst role: Cannot access team management
- [ ] Viewer role: Cannot access team management
- [ ] Non-admins see "access denied" message
- [ ] Role changes take effect immediately
- [ ] Role permissions enforced at API level
- [ ] Cannot remove own account if only admin
- [ ] Cannot change own role if only admin

---

## Team Member List

- [ ] All active members displayed with name, email, role
- [ ] Pending invitations displayed with email, role, status
- [ ] Members sorted by name (active) then invitation date (pending)
- [ ] Role badges display with different colors
- [ ] Status indicators (active, pending) are visible
- [ ] Pagination works for large teams (>20 members)
- [ ] Search/filter works by name or email
- [ ] Actions (edit role, remove) available for each member

---

## Invitation Flow

- [ ] "Invite Team Member" button opens dialog
- [ ] Email field validates format
- [ ] Role selector shows all available roles
- [ ] Invitation creates pending team member record
- [ ] Invitation email sent within 1 minute
- [ ] Email contains invitation link with token
- [ ] Link redirects to signup/login with invitation
- [ ] Accepting invitation adds user to team
- [ ] Invitation expires after 7 days
- [ ] Expired invitations show error message

---

## Role Management

- [ ] Role selector shows Admin, Analyst, Viewer options
- [ ] Role descriptions explain permissions
- [ ] Role changes take effect immediately
- [ ] Role change logged in audit log
- [ ] Cannot change own role if only admin
- [ ] Warning shown when removing last admin
- [ ] Role change confirmation dialog shown

---

## Team Member Removal

- [ ] Remove button available for each member
- [ ] Confirmation dialog shows member name and email
- [ ] Confirmation dialog warns about data loss
- [ ] Removal takes effect immediately
- [ ] Removed member loses access to platform
- [ ] Removal logged in audit log
- [ ] Cannot remove self if only admin
- [ ] Warning shown when attempting to remove last admin

---

## Invitation Management

- [ ] "Resend" button available for pending invitations
- [ ] Resending invalidates old link and creates new one
- [ ] New expiration date set (7 days from resend)
- [ ] "Cancel" button available for pending invitations
- [ ] Canceling invalidates invitation link
- [ ] Canceled invitations show "Canceled" status
- [ ] Rate limiting enforced (max 10 invitations per hour)

---

## Team Statistics

- [ ] Total members count displayed
- [ ] Active members count displayed
- [ ] Pending invitations count displayed
- [ ] Members by role breakdown displayed
- [ ] Seats used vs plan limit displayed
- [ ] Warning shown if seat limit reached
- [ ] "Upgrade" button shown if limit reached
- [ ] Statistics update in real-time

---

## RTL/LTR Support

- [ ] Team member list layout works in RTL
- [ ] Role badges align correctly in RTL
- [ ] Action buttons position correctly in RTL
- [ ] Dialog content aligns correctly in RTL
- [ ] Email and name fields align correctly in RTL
- [ ] All labels translated (en, ar, fr)
- [ ] All buttons translated (en, ar, fr)

---

## Accessibility (WCAG 2.1 AA)

- [ ] Team member list has proper ARIA labels
- [ ] Role badges have accessible names
- [ ] Action buttons have accessible labels
- [ ] Dialog has proper ARIA role and focus management
- [ ] Form fields have associated labels
- [ ] Error messages are announced via aria-live
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Focus indicators are visible
- [ ] Color contrast meets WCAG AA ratios

---

## Form Validation

- [ ] Email field: Required, valid email format
- [ ] Role field: Required, must be valid role
- [ ] Email uniqueness validated (error if already invited)
- [ ] Inline validation errors display
- [ ] Form cannot be submitted with invalid data
- [ ] Validation clears when user starts typing
- [ ] User-friendly error messages

---

## Error Handling

- [ ] Network errors show user-friendly message
- [ ] Validation errors are specific to the field
- [ ] Email conflict error shows clear message
- [ ] Server errors are logged and user is notified
- [ ] Rate limiting errors show "try again later" message
- [ ] Access denied errors show appropriate message
- [ ] Error messages are translated (en, ar, fr)

---

## Security

- [ ] Only admins can access team management
- [ ] Admin role validated at API level
- [ ] Tenant isolation enforced (row-level security)
- [ ] Invitation tokens are secure (random, expires)
- [ ] Audit logging for all team management actions
- [ ] Rate limiting enforced (max 10 invitations per hour)
- [ ] Input sanitization prevents XSS attacks

---

## Performance

- [ ] Team list loads in <1.5s on 3G connection
- [ ] Invitation sent within 1 minute
- [ ] Role update completes in <500ms
- [ ] Member removal completes in <500ms
- [ ] Statistics calculation completes in <500ms
- [ ] No layout shift during loading
- [ ] Pagination loads smoothly

---

## E2E Test Scenarios

- [ ] Admin navigates to team management
- [ ] Admin views all team members
- [ ] Admin invites new team member
- [ ] Admin assigns role to new member
- [ ] Admin updates member role
- [ ] Admin removes team member
- [ ] Admin resends invitation
- [ ] Admin cancels invitation
- [ ] Admin views team statistics
- [ ] Non-admin attempts to access team management (should fail)
- [ ] Admin attempts to remove self when only admin (should fail)
- [ ] Admin attempts to change own role when only admin (should fail)
- [ ] Test RTL layout with Arabic language
- [ ] Test keyboard navigation
- [ ] Test screen reader accessibility

---

## Manual Testing Notes

**Test Account Setup**:
- Create admin account
- Create analyst account
- Create viewer account
- Create tenant with multiple team members
- Create tenant with pending invitations

**Test Invitation Flow**:
- Use mailosaur or similar service to capture invitation emails
- Test expired invitation (wait 7 days or manually expire)
- Test resend invitation flow
- Test cancel invitation flow

**Test Role Permissions**:
- Verify admin can access all features
- Verify analyst cannot access team/billing
- Verify viewer can only view dashboards
- Test role changes and verify permissions update

**Test Edge Cases**:
- Attempt to remove last admin
- Attempt to change own role to non-admin
- Attempt to invite user who is already member
- Attempt to invite user with pending invitation
- Test with large team (100+ members)

---

## Sign-off

- [ ] Developer: All tasks completed and tested
- [ ] QA: All acceptance criteria met
- [ ] Product: User story requirements satisfied
- [ ] Accessibility: WCAG 2.1 AA compliant
- [ ] Security: No vulnerabilities identified
