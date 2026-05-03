-- Migration: 001_rls_policies.sql
-- Created: 2026-05-02
-- Purpose: Enable Row-Level Security (RLS) on all tenant-scoped tables

-- Enable RLS on all tenant-scoped tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_connectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.insight_connectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
CREATE POLICY tenant_isolation_users ON users
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Allow users to see their own user record even when switching contexts
CREATE POLICY users_self_read ON users
  FOR SELECT
  USING (id = current_setting('app.current_user_id')::uuid);

-- RLS for tenant_connectors
CREATE POLICY tenant_isolation_connectors ON tenant_connectors
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- RLS for insights
CREATE POLICY tenant_isolation_insights ON core.insights
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- RLS for reports
CREATE POLICY tenant_isolation_reports ON reports
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- RLS for report_templates
CREATE POLICY tenant_isolation_templates ON report_templates
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Agency partner access to client tenants
-- This policy allows agency partners to access their client tenant data
CREATE POLICY agency_client_access_insights ON core.insights
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tenants t
      WHERE t.id = core.insights.tenant_id
        AND t.parent_tenant_id = current_setting('app.current_tenant_id')::uuid
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tenants_type ON tenants(type);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);
CREATE INDEX IF NOT EXISTS idx_tenants_parent ON tenants(parent_tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenants_agency_partner ON tenants(agency_partner_id);
CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_insights_tenant ON core.insights(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_connectors_tenant ON tenant_connectors(tenant_id);
