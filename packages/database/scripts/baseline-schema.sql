CREATE TYPE "agency_partner_tier" AS ENUM ('registered', 'certified', 'elite');
CREATE TYPE "insight_type" AS ENUM ('opportunity', 'risk', 'observation', 'recommendation');
CREATE TABLE "core"."agency_partners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"tier" agency_partner_tier DEFAULT 'registered' NOT NULL,
	"commission_rate" decimal(5,2) DEFAULT '10.00',
	"max_clients" integer DEFAULT 10,
	"white_label_enabled" boolean DEFAULT false,
	"partner_since" timestamp with time zone,
	"certified_at" timestamp with time zone,
	"settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "agency_partners_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"actor_user_id" uuid,
	"action" varchar(128) NOT NULL,
	"resource_type" varchar(128) NOT NULL,
	"resource_id" varchar(256) NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TYPE "tenant_type" AS ENUM ('direct_business', 'agency_partner', 'agency_managed');
CREATE TYPE "tenant_status" AS ENUM ('onboarding', 'active', 'suspended', 'restricted', 'archived', 'deleted');
CREATE TABLE "tenants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(256) NOT NULL,
	"slug" varchar(128) NOT NULL,
	"type" tenant_type DEFAULT 'direct_business' NOT NULL,
	"status" tenant_status DEFAULT 'onboarding' NOT NULL,
	"parent_tenant_id" uuid,
	"agency_partner_id" uuid,
	"language" varchar(2) DEFAULT 'en' NOT NULL,
	"region" varchar(2) DEFAULT 'US' NOT NULL,
	"timezone" varchar(64) DEFAULT 'UTC' NOT NULL,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"enable_insights" boolean DEFAULT true NOT NULL,
	"enable_verdict" boolean DEFAULT true NOT NULL,
	"enable_reports" boolean DEFAULT true NOT NULL,
	"max_insights" integer DEFAULT 10 NOT NULL,
	"max_users" integer DEFAULT 5 NOT NULL,
	"white_label_enabled" boolean DEFAULT false,
	"ai_provider" varchar(32) DEFAULT 'anthropic' NOT NULL,
	"ai_model" varchar(64) DEFAULT 'claude-3-5-sonnet-20241022' NOT NULL,
	"ai_quality_level" varchar(16) DEFAULT 'standard' NOT NULL,
	"ai_customization_level" varchar(16) DEFAULT 'balanced' NOT NULL,
	"ai_config" jsonb DEFAULT '{}'::jsonb,
	"ai_default_cost_tier" varchar(16) DEFAULT 'standard' NOT NULL,
	"ai_monthly_budget_cents" integer,
	"ai_budget_alert_threshold" integer DEFAULT 80 NOT NULL,
	"ai_enable_usage_tracking" boolean DEFAULT true NOT NULL,
	"ai_enable_budget_alerts" boolean DEFAULT true NOT NULL,
	"ai_enable_failover" boolean DEFAULT true NOT NULL,
	"ai_failover_providers" jsonb,
	"ai_usage_retention_days" integer DEFAULT 90 NOT NULL,
	"suspended_at" timestamp with time zone,
	"suspended_reason" text,
	"archived_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tenants_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "core"."connector_tag_mappings" (
	"connector_id" varchar(100) NOT NULL,
	"connector_tag_id" varchar(64) NOT NULL,
	CONSTRAINT "connector_tag_mappings_connector_id_connector_tag_id_pk" PRIMARY KEY("connector_id","connector_tag_id")
);
--> statement-breakpoint
CREATE TABLE "core"."connector_tags" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"label" varchar(128) NOT NULL,
	"category" varchar(64) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "core"."data_connectors" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"version" varchar(32) DEFAULT '1.0.0' NOT NULL,
	"description" text,
	"credential_schema" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feature_flags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"flag_key" text NOT NULL,
	"type" varchar(32) NOT NULL,
	"default_value" jsonb NOT NULL,
	"description" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "feature_flags_flag_key_unique" UNIQUE("flag_key")
);
--> statement-breakpoint
CREATE TABLE "i18n_strings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"locale" varchar(16) NOT NULL,
	"message_key" varchar(512) NOT NULL,
	"value" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "i18n_strings_tenant_locale_key_unique" UNIQUE("tenant_id","locale","message_key")
);
--> statement-breakpoint
CREATE TABLE "core"."insight_connectors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"insight_id" uuid NOT NULL,
	"connector_id" varchar(100) NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"selected_metrics" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"filters" jsonb DEFAULT '{}'::jsonb NOT NULL,
	CONSTRAINT "insight_connectors_insight_connector_unique" UNIQUE("insight_id","connector_id")
);
--> statement-breakpoint
CREATE TABLE "core"."insights" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"template_id" varchar(100),
	"enabled" boolean DEFAULT true NOT NULL,
	"domain" varchar(255),
	"status" varchar(50) DEFAULT 'idle' NOT NULL,
	"last_run_at" timestamp with time zone,
	"last_run_status" varchar(50),
	"schedule" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"delivery" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"ai_config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "insights_tenant_name_unique" UNIQUE("tenant_id","name")
);
--> statement-breakpoint
CREATE TABLE "core"."generated_insights" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"report_id" uuid NOT NULL,
	"analysis_id" uuid,
	"insight_type" insight_type NOT NULL,
	"title" varchar(512) NOT NULL,
	"description" text NOT NULL,
	"confidence" decimal(3,2) DEFAULT '0' NOT NULL,
	"relevance_score" decimal(3,2) DEFAULT '0' NOT NULL,
	"platforms" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"related_metric_keys" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "generated_insights_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE "marketing_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"platform" varchar(64) NOT NULL,
	"metric_date" date NOT NULL,
	"payload" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_credentials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"platform" varchar(64) NOT NULL,
	"encrypted_payload" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "platform_credentials_tenant_platform_unique" UNIQUE("tenant_id","platform")
);
--> statement-breakpoint
CREATE TABLE "provenance_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"analysis_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"captured_at" timestamp with time zone DEFAULT now() NOT NULL,
	"record" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "report_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(256) NOT NULL,
	"definition" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"title" varchar(512) NOT NULL,
	"status" varchar(64) DEFAULT 'draft' NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "core"."generated_insights" ADD CONSTRAINT "generated_insights_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE cascade;--> statement-breakpoint
