import { createTenantContext, runWithTenantContext } from "@agenticverdict/core";
import type { TenantConfig } from "@agenticverdict/config";

import type { Database } from "../client";
import { dbScoped } from "../db-scoped";
import { platformCredentials } from "../schema/platform-credentials";

function createMinimalTenantConfig(tenantId: string): TenantConfig {
  return {
    tenantId,
    tenantName: "Seed Tenant",
    localization: { language: "en", region: "US", timezone: "UTC", currency: "USD" },
    marketing: { channels: [], kpis: [] },
    ai: { primaryModel: "claude-3-5-sonnet-20241022", provider: "anthropic" },
    features: { enableInsights: true, enableVerdict: true },
  };
}

export interface SeedPlatformCredential {
  platform: string;
  encryptedPayload: string;
}

/**
 * Seeds encrypted platform credentials for dev environments.
 * In production, credentials are provisioned via the admin UI.
 */
export async function seedPlatformCredentialsForTenant(
  db: Database,
  tenantId: string,
  credentials: SeedPlatformCredential[],
): Promise<void> {
  const context = createTenantContext({
    tenantId,
    tenantType: "direct_business",
    tenantStatus: "active",
    requestId: `seed-platform-credentials-${Date.now()}`,
    config: createMinimalTenantConfig(tenantId),
  });

  await runWithTenantContext(context, async () => {
    await dbScoped(db, async (tx) => {
      for (const cred of credentials) {
        await tx
          .insert(platformCredentials)
          .values({
            tenantId,
            platform: cred.platform,
            encryptedPayload: cred.encryptedPayload,
          })
          .onConflictDoNothing();
      }
    });
  });
}

/**
 * Creates dev placeholder encrypted payloads for all 5 connectors.
 * These are NOT real credentials - just placeholders for local development.
 */
export function createDevPlatformCredentials(): SeedPlatformCredential[] {
  return [
    {
      platform: "ga4",
      encryptedPayload: JSON.stringify({
        type: "service_account",
        project_id: "dev-ga4-project",
        private_key_id: "dev_key_id_ga4",
        private_key:
          "-----BEGIN RSA PRIVATE KEY-----\nDEV_PLACEHOLDER_GA4\n-----END RSA PRIVATE KEY-----\n",
        client_email: "ga4-dev@dev-project.iam.gserviceaccount.com",
        client_id: "dev_client_id_ga4",
      }),
    },
    {
      platform: "meta",
      encryptedPayload: JSON.stringify({
        access_token: "dev_meta_access_token_placeholder",
        account_id: "act_dev_123456789",
        app_id: "dev_meta_app_id",
        app_secret: "dev_meta_app_secret",
      }),
    },
    {
      platform: "gsc",
      encryptedPayload: JSON.stringify({
        type: "service_account",
        project_id: "dev-gsc-project",
        private_key_id: "dev_key_id_gsc",
        private_key:
          "-----BEGIN RSA PRIVATE KEY-----\nDEV_PLACEHOLDER_GSC\n-----END RSA PRIVATE KEY-----\n",
        client_email: "gsc-dev@dev-project.iam.gserviceaccount.com",
        client_id: "dev_client_id_gsc",
      }),
    },
    {
      platform: "tiktok",
      encryptedPayload: JSON.stringify({
        access_token: "dev_tiktok_access_token_placeholder",
        advertiser_id: "dev_tiktok_advertiser_id",
        app_id: "dev_tiktok_app_id",
        secret: "dev_tiktok_secret",
      }),
    },
    {
      platform: "gbp",
      encryptedPayload: JSON.stringify({
        type: "service_account",
        project_id: "dev-gbp-project",
        private_key_id: "dev_key_id_gbp",
        private_key:
          "-----BEGIN RSA PRIVATE KEY-----\nDEV_PLACEHOLDER_GBP\n-----END RSA PRIVATE KEY-----\n",
        client_email: "gbp-dev@dev-project.iam.gserviceaccount.com",
        client_id: "dev_client_id_gbp",
      }),
    },
  ];
}
