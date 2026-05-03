## ADDED Requirements

### Requirement: Database Role Resolution

The authentication flow SHALL resolve user roles from the database instead of using email-based heuristics. Role resolution SHALL occur during login and session refresh.

#### Scenario: Login with database roles
- **WHEN** user successfully authenticates with credentials
- **THEN** system queries user_roles table to fetch assigned roles
- **THEN** roles are embedded in JWT access token
- **THEN** user object returned includes roles array from database

#### Scenario: Default role for new users
- **WHEN** user has no roles assigned in database
- **THEN** system assigns "viewer" role by default
- **THEN** default role is not persisted to database (implicit fallback)

#### Scenario: Session refresh with updated roles
- **WHEN** user's session is refreshed (re-authentication)
- **THEN** roles are re-fetched from database
- **THEN** JWT includes updated roles
- **THEN** user sees permission changes immediately after refresh

### Requirement: JWT Token with Role Claims

The JWT access token SHALL include user roles as claims. Token signing SHALL use database-resolved roles, not hardcoded values.

#### Scenario: JWT signing with roles
- **WHEN** JWT is signed after successful authentication
- **THEN** token payload includes "roles" array claim
- **THEN** roles array contains role names (strings) from database
- **THEN** token is signed with configured secret

#### Scenario: JWT verification preserves roles
- **WHEN** JWT is verified on API request
- **THEN** decoded token includes roles from payload
- **THEN** roles are available in tRPC context for authorization

### Requirement: Auth Router Updates

The auth tRPC router SHALL be updated to use database role resolution. All email-based role checks SHALL be removed.

#### Scenario: getSession procedure
- **WHEN** `getSession` query is called with valid session
- **THEN** user object includes roles from database
- **THEN** mapUserRow function is async (fetches roles)
- **THEN** no email domain checks are performed

#### Scenario: login mutation
- **WHEN** `login` mutation succeeds
- **THEN** roles are fetched from database before JWT signing
- **THEN** JWT includes database roles
- **THEN** response includes user with roles array

### Requirement: Backward Compatibility

The system SHALL maintain backward compatibility during migration. Existing JWT tokens SHALL work until expiration.

#### Scenario: Legacy JWT validation
- **WHEN** request includes JWT with old role format
- **THEN** token is still valid (signature verification passes)
- **THEN** roles from old token are used for authorization
- **THEN** user is prompted to re-authenticate for role refresh

#### Scenario: Gradual migration
- **WHEN** some users have database roles, others don't
- **THEN** system handles both cases without error
- **THEN** users without database roles get default "viewer" role