CREATE TABLE "tenant_feature_flags" (
	"tenant_id" uuid NOT NULL,
	"flag_id" uuid NOT NULL,
	"value" jsonb NOT NULL,
	"override_type" varchar(32) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tenant_feature_flags_tenant_id_flag_id_pk" PRIMARY KEY("tenant_id","flag_id")
);
--> statement-breakpoint
CREATE TABLE "core"."usage_tracking" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"metric_type" varchar(50) NOT NULL,
	"quantity" integer NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"email" varchar(320) NOT NULL,
	"display_name" varchar(256),
	"password_hash" varchar(512),
	"email_verified" boolean DEFAULT true NOT NULL,
	"email_verification_token_hash" varchar(64),
	"email_verification_expires_at" timestamp with time zone,
	"password_reset_token_hash" varchar(64),
	"password_reset_expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_tenant_id_email_unique" UNIQUE("tenant_id","email")
);
--> statement-breakpoint
CREATE TABLE "tenant_connectors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"platform" varchar(64) NOT NULL,
	"name" varchar(255) NOT NULL,
	"status" varchar(32) DEFAULT 'inactive' NOT NULL,
	"domain_id" uuid,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"metrics" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"sync_frequency" varchar(32) DEFAULT 'daily',
	"retention_days" integer DEFAULT 90,
	"notifications" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"advanced_options" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"last_sync_at" timestamp with time zone,
	"next_sync_at" timestamp with time zone,
	"last_sync_status" varchar(32),
	"last_sync_records" integer,
	"paused" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "connector_sync_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"connector_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"status" varchar(32) NOT NULL,
	"records" integer,
	"message" text,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(256) NOT NULL,
	"resource" varchar(128) NOT NULL,
	"action" varchar(64) NOT NULL,
	"description" varchar(512),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "permissions_name_unique" UNIQUE("name"),
	CONSTRAINT "permissions_resource_action_unique" UNIQUE("resource","action")
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(128) NOT NULL,
	"description" varchar(512),
	"is_system_role" boolean DEFAULT false NOT NULL,
	"is_custom_role" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "roles_tenant_id_name_unique" UNIQUE("tenant_id","name")
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	"granted_by" uuid,
	"granted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	CONSTRAINT "user_roles_user_id_role_id_unique" UNIQUE("user_id","role_id")
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"role_id" uuid NOT NULL,
	"permission_id" uuid NOT NULL,
	"granted_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "role_permissions_role_id_permission_id_unique" UNIQUE("role_id","permission_id")
);
--> statement-breakpoint
CREATE TABLE "business_domains" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(128) NOT NULL,
	"description" text,
	"parent_id" uuid,
	"order" integer DEFAULT 0 NOT NULL,
	"provider_config" jsonb,
	"uses_tenant_default" boolean DEFAULT true NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "business_domains_tenant_name_unique" UNIQUE("tenant_id","name")
);
--> statement-breakpoint
CREATE TABLE "domain_connector_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"domain_id" uuid NOT NULL,
	"connector_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"assigned_by" uuid,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "domain_connector_assignments_connector_unique" UNIQUE("connector_id")
);
--> statement-breakpoint
CREATE TABLE "domain_hierarchy_cache" (
	"domain_id" uuid PRIMARY KEY NOT NULL,
	"materialized_path" text NOT NULL,
	"ancestor_ids" jsonb NOT NULL,
	"descendant_ids" jsonb NOT NULL,
	"depth" integer DEFAULT 0 NOT NULL,
	"last_refreshed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TYPE "provider_status" AS ENUM ('active', 'inactive', 'error');
CREATE TYPE "provider_scope" AS ENUM ('tenant', 'domain', 'connector');
CREATE TYPE "cost_tier" AS ENUM ('premium', 'standard', 'economy');
CREATE TABLE "ai_providers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"provider_id" varchar(64) NOT NULL,
	"provider_name" varchar(128) NOT NULL,
	"model_id" varchar(128) NOT NULL,
	"model_name" varchar(128),
	"cost_tier" cost_tier DEFAULT 'standard' NOT NULL,
	"custom_pricing" jsonb,
	"scope" provider_scope NOT NULL,
	"parent_id" uuid,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"status" provider_status DEFAULT 'active' NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"rate_limit_override" integer,
	"timeout_override" integer,
	"base_url" text,
	"is_override" boolean DEFAULT false NOT NULL,
	"last_health_check_at" timestamp with time zone,
	"health_error_message" text,
	"credentials_id" uuid,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ai_providers_tenant_scope_parent_unique" UNIQUE("tenant_id","scope","parent_id","provider_id")
);
--> statement-breakpoint
CREATE TABLE "ai_provider_models" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider_id" varchar(64) NOT NULL,
	"provider_ref_id" uuid,
	"model_id" varchar(128) NOT NULL,
	"model_name" varchar(128) NOT NULL,
	"version" varchar(32) NOT NULL,
	"context_window" integer NOT NULL,
	"input_cost_per_1k" integer DEFAULT 0 NOT NULL,
	"output_cost_per_1k" integer DEFAULT 0 NOT NULL,
	"supports_streaming" boolean DEFAULT false NOT NULL,
	"supports_function_calling" boolean DEFAULT false NOT NULL,
	"is_multimodal" boolean DEFAULT false NOT NULL,
	"capabilities" jsonb,
	"is_available" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ai_provider_models_provider_model_unique" UNIQUE("provider_id","model_id"),
	CONSTRAINT "ai_provider_models_provider_ref_id_fk" FOREIGN KEY ("provider_ref_id") REFERENCES "ai_providers"("id") ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE "ai_provider_failover" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"primary_provider_id" varchar(64) NOT NULL,
	"fallback_providers" jsonb NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"provider_timeout" integer DEFAULT 10000 NOT NULL,
	"max_retries" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ai_provider_failover_tenant_primary_unique" UNIQUE("tenant_id","primary_provider_id")
);
--> statement-breakpoint
CREATE TABLE "ai_provider_credentials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"provider_id" varchar(64) NOT NULL,
	"encrypted_api_key" text NOT NULL,
	"encryption_iv" text NOT NULL,
	"base_url" text,
	"aws_access_key_id" text,
	"aws_secret_access_key" text,
	"aws_region" varchar(32),
	"is_active" boolean DEFAULT true NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"rate_limit_override" integer,
	"timeout_override" integer,
	"last_used_at" timestamp with time zone,
	"last_rotated_at" timestamp with time zone,
	"next_rotation_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ai_provider_credentials_tenant_provider_unique" UNIQUE("tenant_id","provider_id")
);
--> statement-breakpoint
CREATE TABLE "ai_provider_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"provider_id" varchar(64) NOT NULL,
	"model_id" varchar(128) NOT NULL,
	"input_tokens" integer DEFAULT 0 NOT NULL,
	"output_tokens" integer DEFAULT 0 NOT NULL,
	"cost_cents" integer DEFAULT 0 NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"request_id" uuid,
	"was_failover" boolean DEFAULT false NOT NULL,
	"latency_ms" integer,
	"success" boolean DEFAULT true NOT NULL,
	"error_code" varchar(64)
);
--> statement-breakpoint
CREATE TABLE "ai_provider_health" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider_id" varchar(64) NOT NULL,
	"tenant_id" uuid,
	"error_rate" integer DEFAULT 0 NOT NULL,
	"avg_latency_ms" integer DEFAULT 0 NOT NULL,
	"p95_latency_ms" integer DEFAULT 0 NOT NULL,
	"requests_per_minute" integer DEFAULT 0 NOT NULL,
	"circuit_state" varchar(16) DEFAULT 'closed' NOT NULL,
	"consecutive_failures" integer DEFAULT 0 NOT NULL,
	"last_health_check" timestamp with time zone DEFAULT now() NOT NULL,
	"last_failure" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ai_provider_health_provider_tenant_unique" UNIQUE("provider_id","tenant_id")
);
--> statement-breakpoint
CREATE TYPE "template_type" AS ENUM ('prompt', 'configuration', 'workflow');
CREATE TYPE "template_status" AS ENUM ('draft', 'published', 'archived');
CREATE TABLE "ai_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(128) NOT NULL,
	"description" text,
	"type" template_type NOT NULL,
	"version" varchar(32) DEFAULT '1.0.0' NOT NULL,
	"content" text NOT NULL,
	"variables" jsonb DEFAULT '[]'::jsonb,
	"provider_id" varchar(64),
	"model_id" varchar(128),
	"domain_id" uuid,
	"status" template_status DEFAULT 'draft' NOT NULL,
	"parent_version_id" uuid,
	"is_latest_version" boolean DEFAULT false NOT NULL,
	"version_number" integer DEFAULT 1 NOT NULL,
	"created_by_id" uuid,
	"deployment_count" integer DEFAULT 0 NOT NULL,
	"last_deployed_at" timestamp with time zone,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ai_templates_tenant_name_domain_unique" UNIQUE("tenant_id","name","domain_id")
);
--> statement-breakpoint
CREATE TABLE "template_deployments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"scope" varchar(16) NOT NULL,
	"target_id" uuid,
	"deployed_variables" jsonb,
	"deployed_by" uuid,
	"deployment_status" varchar(32) DEFAULT 'active' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "template_usage_analytics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"usage_date" timestamp with time zone NOT NULL,
	"execution_count" integer DEFAULT 0 NOT NULL,
	"success_count" integer DEFAULT 0 NOT NULL,
	"failure_count" integer DEFAULT 0 NOT NULL,
	"avg_execution_time_ms" integer DEFAULT 0 NOT NULL,
	"total_tokens" integer DEFAULT 0 NOT NULL,
	"total_cost_cents" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "template_usage_analytics_template_date_unique" UNIQUE("template_id","usage_date")
);
--> statement-breakpoint
CREATE TABLE "ai_usage_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"provider_id" varchar(64) NOT NULL,
	"model_id" varchar(128) NOT NULL,
	"domain_id" uuid,
	"connector_id" uuid,
	"request_id" varchar(128) NOT NULL,
	"prompt_tokens" integer DEFAULT 0 NOT NULL,
	"completion_tokens" integer DEFAULT 0 NOT NULL,
	"total_tokens" integer DEFAULT 0 NOT NULL,
	"cost_cents" integer DEFAULT 0 NOT NULL,
	"timestamp" timestamp with time zone NOT NULL,
	"latency_ms" integer DEFAULT 0 NOT NULL,
	"success" boolean DEFAULT true NOT NULL,
	"error_code" varchar(64),
	"error_message" text,
	"was_failover" boolean DEFAULT false NOT NULL,
	"failover_attempt" integer DEFAULT 0,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ai_usage_reports_request_unique" UNIQUE("request_id")
);
--> statement-breakpoint
CREATE TABLE "ai_usage_aggregation_daily" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"usage_date" timestamp with time zone NOT NULL,
	"provider_id" varchar(64) NOT NULL,
	"model_id" varchar(128) NOT NULL,
	"domain_id" uuid,
	"total_prompt_tokens" integer DEFAULT 0 NOT NULL,
	"total_completion_tokens" integer DEFAULT 0 NOT NULL,
	"total_tokens" integer DEFAULT 0 NOT NULL,
	"total_cost_cents" integer DEFAULT 0 NOT NULL,
	"total_requests" integer DEFAULT 0 NOT NULL,
	"successful_requests" integer DEFAULT 0 NOT NULL,
	"failed_requests" integer DEFAULT 0 NOT NULL,
	"avg_latency_ms" integer DEFAULT 0 NOT NULL,
	"failover_requests" integer DEFAULT 0 NOT NULL,
	"last_aggregated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "ai_usage_aggregation_daily_unique" UNIQUE("tenant_id","usage_date","provider_id","model_id")
);
--> statement-breakpoint
CREATE TABLE "ai_usage_aggregation_monthly" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	"provider_id" varchar(64) NOT NULL,
	"model_id" varchar(128) NOT NULL,
	"domain_id" uuid,
	"total_prompt_tokens" integer DEFAULT 0 NOT NULL,
	"total_completion_tokens" integer DEFAULT 0 NOT NULL,
	"total_tokens" integer DEFAULT 0 NOT NULL,
	"total_cost_cents" integer DEFAULT 0 NOT NULL,
	"total_requests" integer DEFAULT 0 NOT NULL,
	"successful_requests" integer DEFAULT 0 NOT NULL,
	"failed_requests" integer DEFAULT 0 NOT NULL,
	"avg_latency_ms" integer DEFAULT 0 NOT NULL,
	"peak_daily_cost_cents" integer DEFAULT 0 NOT NULL,
	"last_aggregated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "ai_usage_aggregation_monthly_unique" UNIQUE("tenant_id","year","month","provider_id","model_id")
);
--> statement-breakpoint
CREATE TYPE "alert_type" AS ENUM ('threshold', 'percentage', 'rate');
CREATE TYPE "alert_threshold_type" AS ENUM ('cost', 'tokens', 'requests');
CREATE TYPE "alert_time_window" AS ENUM ('hourly', 'daily', 'weekly', 'monthly');
CREATE TYPE "alert_status" AS ENUM ('active', 'paused', 'triggered');
CREATE TABLE "budget_alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(128) NOT NULL,
	"description" text,
	"type" alert_type NOT NULL,
	"threshold" integer NOT NULL,
	"threshold_type" alert_threshold_type NOT NULL,
	"time_window" alert_time_window NOT NULL,
	"status" alert_status DEFAULT 'active' NOT NULL,
	"notifications" jsonb NOT NULL,
	"last_triggered_at" timestamp with time zone,
	"last_evaluated_at" timestamp with time zone,
	"last_evaluated_value" integer,
	"trigger_count" integer DEFAULT 0 NOT NULL,
	"cooldown_minutes" integer DEFAULT 60 NOT NULL,
	"created_by_id" uuid,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "alert_trigger_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"alert_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"triggered_value" integer NOT NULL,
	"threshold_value" integer NOT NULL,
	"exceeded_by" integer,
	"triggered_at" timestamp with time zone NOT NULL,
	"notifications_sent" jsonb,
	"evaluation_context" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "budget_period_summaries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"period_type" alert_time_window NOT NULL,
	"period_start" timestamp with time zone NOT NULL,
	"period_end" timestamp with time zone NOT NULL,
	"total_cost_cents" integer DEFAULT 0 NOT NULL,
	"total_tokens" integer DEFAULT 0 NOT NULL,
	"total_requests" integer DEFAULT 0 NOT NULL,
	"budget_limit_cents" integer,
	"budget_used_percent" integer DEFAULT 0 NOT NULL,
	"projected_cost_cents" integer,
	"days_remaining" integer,
	"daily_average_cost_cents" integer,
	"alerts_triggered" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "budget_period_summaries_tenant_period_unique" UNIQUE("tenant_id","period_type","period_start")
);
--> statement-breakpoint
CREATE TABLE "report_shares" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"report_id" uuid NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL,
	CONSTRAINT "report_shares_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "audit_trail" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"insight_id" uuid,
	"event_type" varchar(128) NOT NULL,
	"event_data" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tenant_connectors" ADD CONSTRAINT "tenant_connectors_domain_id_business_domains_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."business_domains"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_domains" ADD CONSTRAINT "business_domains_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_domains" ADD CONSTRAINT "business_domains_parent_id_business_domains_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."business_domains"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "domain_connector_assignments" ADD CONSTRAINT "domain_connector_assignments_domain_id_business_domains_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."business_domains"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "domain_connector_assignments" ADD CONSTRAINT "domain_connector_assignments_connector_id_tenant_connectors_id_fk" FOREIGN KEY ("connector_id") REFERENCES "public"."tenant_connectors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "domain_connector_assignments" ADD CONSTRAINT "domain_connector_assignments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "domain_connector_assignments" ADD CONSTRAINT "domain_connector_assignments_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "domain_hierarchy_cache" ADD CONSTRAINT "domain_hierarchy_cache_domain_id_business_domains_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."business_domains"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_providers" ADD CONSTRAINT "ai_providers_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_provider_failover" ADD CONSTRAINT "ai_provider_failover_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_provider_credentials" ADD CONSTRAINT "ai_provider_credentials_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_provider_usage" ADD CONSTRAINT "ai_provider_usage_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_provider_health" ADD CONSTRAINT "ai_provider_health_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_templates" ADD CONSTRAINT "ai_templates_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_templates" ADD CONSTRAINT "ai_templates_domain_id_business_domains_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."business_domains"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_templates" ADD CONSTRAINT "ai_templates_parent_version_id_ai_templates_id_fk" FOREIGN KEY ("parent_version_id") REFERENCES "public"."ai_templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_templates" ADD CONSTRAINT "ai_templates_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_deployments" ADD CONSTRAINT "template_deployments_template_id_ai_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."ai_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_deployments" ADD CONSTRAINT "template_deployments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_deployments" ADD CONSTRAINT "template_deployments_deployed_by_users_id_fk" FOREIGN KEY ("deployed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_usage_analytics" ADD CONSTRAINT "template_usage_analytics_template_id_ai_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."ai_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_usage_analytics" ADD CONSTRAINT "template_usage_analytics_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_usage_reports" ADD CONSTRAINT "ai_usage_reports_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_usage_reports" ADD CONSTRAINT "ai_usage_reports_domain_id_business_domains_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."business_domains"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_usage_aggregation_daily" ADD CONSTRAINT "ai_usage_aggregation_daily_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_usage_aggregation_daily" ADD CONSTRAINT "ai_usage_aggregation_daily_domain_id_business_domains_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."business_domains"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_usage_aggregation_monthly" ADD CONSTRAINT "ai_usage_aggregation_monthly_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_usage_aggregation_monthly" ADD CONSTRAINT "ai_usage_aggregation_monthly_domain_id_business_domains_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."business_domains"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_alerts" ADD CONSTRAINT "budget_alerts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_alerts" ADD CONSTRAINT "budget_alerts_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alert_trigger_history" ADD CONSTRAINT "alert_trigger_history_alert_id_budget_alerts_id_fk" FOREIGN KEY ("alert_id") REFERENCES "public"."budget_alerts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alert_trigger_history" ADD CONSTRAINT "alert_trigger_history_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_period_summaries" ADD CONSTRAINT "budget_period_summaries_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_shares" ADD CONSTRAINT "report_shares_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_shares" ADD CONSTRAINT "report_shares_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_trail" ADD CONSTRAINT "audit_trail_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_trail" ADD CONSTRAINT "audit_trail_insight_id_insights_id_fk" FOREIGN KEY ("insight_id") REFERENCES "core"."insights"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "business_domains_tenant_idx" ON "business_domains" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "business_domains_parent_idx" ON "business_domains" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "business_domains_order_idx" ON "business_domains" USING btree ("order");--> statement-breakpoint
