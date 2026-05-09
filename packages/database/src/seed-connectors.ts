import type { Database } from "./client";
import { connectorTagMappings, connectorTags, dataConnectors } from "./schema/index";

const CONNECTOR_ROWS: {
  id: string;
  name: string;
  version: string;
  description: string;
  credentialSchema: Record<string, unknown>;
}[] = [
  {
    id: "ga4",
    name: "Google Analytics 4",
    version: "1.0.0",
    description: "Web and app analytics",
    credentialSchema: {
      type: "service_account",
      fields: [
        { key: "client_email", secret: false, required: true },
        { key: "private_key", secret: true, required: true },
      ],
    },
  },
  {
    id: "gsc",
    name: "Google Search Console",
    version: "1.0.0",
    description: "Search performance and indexing",
    credentialSchema: {
      type: "oauth2",
      fields: [
        { key: "refresh_token", secret: true, required: true },
        { key: "access_token", secret: true, required: false },
      ],
    },
  },
  {
    id: "meta",
    name: "Meta Marketing",
    version: "1.0.0",
    description: "Facebook and Instagram ads and insights",
    credentialSchema: {
      type: "oauth2",
      fields: [
        { key: "access_token", secret: true, required: true },
        { key: "ad_account_id", secret: false, required: true },
      ],
    },
  },
  {
    id: "tiktok",
    name: "TikTok Marketing API",
    version: "1.0.0",
    description: "TikTok ads and organic performance",
    credentialSchema: {
      type: "oauth2",
      fields: [
        { key: "access_token", secret: true, required: true },
        { key: "advertiser_id", secret: false, required: true },
      ],
    },
  },
  {
    id: "gbp",
    name: "Google Business Profile",
    version: "1.0.0",
    description: "Local listings and reviews",
    credentialSchema: {
      type: "oauth2",
      fields: [{ key: "refresh_token", secret: true, required: true }],
    },
  },
];

const TAG_ROWS: { id: string; label: string; category: string }[] = [
  { id: "marketing", label: "Marketing", category: "domain" },
  { id: "finance", label: "Finance", category: "domain" },
  { id: "operations", label: "Operations", category: "domain" },
  { id: "seo", label: "SEO", category: "domain" },
  { id: "social", label: "Social Media", category: "domain" },
  { id: "local", label: "Local Business", category: "domain" },
];

const TAG_MAPPINGS: { connectorId: string; connectorTagId: string }[] = [
  { connectorId: "ga4", connectorTagId: "marketing" },
  { connectorId: "ga4", connectorTagId: "operations" },
  { connectorId: "gsc", connectorTagId: "marketing" },
  { connectorId: "gsc", connectorTagId: "seo" },
  { connectorId: "meta", connectorTagId: "marketing" },
  { connectorId: "meta", connectorTagId: "social" },
  { connectorId: "tiktok", connectorTagId: "marketing" },
  { connectorId: "tiktok", connectorTagId: "social" },
  { connectorId: "gbp", connectorTagId: "marketing" },
  { connectorId: "gbp", connectorTagId: "local" },
];

/**
 * Validates that all connectors in the registry have at least one tag mapping.
 * Throws an error if any connector is missing tags.
 */
export function validateConnectorTags(): void {
  const connectorIds = CONNECTOR_ROWS.map((c) => c.id);
  const taggedConnectorIds = new Set(TAG_MAPPINGS.map((m) => m.connectorId));

  const untaggedConnectors = connectorIds.filter((id) => !taggedConnectorIds.has(id));

  if (untaggedConnectors.length > 0) {
    throw new Error(
      `Connectors missing domain tags: ${untaggedConnectors.join(", ")}. ` +
        "All connectors must have at least one tag mapping in TAG_MAPPINGS.",
    );
  }
}

/**
 * Idempotently seeds the global connector registry, domain tags, and tag mappings.
 * Safe to run on every deploy; conflicts are ignored.
 */
export async function seedConnectorRegistry(db: Database): Promise<void> {
  // Validate tags before seeding
  validateConnectorTags();

  for (const row of CONNECTOR_ROWS) {
    await db
      .insert(dataConnectors)
      .values({
        id: row.id,
        name: row.name,
        version: row.version,
        description: row.description,
        credentialSchema: row.credentialSchema,
      })
      .onConflictDoUpdate({
        target: dataConnectors.id,
        set: {
          name: row.name,
          version: row.version,
          description: row.description,
          credentialSchema: row.credentialSchema,
        },
      });
  }

  for (const tag of TAG_ROWS) {
    await db
      .insert(connectorTags)
      .values({
        id: tag.id,
        label: tag.label,
        category: tag.category,
      })
      .onConflictDoUpdate({
        target: connectorTags.id,
        set: {
          label: tag.label,
          category: tag.category,
        },
      });
  }

  for (const m of TAG_MAPPINGS) {
    await db
      .insert(connectorTagMappings)
      .values({
        connectorId: m.connectorId,
        connectorTagId: m.connectorTagId,
      })
      .onConflictDoNothing();
  }
}
