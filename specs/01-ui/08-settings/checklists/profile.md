# Profile Settings Checklist

**Purpose**: Validation checklist for User Story 1 (User Profile Settings)
**Status**: Draft

---

## Functional Requirements

- [ ] Users can view their current profile information (name, email, language, timezone)
- [ ] Users can update their name and changes persist
- [ ] Users can update their email and verification email is sent
- [ ] Users can select language (en, ar, fr) from dropdown
- [ ] Users can select timezone from searchable dropdown (IANA database)
- [ ] Language change triggers immediate RTL/LTR layout switch
- [ ] Timezone change reflects in all date/time displays
- [ ] Email verification flow works (request → receive email → click link → verified)
- [ ] Form validation works (required fields, email format, max length)
- [ ] Success/error notifications display after form submission
- [ ] Unsaved changes warning shows when navigating away

---

## RTL/LTR Support

- [ ] Arabic language selection switches layout to RTL
- [ ] English/French language selection switches layout to LTR
- [ ] All form labels are properly translated
- [ ] All placeholders are properly translated
- [ ] All validation messages are properly translated
- [ ] Layout direction changes immediately without page reload
- [ ] Topbar user menu reflects updated name in both directions

---

## Accessibility (WCAG 2.1 AA)

- [ ] All form fields have proper labels (htmlFor association)
- [ ] Required fields are marked with aria-required
- [ ] Validation errors are announced via aria-live
- [ ] Form fields can be navigated with keyboard (Tab, Enter, Space)
- [ ] Focus indicators are visible (2px solid outline)
- [ ] Color contrast meets WCAG AA ratios (4.5:1 for text)
- [ ] Language selector is accessible (screen reader announces current value)
- [ ] Timezone selector is accessible (searchable with keyboard)
- [ ] Success/error messages are announced to screen readers

---

## Form Validation

- [ ] Name field: Required, min 1 char, max 100 chars
- [ ] Email field: Required, valid email format
- [ ] Language field: Required, must be one of (en, ar, fr)
- [ ] Timezone field: Required, must be valid IANA timezone
- [ ] Inline validation errors display for each field
- [ ] Form cannot be submitted with invalid data
- [ ] Email uniqueness validated (error if email exists for different user)
- [ ] Validation clears when user starts typing

---

## Email Verification Flow

- [ ] Verification email sent within 10 seconds of request
- [ ] Email contains valid verification link
- [ ] Link expires after 24 hours
- [ ] Clicking valid link marks email as verified
- [ ] Clicking expired link shows error with "resend" option
- [ ] Old link invalidated when new verification requested
- [ ] User cannot log in with unverified email (if policy enforced)
- [ ] Verification status displayed in profile

---

## Error Handling

- [ ] Network errors show user-friendly message
- [ ] Validation errors are specific to the field
- [ ] Email conflict error shows clear message
- [ ] Server errors are logged and user is notified
- [ ] Rate limiting errors show "try again later" message
- [ ] Timeout errors show appropriate message
- [ ] Error messages are translated (en, ar, fr)

---

## Performance

- [ ] Profile page loads in <1.5s on 3G connection
- [ ] Form submission completes in <500ms
- [ ] Language change triggers RTL switch in <100ms
- [ ] Timezone dropdown handles 400+ timezones without lag
- [ ] Form validation is instant (<50ms)
- [ ] No layout shift during loading

---

## Security

- [ ] User can only view/update their own profile
- [ ] Email changes logged in audit log
- [ ] Verification tokens are secure (random, expires)
- [ ] Email enumeration prevented (same message for existing/non-existing)
- [ ] Rate limiting enforced (max 60 updates per minute)
- [ ] Input sanitization prevents XSS attacks
- [ ] CSRF protection enabled for form submission

---

## Cross-Browser Testing

- [ ] Chrome (latest): All features work
- [ ] Firefox (latest): All features work
- [ ] Safari (latest): All features work
- [ ] Edge (latest): All features work
- [ ] Mobile Safari (iOS): All features work
- [ ] Mobile Chrome (Android): All features work

---

## E2E Test Scenarios

- [ ] Navigate to profile settings
- [ ] Update name and save
- [ ] Verify name change reflects in topbar
- [ ] Change language to Arabic and verify RTL layout
- [ ] Change language to English and verify LTR layout
- [ ] Change timezone and verify in date displays
- [ ] Update email and receive verification email
- [ ] Click verification link and verify email marked as verified
- [ ] Submit form with empty fields and see validation errors
- [ ] Submit form with invalid email and see validation error
- [ ] Navigate away with unsaved changes and see warning
- [ ] Use keyboard navigation to complete form
- [ ] Use screen reader to complete form

---

## Manual Testing Notes

**Test Account Setup**:
- Create test user with verified email
- Create test user with unverified email
- Create test user with Arabic language preference
- Create test user with different timezone

**Test Email Verification**:
- Use mailosaur or similar service to capture verification emails
- Test expired token (wait 24 hours or manually expire)
- Test resend verification flow

**Test RTL Switching**:
- Verify all elements flip direction (not just text)
- Check icons and arrows flip correctly
- Verify form fields align right in RTL

**Test Timezone Change**:
- Change timezone to different region
- Verify timestamps in insights/reports reflect new timezone
- Check date formatting uses locale format

---

## Sign-off

- [ ] Developer: All tasks completed and tested
- [ ] QA: All acceptance criteria met
- [ ] Product: User story requirements satisfied
- [ ] Accessibility: WCAG 2.1 AA compliant
- [ ] Security: No vulnerabilities identified