CREATE INDEX "business_domains_tenant_parent_idx" ON "business_domains" USING btree ("tenant_id","parent_id");--> statement-breakpoint
CREATE INDEX "domain_connector_assignments_domain_idx" ON "domain_connector_assignments" USING btree ("domain_id");--> statement-breakpoint
CREATE INDEX "domain_connector_assignments_connector_idx" ON "domain_connector_assignments" USING btree ("connector_id");--> statement-breakpoint
CREATE INDEX "domain_connector_assignments_tenant_idx" ON "domain_connector_assignments" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "domain_connector_assignments_domain_connector_idx" ON "domain_connector_assignments" USING btree ("domain_id","connector_id");--> statement-breakpoint
CREATE INDEX "ai_providers_tenant_id_idx" ON "ai_providers" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "ai_providers_provider_id_idx" ON "ai_providers" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "ai_provider_models_provider_id_idx" ON "ai_provider_models" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "ai_provider_models_provider_ref_idx" ON "ai_provider_models" USING btree ("provider_ref_id");--> statement-breakpoint
CREATE INDEX "ai_provider_failover_tenant_id_idx" ON "ai_provider_failover" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ai_provider_credentials_tenant_idx" ON "ai_provider_credentials" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "ai_provider_usage_tenant_idx" ON "ai_provider_usage" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "ai_provider_usage_timestamp_idx" ON "ai_provider_usage" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "ai_provider_usage_tenant_provider_month_idx" ON "ai_provider_usage" USING btree ("tenant_id","provider_id","timestamp");--> statement-breakpoint
CREATE INDEX "ai_templates_tenant_idx" ON "ai_templates" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "ai_templates_domain_idx" ON "ai_templates" USING btree ("domain_id");--> statement-breakpoint
CREATE INDEX "ai_templates_status_idx" ON "ai_templates" USING btree ("status");--> statement-breakpoint
CREATE INDEX "ai_templates_type_idx" ON "ai_templates" USING btree ("type");--> statement-breakpoint
CREATE INDEX "ai_templates_parent_version_idx" ON "ai_templates" USING btree ("parent_version_id");--> statement-breakpoint
CREATE INDEX "ai_templates_latest_idx" ON "ai_templates" USING btree ("tenant_id","is_latest_version");--> statement-breakpoint
CREATE INDEX "template_deployments_template_idx" ON "template_deployments" USING btree ("template_id");--> statement-breakpoint
CREATE INDEX "template_deployments_tenant_idx" ON "template_deployments" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "template_deployments_target_idx" ON "template_deployments" USING btree ("target_id");--> statement-breakpoint
CREATE INDEX "template_deployments_active_idx" ON "template_deployments" USING btree ("tenant_id","scope","deployment_status");--> statement-breakpoint
CREATE INDEX "template_usage_analytics_template_idx" ON "template_usage_analytics" USING btree ("template_id");--> statement-breakpoint
CREATE INDEX "template_usage_analytics_date_idx" ON "template_usage_analytics" USING btree ("usage_date");--> statement-breakpoint
CREATE INDEX "template_usage_analytics_tenant_date_idx" ON "template_usage_analytics" USING btree ("tenant_id","usage_date");--> statement-breakpoint
CREATE INDEX "ai_usage_reports_tenant_idx" ON "ai_usage_reports" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "ai_usage_reports_provider_idx" ON "ai_usage_reports" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "ai_usage_reports_domain_idx" ON "ai_usage_reports" USING btree ("domain_id");--> statement-breakpoint
CREATE INDEX "ai_usage_reports_timestamp_idx" ON "ai_usage_reports" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "ai_usage_reports_connector_idx" ON "ai_usage_reports" USING btree ("connector_id");--> statement-breakpoint
CREATE INDEX "ai_usage_reports_tenant_timestamp_idx" ON "ai_usage_reports" USING btree ("tenant_id","timestamp");--> statement-breakpoint
CREATE INDEX "ai_usage_reports_tenant_provider_timestamp_idx" ON "ai_usage_reports" USING btree ("tenant_id","provider_id","timestamp");--> statement-breakpoint
CREATE INDEX "ai_usage_reports_tenant_domain_timestamp_idx" ON "ai_usage_reports" USING btree ("tenant_id","domain_id","timestamp");--> statement-breakpoint
CREATE INDEX "ai_usage_aggregation_daily_tenant_date_idx" ON "ai_usage_aggregation_daily" USING btree ("tenant_id","usage_date");--> statement-breakpoint
CREATE INDEX "ai_usage_aggregation_daily_provider_date_idx" ON "ai_usage_aggregation_daily" USING btree ("provider_id","usage_date");--> statement-breakpoint
CREATE INDEX "ai_usage_aggregation_daily_tenant_provider_date_idx" ON "ai_usage_aggregation_daily" USING btree ("tenant_id","provider_id","usage_date");--> statement-breakpoint
CREATE INDEX "ai_usage_aggregation_monthly_tenant_month_idx" ON "ai_usage_aggregation_monthly" USING btree ("tenant_id","year","month");--> statement-breakpoint
CREATE INDEX "ai_usage_aggregation_monthly_provider_month_idx" ON "ai_usage_aggregation_monthly" USING btree ("provider_id","year","month");--> statement-breakpoint
CREATE INDEX "budget_alerts_tenant_idx" ON "budget_alerts" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "budget_alerts_status_idx" ON "budget_alerts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "budget_alerts_type_idx" ON "budget_alerts" USING btree ("type");--> statement-breakpoint
CREATE INDEX "budget_alerts_time_window_idx" ON "budget_alerts" USING btree ("time_window");--> statement-breakpoint
CREATE INDEX "budget_alerts_active_idx" ON "budget_alerts" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "alert_trigger_history_alert_idx" ON "alert_trigger_history" USING btree ("alert_id");--> statement-breakpoint
CREATE INDEX "alert_trigger_history_tenant_idx" ON "alert_trigger_history" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "alert_trigger_history_triggered_at_idx" ON "alert_trigger_history" USING btree ("triggered_at");--> statement-breakpoint
CREATE INDEX "alert_trigger_history_tenant_alert_time_idx" ON "alert_trigger_history" USING btree ("tenant_id","alert_id","triggered_at");--> statement-breakpoint
CREATE INDEX "budget_period_summaries_tenant_idx" ON "budget_period_summaries" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "budget_period_summaries_period_type_idx" ON "budget_period_summaries" USING btree ("period_type");--> statement-breakpoint
CREATE INDEX "budget_period_summaries_period_start_idx" ON "budget_period_summaries" USING btree ("period_start");--> statement-breakpoint
CREATE INDEX "budget_period_summaries_tenant_period_idx" ON "budget_period_summaries" USING btree ("tenant_id","period_type","period_start");--> statement-breakpoint
CREATE INDEX "report_shares_token_idx" ON "report_shares" USING btree ("token");--> statement-breakpoint
CREATE INDEX "report_shares_report_id_idx" ON "report_shares" USING btree ("report_id");--> statement-breakpoint
CREATE INDEX "audit_trail_tenant_id_idx" ON "audit_trail" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "audit_trail_insight_id_idx" ON "audit_trail" USING btree ("insight_id");--> statement-breakpoint
CREATE INDEX "audit_trail_created_at_idx" ON "audit_trail" USING btree ("created_at");
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_agency_partner_id_agency_partners_id_fk" FOREIGN KEY ("agency_partner_id") REFERENCES "core"."agency_partners"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_parent_tenant_id_tenants_id_fk" FOREIGN KEY ("parent_tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."connector_tag_mappings" ADD CONSTRAINT "connector_tag_mappings_connector_id_data_connectors_id_fk" FOREIGN KEY ("connector_id") REFERENCES "core"."data_connectors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."connector_tag_mappings" ADD CONSTRAINT "connector_tag_mappings_connector_tag_id_connector_tags_id_fk" FOREIGN KEY ("connector_tag_id") REFERENCES "core"."connector_tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "i18n_strings" ADD CONSTRAINT "i18n_strings_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."insight_connectors" ADD CONSTRAINT "insight_connectors_insight_id_insights_id_fk" FOREIGN KEY ("insight_id") REFERENCES "core"."insights"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."insight_connectors" ADD CONSTRAINT "insight_connectors_connector_id_data_connectors_id_fk" FOREIGN KEY ("connector_id") REFERENCES "core"."data_connectors"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."insights" ADD CONSTRAINT "insights_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_metrics" ADD CONSTRAINT "marketing_metrics_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_credentials" ADD CONSTRAINT "platform_credentials_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provenance_records" ADD CONSTRAINT "provenance_records_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_templates" ADD CONSTRAINT "report_templates_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_feature_flags" ADD CONSTRAINT "tenant_feature_flags_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_feature_flags" ADD CONSTRAINT "tenant_feature_flags_flag_id_feature_flags_id_fk" FOREIGN KEY ("flag_id") REFERENCES "public"."feature_flags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."usage_tracking" ADD CONSTRAINT "usage_tracking_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_connectors" ADD CONSTRAINT "tenant_connectors_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "connector_sync_history" ADD CONSTRAINT "connector_sync_history_connector_id_tenant_connectors_id_fk" FOREIGN KEY ("connector_id") REFERENCES "public"."tenant_connectors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "connector_sync_history" ADD CONSTRAINT "connector_sync_history_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roles" ADD CONSTRAINT "roles_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_granted_by_users_id_fk" FOREIGN KEY ("granted_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_logs_tenant_id_created_at_idx" ON "audit_logs" USING btree ("tenant_id","created_at");--> statement-breakpoint
CREATE INDEX "connector_tag_mappings_tag_idx" ON "core"."connector_tag_mappings" USING btree ("connector_tag_id");--> statement-breakpoint
CREATE INDEX "feature_flags_flag_key_idx" ON "feature_flags" USING btree ("flag_key");--> statement-breakpoint
CREATE INDEX "i18n_strings_tenant_id_locale_idx" ON "i18n_strings" USING btree ("tenant_id","locale");--> statement-breakpoint
CREATE INDEX "insights_tenant_id_idx" ON "core"."insights" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "marketing_metrics_tenant_id_metric_date_idx" ON "marketing_metrics" USING btree ("tenant_id","metric_date");--> statement-breakpoint
CREATE INDEX "provenance_records_tenant_analysis_idx" ON "provenance_records" USING btree ("tenant_id","analysis_id");--> statement-breakpoint
CREATE INDEX "provenance_records_captured_at_idx" ON "provenance_records" USING btree ("captured_at");--> statement-breakpoint
CREATE INDEX "report_templates_tenant_id_name_idx" ON "report_templates" USING btree ("tenant_id","name");--> statement-breakpoint
CREATE INDEX "reports_tenant_id_created_at_idx" ON "reports" USING btree ("tenant_id","created_at");--> statement-breakpoint
CREATE INDEX "tenant_feature_flags_tenant_id_idx" ON "tenant_feature_flags" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "usage_tracking_tenant_id_period_idx" ON "core"."usage_tracking" USING btree ("tenant_id","period_start","period_end");--> statement-breakpoint
CREATE INDEX "tenant_connectors_tenant_idx" ON "tenant_connectors" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "tenant_connectors_platform_idx" ON "tenant_connectors" USING btree ("platform");--> statement-breakpoint
CREATE INDEX "tenant_connectors_status_idx" ON "tenant_connectors" USING btree ("status");--> statement-breakpoint
CREATE INDEX "tenant_connectors_domain_idx" ON "tenant_connectors" USING btree ("domain_id");--> statement-breakpoint
CREATE INDEX "sync_history_connector_idx" ON "connector_sync_history" USING btree ("connector_id");--> statement-breakpoint
CREATE INDEX "sync_history_tenant_idx" ON "connector_sync_history" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "sync_history_started_idx" ON "connector_sync_history" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "user_roles_user_id_idx" ON "user_roles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_roles_role_id_idx" ON "user_roles" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "role_permissions_role_id_idx" ON "role_permissions" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "role_permissions_permission_id_idx" ON "role_permissions" USING btree ("permission_id");--> statement-breakpoint
CREATE INDEX "roles_tenant_id_idx" ON "roles" USING btree ("tenant_id");
CREATE INDEX "tenants_type_idx" ON "tenants" USING btree ("type");
CREATE INDEX "tenants_status_idx" ON "tenants" USING btree ("status");
CREATE INDEX "tenants_agency_partner_id_idx" ON "tenants" USING btree ("agency_partner_id");
CREATE INDEX "tenants_parent_tenant_id_idx" ON "tenants" USING btree ("parent_tenant_id");

-- ============================================================
-- Row-Level Security (RLS)
-- ============================================================

-- Enable RLS on all tenant-scoped tables
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tenant_connectors" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "core"."insights" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "core"."insight_connectors" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "reports" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "report_templates" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "roles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_trail" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "report_shares" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "provenance_records" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "marketing_metrics" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "platform_credentials" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "i18n_strings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tenant_feature_flags" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "business_domains" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "domain_connector_assignments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "budget_alerts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "alert_trigger_history" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "budget_period_summaries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ai_providers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ai_provider_failover" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ai_provider_credentials" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ai_provider_usage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ai_provider_health" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ai_usage_reports" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ai_usage_aggregation_daily" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ai_usage_aggregation_monthly" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ai_templates" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "template_deployments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "template_usage_analytics" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "connector_sync_history" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "core"."usage_tracking" ENABLE ROW LEVEL SECURITY;

-- RLS policies for users table
CREATE POLICY tenant_isolation_users ON "users"
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY users_self_read ON "users"
  FOR SELECT
  USING (id = current_setting('app.current_user_id')::uuid);

-- RLS for tenant_connectors
CREATE POLICY tenant_isolation_connectors ON "tenant_connectors"
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- RLS for insights
CREATE POLICY tenant_isolation_insights ON "core"."insights"
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- RLS for reports
CREATE POLICY tenant_isolation_reports ON "reports"
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- RLS for report_templates
CREATE POLICY tenant_isolation_templates ON "report_templates"
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Agency partner access to client tenants
CREATE POLICY agency_client_access_insights ON "core"."insights"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "tenants" t
      WHERE t.id = "core"."insights".tenant_id
        AND t.parent_tenant_id = current_setting('app.current_tenant_id')::uuid
    )
  );

