import { randomBytes, scryptSync } from "node:crypto";

import { faker } from "@faker-js/faker";
import type { SystemRole } from "@agenticverdict/types";

faker.seed(12345);

const DEV_PASSWORD = "DevPassword123!";
const PASSWORD_PREFIX = "scrypt$";
const KEYLEN = 64;

function hashPassword(plain: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(plain, salt, KEYLEN, { N: 16384, r: 8, p: 1 });
  return `${PASSWORD_PREFIX}${salt.toString("base64")}$${hash.toString("base64")}`;
}

const DEV_PASSWORD_HASH = hashPassword(DEV_PASSWORD);

export interface SeedUser {
  email: string;
  displayName: string;
  passwordHash: string;
  emailVerified: boolean;
}

export type TenantType = "direct_business" | "agency_partner" | "agency_managed";

export class UserFactory {
  static create(
    tenantSlug: string,
    role: SystemRole = "viewer",
    tenantType: TenantType = "direct_business",
  ): SeedUser {
    const email = UserFactory.generateEmail(tenantSlug, role, tenantType);
    const displayName = UserFactory.generateDisplayName(tenantSlug, role, tenantType);

    return {
      email,
      displayName,
      passwordHash: DEV_PASSWORD_HASH,
      emailVerified: true,
    };
  }

  static generateEmail(tenantSlug: string, role: SystemRole, tenantType: TenantType): string {
    const domain =
      tenantType === "direct_business"
        ? `direct-${tenantSlug}.example.com`
        : tenantType === "agency_partner"
          ? `agency-${tenantSlug}.example.com`
          : `client-${tenantSlug}.example.com`;

    return `${role}@${domain}`;
  }

  static generateDisplayName(tenantSlug: string, role: SystemRole, tenantType: TenantType): string {
    const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);

    if (tenantType === "agency_partner") {
      return `Agency ${roleLabel} - ${tenantSlug}`;
    }

    if (tenantType === "agency_managed") {
      return `Client ${roleLabel} - ${tenantSlug}`;
    }

    return `${roleLabel} - ${tenantSlug}`;
  }

  static createList(
    tenantSlug: string,
    count: number,
    startWithAdmin = true,
    tenantType: TenantType = "direct_business",
  ): SeedUser[] {
    const roles: SystemRole[] = UserFactory.getRolesForTenantType(tenantType, startWithAdmin);
    return Array.from({ length: count }, (_, i) => {
      const role = roles[i % roles.length];
      return this.create(tenantSlug, role, tenantType);
    });
  }

  static getRolesForTenantType(tenantType: TenantType, startWithAdmin: boolean): SystemRole[] {
    if (tenantType === "agency_partner") {
      return ["admin", "analyst", "viewer"];
    }

    if (tenantType === "agency_managed") {
      return ["admin", "editor", "analyst"];
    }

    // direct_business
    return startWithAdmin ? ["admin", "analyst", "viewer"] : ["viewer", "analyst", "admin"];
  }
}
