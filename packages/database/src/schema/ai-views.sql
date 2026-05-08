-- AI Provider Management: Materialized Views and Indexes
-- Task 1.9, 1.10: Performance optimization for usage aggregation queries

-- ============================================================================
-- Materialized View: Usage Aggregation by Tenant/Provider/Day
-- ============================================================================

/**
 * Materialized view for fast usage dashboard queries
 * Pre-aggregates usage data by tenant, provider, and day
 * Refresh periodically (recommended: every 5-15 minutes)
 */
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_ai_usage_summary AS
SELECT
    tenant_id,
    provider_id,
    model_id,
    domain_id,
    DATE(timestamp) AS usage_date,
    SUM(prompt_tokens) AS total_prompt_tokens,
    SUM(completion_tokens) AS total_completion_tokens,
    SUM(total_tokens) AS total_tokens,
    SUM(cost_cents) AS total_cost_cents,
    COUNT(*) AS total_requests,
    COUNT(*) FILTER (WHERE success = true) AS successful_requests,
    COUNT(*) FILTER (WHERE success = false) AS failed_requests,
    AVG(latency_ms) AS avg_latency_ms,
    COUNT(*) FILTER (WHERE was_failover = true) AS failover_requests
FROM ai_usage_reports
GROUP BY tenant_id, provider_id, model_id, domain_id, DATE(timestamp);

-- Indexes for materialized view
CREATE UNIQUE INDEX IF NOT EXISTS mv_ai_usage_summary_unique_idx
ON mv_ai_usage_summary (tenant_id, provider_id, model_id, domain_id, usage_date);

CREATE INDEX IF NOT EXISTS mv_ai_usage_summary_tenant_date_idx
ON mv_ai_usage_summary (tenant_id, usage_date);

CREATE INDEX IF NOT EXISTS mv_ai_usage_summary_provider_date_idx
ON mv_ai_usage_summary (provider_id, usage_date);

-- ============================================================================
-- Materialized View: Usage Aggregation by Tenant/Month
-- ============================================================================

/**
 * Materialized view for monthly billing and reporting
 * Pre-aggregates usage data by tenant and month
 */
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_ai_usage_monthly AS
SELECT
    tenant_id,
    provider_id,
    model_id,
    domain_id,
    EXTRACT(YEAR FROM timestamp) AS year,
    EXTRACT(MONTH FROM timestamp) AS month,
    SUM(prompt_tokens) AS total_prompt_tokens,
    SUM(completion_tokens) AS total_completion_tokens,
    SUM(total_tokens) AS total_tokens,
    SUM(cost_cents) AS total_cost_cents,
    COUNT(*) AS total_requests,
    COUNT(*) FILTER (WHERE success = true) AS successful_requests,
    COUNT(*) FILTER (WHERE success = false) AS failed_requests,
    AVG(latency_ms) AS avg_latency_ms,
    MAX(cost_cents) FILTER (WHERE DATE(timestamp) = DATE(DATE_TRUNC('day', timestamp))) AS peak_daily_cost_cents
FROM ai_usage_reports
GROUP BY tenant_id, provider_id, model_id, domain_id, EXTRACT(YEAR FROM timestamp), EXTRACT(MONTH FROM timestamp);

-- Indexes for monthly view
CREATE UNIQUE INDEX IF NOT EXISTS mv_ai_usage_monthly_unique_idx
ON mv_ai_usage_monthly (tenant_id, provider_id, model_id, domain_id, year, month);

CREATE INDEX IF NOT EXISTS mv_ai_usage_monthly_tenant_idx
ON mv_ai_usage_monthly (tenant_id, year, month);

-- ============================================================================
-- Additional Performance Indexes (Task 1.10)
-- ============================================================================

-- AI Providers table indexes
CREATE INDEX IF NOT EXISTS ai_providers_credentials_idx
ON ai_providers (credentials_id) WHERE credentials_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS ai_providers_status_idx
ON ai_providers (status) WHERE status != 'active';

-- Business Domains table indexes
CREATE INDEX IF NOT EXISTS business_domains_uses_default_idx
ON business_domains (uses_tenant_default) WHERE uses_tenant_default = false;

-- Templates table indexes
CREATE INDEX IF NOT EXISTS ai_templates_deployments_idx
ON ai_templates (deployment_count) WHERE deployment_count > 0;

CREATE INDEX IF NOT EXISTS ai_templates_created_by_idx
ON ai_templates (created_by_id) WHERE created_by_id IS NOT NULL;

-- Usage Reports additional indexes
CREATE INDEX IF NOT EXISTS ai_usage_reports_success_idx
ON ai_usage_reports (success) WHERE success = false;

CREATE INDEX IF NOT EXISTS ai_usage_reports_failover_idx
ON ai_usage_reports (was_failover) WHERE was_failover = true;

CREATE INDEX IF NOT EXISTS ai_usage_reports_cost_idx
ON ai_usage_reports (cost_cents) WHERE cost_cents > 0;

-- Budget Alerts indexes
CREATE INDEX IF NOT EXISTS budget_alerts_created_by_idx
ON budget_alerts (created_by_id) WHERE created_by_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS budget_alerts_cooldown_idx
ON budget_alerts (cooldown_minutes) WHERE cooldown_minutes > 0;

-- ============================================================================
-- Refresh Function for Materialized Views
-- ============================================================================

/**
 * Function to refresh usage summary materialized view
 * Call this periodically via pg_cron or application scheduler
 */
CREATE OR REPLACE FUNCTION refresh_ai_usage_views()
RETURNS void AS $$
BEGIN
    -- Refresh daily summary
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_ai_usage_summary;
    
    -- Refresh monthly summary
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_ai_usage_monthly;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Comments for Documentation
-- ============================================================================

COMMENT ON MATERIALIZED VIEW mv_ai_usage_summary IS 
'Pre-aggregated AI usage data by tenant/provider/model/domain/day for fast dashboard queries';

COMMENT ON MATERIALIZED VIEW mv_ai_usage_monthly IS 
'Pre-aggregated AI usage data by tenant/provider/model/domain/month for billing and reporting';

COMMENT ON FUNCTION refresh_ai_usage_views() IS 
'Refreshes all AI usage materialized views. Should be called every 5-15 minutes.';