-- RBAC
CREATE POLICY tenant_isolation_roles ON "roles"
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Audit
CREATE POLICY tenant_isolation_audit_logs ON "audit_logs"
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY tenant_isolation_audit_trail ON "audit_trail"
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Report shares
CREATE POLICY tenant_isolation_report_shares ON "report_shares"
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Provenance & Metrics
CREATE POLICY tenant_isolation_provenance_records ON "provenance_records"
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY tenant_isolation_marketing_metrics ON "marketing_metrics"
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Platform credentials
CREATE POLICY tenant_isolation_platform_credentials ON "platform_credentials"
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- i18n & Feature Flags
CREATE POLICY tenant_isolation_i18n_strings ON "i18n_strings"
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY tenant_isolation_tenant_feature_flags ON "tenant_feature_flags"
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Business Domains
CREATE POLICY tenant_isolation_business_domains ON "business_domains"
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY tenant_isolation_domain_connector_assignments ON "domain_connector_assignments"
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Budget Alerts
CREATE POLICY tenant_isolation_budget_alerts ON "budget_alerts"
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY tenant_isolation_alert_trigger_history ON "alert_trigger_history"
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY tenant_isolation_budget_period_summaries ON "budget_period_summaries"
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- AI Providers
CREATE POLICY tenant_isolation_ai_providers ON "ai_providers"
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY tenant_isolation_ai_provider_failover ON "ai_provider_failover"
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY tenant_isolation_ai_provider_credentials ON "ai_provider_credentials"
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY tenant_isolation_ai_provider_usage ON "ai_provider_usage"
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY tenant_isolation_ai_provider_health ON "ai_provider_health"
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid OR tenant_id IS NULL);

