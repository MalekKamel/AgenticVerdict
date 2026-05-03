# Database Seed Update: Multi-Tenant Account Types

## Context

The multi-tenant architecture implementation from `/prompts/frontend-account-types-remediation-plan-updated.md` has been completed. The `tenants` table now includes explicit `type` and `status` columns with corresponding enums.

## Task

Update `/packages/database/src/seeds/users-seed.ts` to support all three tenant account types with appropriate seed data.

## Requirements

### 1. Email Naming Convention

Update all seed user emails to reflect the tenant type:

- **Direct Business**: `admin@direct-business.example.com`, `analyst@direct-business.example.com`
- **Agency Partner**: `admin@agency-partner.example.com`, `manager@agency-partner.example.com`
- **Agency Managed**: `admin@agency-client.example.com`, `editor@agency-client.example.com`

### 2. Seed Data Coverage

Ensure seed configurations exist for:

- At least 2 direct business tenants
- At least 1 agency partner tenant
- At least 2 agency-managed client tenants (linked to the agency partner)

### 3. Role Assignments

Maintain proper RBAC role assignments per tenant type:

- First user in each tenant: `admin` role
- Direct business additional users: `analyst` role
- Agency-managed additional users: `editor` role

### 4. Tenant Type Consistency

Update any hardcoded tenant type references in the seed file to use the new `tenantTypeEnum` values:

- `'direct_business'`
- `'agency_partner'`
- `'agency_managed'`

## Acceptance Criteria

- [ ] All seed emails clearly indicate the account type
- [ ] All three tenant types have seed data
- [ ] Agency hierarchy is properly represented (agency partner → agency-managed clients)
- [ ] Seed file remains idempotent
- [ ] Type references use the new enum values
- [ ] Existing seed helper functions continue to work without modification

## Files to Modify

- `/packages/database/src/seeds/users-seed.ts`

## Related Files

- `/packages/database/src/schema/tenants.ts` (tenant type enum definition)
- `/packages/types/src/tenant.ts` (type definitions)
