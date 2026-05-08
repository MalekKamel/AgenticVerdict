-- Migration: 002_connector_domain_to_fk.sql
-- Created: 2026-05-08
-- Purpose: Migrate tenant_connectors.domain (varchar) to tenant_connectors.domain_id (UUID FK → business_domains)

-- Step 1: Add the new domain_id column (nullable to allow existing rows)
ALTER TABLE tenant_connectors
  ADD COLUMN domain_id uuid;

-- Step 2: Create index on the new column for query performance
CREATE INDEX IF NOT EXISTS tenant_connectors_domain_id_idx ON tenant_connectors(domain_id);

-- Step 3: Backfill domain_id by matching existing domain strings to business_domains.name
-- This is a best-effort migration: rows with unmatched domain strings will retain NULL domain_id
UPDATE tenant_connectors tc
SET domain_id = bd.id
FROM business_domains bd
WHERE tc.domain IS NOT NULL
  AND tc.domain = bd.name
  AND tc.tenant_id = bd.tenant_id;

-- Step 4: Add the foreign key constraint (set null on delete to preserve connector data)
ALTER TABLE tenant_connectors
  ADD CONSTRAINT tenant_connectors_domain_id_fk
  FOREIGN KEY (domain_id)
  REFERENCES business_domains(id)
  ON DELETE SET NULL;

-- Step 5: Drop the old domain column and its index
DROP INDEX IF EXISTS tenant_connectors_domain_idx;
ALTER TABLE tenant_connectors DROP COLUMN domain;

-- Step 6: Recreate the index on the new column name (for Drizzle ORM schema alignment)
CREATE INDEX tenant_connectors_domain_idx ON tenant_connectors(domain_id);