-- AI Usage
CREATE POLICY tenant_isolation_ai_usage_reports ON "ai_usage_reports"
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY tenant_isolation_ai_usage_aggregation_daily ON "ai_usage_aggregation_daily"
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY tenant_isolation_ai_usage_aggregation_monthly ON "ai_usage_aggregation_monthly"
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- AI Templates
CREATE POLICY tenant_isolation_ai_templates ON "ai_templates"
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY tenant_isolation_template_deployments ON "template_deployments"
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY tenant_isolation_template_usage_analytics ON "template_usage_analytics"
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Connector Sync
CREATE POLICY tenant_isolation_connector_sync_history ON "connector_sync_history"
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Core schema
CREATE POLICY tenant_isolation_usage_tracking ON "core"."usage_tracking"
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Generated insights
ALTER TABLE "core"."generated_insights" ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_generated_insights ON "core"."generated_insights"
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY agency_client_access_generated_insights ON "core"."generated_insights"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "tenants" t
      WHERE t.id = "core"."generated_insights".tenant_id
        AND t.parent_tenant_id = current_setting('app.current_tenant_id')::uuid
    )
  );

-- RLS for insight_connectors
CREATE POLICY tenant_isolation_insight_connectors ON "core"."insight_connectors"
  USING (
    EXISTS (
      SELECT 1 FROM "core"."insights" i
      WHERE i.id = "core"."insight_connectors".insight_id
        AND i.tenant_id = current_setting('app.current_tenant_id')::uuid
    )
  );

