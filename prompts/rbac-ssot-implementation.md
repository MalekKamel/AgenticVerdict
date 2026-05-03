# RBAC Single Source of Truth (SSOT) Implementation Plan

## Context

Role-Based Access Control (RBAC) is a critical security component of the AgenticVerdict platform. The current implementation lacks a centralized authority and relies on fragile, non-standard patterns scattered across multiple packages.

### Current Issues

- **No Single Source of Truth**: RBAC logic is distributed across multiple locations without a unified system
- **Fragile Email-Based Checks**: Implementation relies on string matching (e.g., `email.endsWith("@agenticverdict.com")`) instead of proper role-based authorization
- **Non-Standard Approach**: Current patterns do not follow industry RBAC best practices
- **Database Not Authoritative**: Role and permission data is not fully represented in the database schema

### Evidence Files

- `/apps/frontend/src/features/connectors/hooks/useConnectorPermissions.ts`
- `/apps/frontend/src/components/layout/AppShellLayout.tsx` (line contains `auth.user?.email?.endsWith("@agenticverdict.com")`)

## Objective

Design and implement a shared, database-driven RBAC system that serves as the Single Source of Truth (SSOT) across all packages, following industry standards and best practices.

## Requirements

### Functional Requirements

1. **Database-First RBAC**: All roles, permissions, and assignments must be stored and managed in the database
2. **Standard RBAC Model**: Implement roles, permissions, and role-permission assignments as first-class entities
3. **Cross-Package Consistency**: Shared types, utilities, and hooks accessible from all packages (`apps/frontend`, `apps/api`, `apps/worker`, `packages/*`)
4. **Seed Data**: Initial roles and permissions must be populated via database seeds

### Technical Constraints

- **Greenfield Implementation**: This is pre-production development with no backward compatibility requirements
- **Database Can Be Rebuilt**: Schema can be destroyed and recreated from scratch; no migration strategy needed
- **TypeScript First**: Full type safety across all layers with no `any` types
- **Multi-Tenant Safe**: Must align with tenant isolation guardrails (no tenant-specific hardcoding)

## Task

Conduct a comprehensive analysis of the current RBAC implementation and produce a detailed implementation plan document that includes:

1. **Current State Analysis**: Document all existing RBAC-related code patterns and their locations
2. **Proposed Schema Design**: Database tables for roles, permissions, role-permission assignments, and user-role assignments
3. **Shared Type Definitions**: TypeScript types and enums for roles and permissions
4. **API/Service Layer**: Backend services and resolvers for RBAC operations
5. **Frontend Integration**: Shared hooks and utilities for permission checks
6. **Seed Data Strategy**: Initial roles and permissions to populate
7. **Implementation Phases**: Ordered tasks for building and deploying the SSOT system

## Deliverable

Write a comprehensive implementation plan to `/docs/plans/rbac-ssot-implementation-plan.md` that provides actionable guidance for building the RBAC SSOT system.

## Success Criteria

- All authorization decisions derive from database-stored roles and permissions
- No email-based or string-matching authorization checks remain in the codebase
- Shared RBAC utilities are available and used consistently across all packages
- Seed data provides complete initial role/permission coverage
