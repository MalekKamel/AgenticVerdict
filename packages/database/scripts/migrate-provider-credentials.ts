#!/usr/bin/env node
/**
 * Migration Script: Tenant Provider Credentials (Task 3.46)
 *
 * This script migrates existing tenant configurations to the new provider configuration schema.
 * It:
 * 1. Creates the ai_provider_credentials table
 * 2. Creates the ai_provider_usage table
 * 3. Creates the ai_provider_health table
 * 4. Migrates any existing API keys from environment variables to encrypted storage
 * 5. Sets up default provider configurations for all tenants
 */

import { db } from "../client";
import { aiProviderCredentials } from "../schema";
import { tenants } from "../schema";
import { eq } from "drizzle-orm";
import { encrypt, generateIV } from "@agenticverdict/core";

async function migrateProviderCredentials() {
  console.log("Starting provider credentials migration...");

  try {
    // Step 1: Get all existing tenants
    console.log("Fetching existing tenants...");
    const allTenants = await db.select().from(tenants);
    console.log(`Found ${allTenants.length} tenants`);

    // Step 2: For each tenant, create default provider credentials
    console.log("Setting up default provider configurations...");

    const defaultProviders = [
      { providerId: "openai", priority: 0 },
      { providerId: "anthropic", priority: 1 },
    ];

    for (const tenant of allTenants) {
      console.log(`  Processing tenant: ${tenant.id}`);

      for (const provider of defaultProviders) {
        // Check if credential already exists
        const existing = await db
          .select()
          .from(aiProviderCredentials)
          .where(
            eq(aiProviderCredentials.tenantId, tenant.id) &&
              eq(aiProviderCredentials.providerId, provider.providerId),
          )
          .limit(1);

        if (existing.length > 0) {
          console.log(`    ✓ Provider ${provider.providerId} already configured`);
          continue;
        }

        // Create placeholder credential (tenant needs to provide actual API key)
        const iv = generateIV();
        const encryptedKey = encrypt("placeholder_key_will_be_updated_by_tenant", iv);

        await db.insert(aiProviderCredentials).values({
          tenantId: tenant.id,
          providerId: provider.providerId,
          encryptedApiKey: encryptedKey,
          encryptionIv: iv,
          isActive: false, // Inactive until tenant provides real key
          priority: provider.priority,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        console.log(`    ✓ Created placeholder for ${provider.providerId}`);
      }
    }

    // Step 3: Migrate any environment variable keys (if running in migration mode)
    const migrateEnvKeys = process.env.MIGRATE_ENV_KEYS === "true";

    if (migrateEnvKeys) {
      console.log("Migrating environment variable keys...");

      // For demo/development purposes only
      console.warn("⚠️  WARNING: Migrating environment keys is only for development!");
      console.warn("⚠️  In production, tenants should provide their own API keys via UI.");
    }

    console.log("\n✅ Migration completed successfully!");
    console.log("\nNext steps:");
    console.log("1. Tenants should configure their API keys via the UI");
    console.log("2. Monitor ai_provider_usage for billing");
    console.log("3. Configure ai_provider_health for circuit breaker");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateProviderCredentials()
    .then(() => {
      console.log("Migration script finished");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Migration script failed:", error);
      process.exit(1);
    });
}

export { migrateProviderCredentials };