-- Indexes for generated_insights
CREATE INDEX "generated_insights_tenant_id_created_at_idx" ON "core"."generated_insights" USING btree ("tenant_id","created_at");
CREATE INDEX "generated_insights_report_id_idx" ON "core"."generated_insights" USING btree ("report_id");
CREATE INDEX "generated_insights_analysis_id_idx" ON "core"."generated_insights" USING btree ("analysis_id");
CREATE INDEX "generated_insights_insight_type_idx" ON "core"."generated_insights" USING btree ("insight_type");

-- Standalone index on insight_connectors.insight_id
CREATE INDEX "insight_connectors_insight_id_idx" ON "core"."insight_connectors" USING btree ("insight_id");

-- Update trigger for insights.updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_insights_updated_at
   BEFORE UPDATE ON "core"."insights"
   FOR EACH ROW
   EXECUTE FUNCTION update_updated_at_column();
--> statement-breakpoint
CREATE TYPE "notification_type" AS ENUM ('email', 'webhook', 'slack');
CREATE TYPE "webhook_delivery_status" AS ENUM ('pending', 'success', 'failed', 'dead-letter');
CREATE TYPE "insight_template_schedule_frequency" AS ENUM ('daily', 'weekly', 'monthly', 'quarterly');
--> statement-breakpoint
CREATE TYPE "insight_template_delivery_format" AS ENUM ('pdf', 'excel', 'both');
--> statement-breakpoint
CREATE TABLE "insight_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"name_translations" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"description_translations" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"icon" varchar(32),
	"ai_template_id" uuid,
	"schedule" jsonb DEFAULT '{"frequency":"weekly","time":9}'::jsonb NOT NULL,
	"delivery" jsonb DEFAULT '{"format":"pdf","emailRecipients":[],"enableWebhook":false,"webhookUrl":null}'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "insight_template_domains" (
	"template_id" uuid NOT NULL,
	"domain_id" uuid NOT NULL,
	CONSTRAINT "insight_template_domains_pkey" PRIMARY KEY("template_id","domain_id")
);
--> statement-breakpoint
CREATE TABLE "insight_template_connectors" (
	"template_id" uuid NOT NULL,
	"connector_id" varchar(64) NOT NULL,
	"metrics" jsonb DEFAULT '[]'::jsonb NOT NULL,
	CONSTRAINT "insight_template_connectors_pkey" PRIMARY KEY("template_id","connector_id")
);
--> statement-breakpoint
ALTER TABLE "insight_templates" ADD CONSTRAINT "insight_templates_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade;
--> statement-breakpoint
ALTER TABLE "insight_templates" ADD CONSTRAINT "insight_templates_ai_template_id_ai_templates_id_fk" FOREIGN KEY ("ai_template_id") REFERENCES "public"."ai_templates"("id") ON DELETE set null;
--> statement-breakpoint
ALTER TABLE "insight_template_domains" ADD CONSTRAINT "insight_template_domains_template_id_insight_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."insight_templates"("id") ON DELETE cascade;
--> statement-breakpoint
ALTER TABLE "insight_template_domains" ADD CONSTRAINT "insight_template_domains_domain_id_business_domains_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."business_domains"("id") ON DELETE cascade;
--> statement-breakpoint
ALTER TABLE "insight_template_connectors" ADD CONSTRAINT "insight_template_connectors_template_id_insight_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."insight_templates"("id") ON DELETE cascade;
--> statement-breakpoint
ALTER TABLE "insight_template_connectors" ADD CONSTRAINT "insight_template_connectors_connector_id_data_connectors_id_fk" FOREIGN KEY ("connector_id") REFERENCES "core"."data_connectors"("id") ON DELETE cascade;
--> statement-breakpoint
CREATE INDEX "insight_templates_tenant_idx" ON "insight_templates" USING btree ("tenant_id");
--> statement-breakpoint
CREATE INDEX "insight_templates_active_idx" ON "insight_templates" USING btree ("is_active");
--> statement-breakpoint
CREATE INDEX "insight_templates_ai_template_idx" ON "insight_templates" USING btree ("ai_template_id");
--> statement-breakpoint
CREATE INDEX "insight_template_domains_domain_idx" ON "insight_template_domains" USING btree ("domain_id");
--> statement-breakpoint
CREATE INDEX "insight_template_connectors_connector_idx" ON "insight_template_connectors" USING btree ("connector_id");
--> statement-breakpoint
CREATE TYPE "schedule_entity_type" AS ENUM ('report', 'insight');
CREATE TYPE "schedule_execution_status" AS ENUM ('pending', 'running', 'completed', 'failed', 'skipped');
CREATE TABLE "schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"entity_type" schedule_entity_type NOT NULL,
	"entity_id" uuid NOT NULL,
	"cron_expression" varchar(128) NOT NULL,
	"timezone" varchar(64) DEFAULT 'UTC' NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"last_run_at" timestamp with time zone,
	"next_run_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "schedule_executions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"schedule_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"entity_type" schedule_entity_type NOT NULL,
	"entity_id" uuid NOT NULL,
	"scheduled_at" timestamp with time zone NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"status" schedule_execution_status DEFAULT 'pending' NOT NULL,
	"error_message" varchar(1024),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade;
