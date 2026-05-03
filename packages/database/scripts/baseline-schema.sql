CREATE TYPE "agency_partner_tier" AS ENUM ('registered', 'certified', 'elite');
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
	"schedule" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"delivery" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"ai_config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
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
	"domain" varchar(255),
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
CREATE INDEX "tenant_connectors_domain_idx" ON "tenant_connectors" USING btree ("domain");--> statement-breakpoint
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