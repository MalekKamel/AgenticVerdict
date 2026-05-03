/**
 * RBAC Type Definitions
 *
 * Shared TypeScript types and Zod schemas for Role-Based Access Control.
 * These types are used by both frontend and backend for type safety.
 */

import { z } from "zod";

/**
 * Permission constants with const assertion for type inference.
 * All permission strings follow the pattern: "resource:action"
 */
export const PERMISSIONS = {
  // User management
  USERS_READ: "users:read" as const,
  USERS_WRITE: "users:write" as const,
  USERS_DELETE: "users:delete" as const,

  // Role management
  ROLES_READ: "roles:read" as const,
  ROLES_WRITE: "roles:write" as const,

  // Reports
  REPORTS_READ: "reports:read" as const,
  REPORTS_WRITE: "reports:write" as const,
  REPORTS_DELETE: "reports:delete" as const,
  REPORTS_SHARE: "reports:share" as const,

  // Translations
  TRANSLATIONS_READ: "translations:read" as const,
  TRANSLATIONS_WRITE: "translations:write" as const,

  // Settings
  SETTINGS_READ: "settings:read" as const,
  SETTINGS_WRITE: "settings:write" as const,

  // Connectors
  CONNECTORS_READ: "connectors:read" as const,
  CONNECTORS_WRITE: "connectors:write" as const,
  CONNECTORS_DELETE: "connectors:delete" as const,
} as const;

/**
 * Permission type derived from PERMISSIONS constant.
 * This is a union type of all permission strings.
 */
export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/**
 * System roles - predefined roles available to all tenants.
 */
export type SystemRole = "admin" | "analyst" | "editor" | "viewer";

/**
 * Custom roles - tenant-defined roles.
 * This is a string type to allow any custom role name.
 */
export type CustomRole = string;

/**
 * Role type - union of system and custom roles.
 */
export type Role = SystemRole | CustomRole;

/**
 * Role database schema for runtime validation.
 */
export const roleDbSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  name: z.string().min(1).max(128),
  description: z.string().max(512).optional(),
  isSystemRole: z.boolean(),
  isCustomRole: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type RoleDb = z.infer<typeof roleDbSchema>;

/**
 * Permission database schema for runtime validation.
 */
export const permissionDbSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(256),
  resource: z.string().min(1).max(128),
  action: z.string().min(1).max(64),
  description: z.string().max(512).optional(),
  createdAt: z.string().datetime(),
});

export type PermissionDb = z.infer<typeof permissionDbSchema>;

/**
 * User role assignment schema for runtime validation.
 */
export const userRoleSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  roleId: z.string().uuid(),
  grantedBy: z.string().uuid().optional(),
  grantedAt: z.string().datetime(),
  expiresAt: z.string().datetime().optional(),
});

export type UserRole = z.infer<typeof userRoleSchema>;

/**
 * Role permission assignment schema for runtime validation.
 */
export const rolePermissionSchema = z.object({
  id: z.string().uuid(),
  roleId: z.string().uuid(),
  permissionId: z.string().uuid(),
  grantedAt: z.string().datetime(),
});

export type RolePermission = z.infer<typeof rolePermissionSchema>;