--> statement-breakpoint
ALTER TABLE "schedule_executions" ADD CONSTRAINT "schedule_executions_schedule_id_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."schedules"("id") ON DELETE cascade;
--> statement-breakpoint
ALTER TABLE "schedule_executions" ADD CONSTRAINT "schedule_executions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade;
--> statement-breakpoint
CREATE INDEX "schedules_tenant_entity_type_entity_idx" ON "schedules" USING btree ("tenant_id","entity_type","entity_id");
--> statement-breakpoint
CREATE INDEX "schedules_tenant_enabled_cron_idx" ON "schedules" USING btree ("tenant_id","enabled","cron_expression");
--> statement-breakpoint
CREATE INDEX "schedules_tenant_next_run_idx" ON "schedules" USING btree ("tenant_id","next_run_at");
--> statement-breakpoint
CREATE INDEX "schedules_tenant_entity_type_idx" ON "schedules" USING btree ("tenant_id","entity_type");
--> statement-breakpoint
CREATE INDEX "schedule_executions_schedule_idx" ON "schedule_executions" USING btree ("schedule_id");
--> statement-breakpoint
CREATE INDEX "schedule_executions_tenant_schedule_idx" ON "schedule_executions" USING btree ("tenant_id","schedule_id");
--> statement-breakpoint
CREATE INDEX "schedule_executions_tenant_entity_type_idx" ON "schedule_executions" USING btree ("tenant_id","entity_type");
--> statement-breakpoint
ALTER TABLE "schedules" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "schedule_executions" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "schedules_tenant_isolation_select" ON "schedules" FOR SELECT USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
CREATE POLICY "schedules_tenant_isolation_insert" ON "schedules" FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);
CREATE POLICY "schedules_tenant_isolation_update" ON "schedules" FOR UPDATE USING (tenant_id = current_setting('app.current_tenant_id')::uuid) WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);
CREATE POLICY "schedules_tenant_isolation_delete" ON "schedules" FOR DELETE USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY "schedule_executions_tenant_isolation_select" ON "schedule_executions" FOR SELECT USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
CREATE POLICY "schedule_executions_tenant_isolation_insert" ON "schedule_executions" FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);
CREATE POLICY "schedule_executions_tenant_isolation_update" ON "schedule_executions" FOR UPDATE USING (tenant_id = current_setting('app.current_tenant_id')::uuid) WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);
CREATE POLICY "schedule_executions_tenant_isolation_delete" ON "schedule_executions" FOR DELETE USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
--> statement-breakpoint
CREATE TABLE "webhook_deliveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"insight_id" uuid,
	"tenant_id" uuid NOT NULL,
	"report_id" uuid,
	"url" text NOT NULL,
	"status" webhook_delivery_status DEFAULT 'pending' NOT NULL,
	"response_code" integer,
	"response_body" text,
	"attempts" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "webhook_deliveries" ADD CONSTRAINT "webhook_deliveries_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade;
--> statement-breakpoint
ALTER TABLE "webhook_deliveries" ADD CONSTRAINT "webhook_deliveries_insight_id_insights_id_fk" FOREIGN KEY ("insight_id") REFERENCES "core"."insights"("id") ON DELETE set null;
--> statement-breakpoint
ALTER TABLE "webhook_deliveries" ADD CONSTRAINT "webhook_deliveries_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE set null;
--> statement-breakpoint
CREATE INDEX "webhook_deliveries_tenant_id_idx" ON "webhook_deliveries" USING btree ("tenant_id");
--> statement-breakpoint
CREATE INDEX "webhook_deliveries_insight_id_idx" ON "webhook_deliveries" USING btree ("insight_id");
--> statement-breakpoint
CREATE INDEX "webhook_deliveries_report_id_idx" ON "webhook_deliveries" USING btree ("report_id");
--> statement-breakpoint
ALTER TABLE "webhook_deliveries" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_webhook_deliveries ON "webhook_deliveries" USING (tenant_id = current_setting('app.current_tenant_id')::uuid);