CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"actor_user_id" uuid,
	"action" varchar(128) NOT NULL,
	"resource_type" varchar(128) NOT NULL,
	"resource_id" varchar(256) NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(256) NOT NULL,
	"slug" varchar(128) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "companies_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "i18n_strings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"locale" varchar(16) NOT NULL,
	"message_key" varchar(512) NOT NULL,
	"value" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "i18n_strings_company_locale_key_unique" UNIQUE("company_id","locale","message_key")
);
--> statement-breakpoint
CREATE TABLE "marketing_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"platform" varchar(64) NOT NULL,
	"metric_date" date NOT NULL,
	"payload" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_credentials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"platform" varchar(64) NOT NULL,
	"encrypted_payload" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "platform_credentials_company_platform_unique" UNIQUE("company_id","platform")
);
--> statement-breakpoint
CREATE TABLE "report_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"name" varchar(256) NOT NULL,
	"definition" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"title" varchar(512) NOT NULL,
	"status" varchar(64) DEFAULT 'draft' NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"email" varchar(320) NOT NULL,
	"display_name" varchar(256),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_company_id_email_unique" UNIQUE("company_id","email")
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "i18n_strings" ADD CONSTRAINT "i18n_strings_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_metrics" ADD CONSTRAINT "marketing_metrics_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_credentials" ADD CONSTRAINT "platform_credentials_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_templates" ADD CONSTRAINT "report_templates_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_logs_company_id_created_at_idx" ON "audit_logs" USING btree ("company_id","created_at");--> statement-breakpoint
CREATE INDEX "i18n_strings_company_id_locale_idx" ON "i18n_strings" USING btree ("company_id","locale");--> statement-breakpoint
CREATE INDEX "marketing_metrics_company_id_metric_date_idx" ON "marketing_metrics" USING btree ("company_id","metric_date");--> statement-breakpoint
CREATE INDEX "report_templates_company_id_name_idx" ON "report_templates" USING btree ("company_id","name");--> statement-breakpoint
CREATE INDEX "reports_company_id_created_at_idx" ON "reports" USING btree ("company_id","created_at");--> statement-breakpoint
ALTER TABLE "companies" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "companies" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "companies_tenant_select" ON "companies" FOR SELECT USING ("id" = current_setting('app.current_tenant_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "companies_tenant_insert" ON "companies" FOR INSERT WITH CHECK ("id" = current_setting('app.current_tenant_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "companies_tenant_update" ON "companies" FOR UPDATE USING ("id" = current_setting('app.current_tenant_id', true)::uuid) WITH CHECK ("id" = current_setting('app.current_tenant_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "companies_tenant_delete" ON "companies" FOR DELETE USING ("id" = current_setting('app.current_tenant_id', true)::uuid);--> statement-breakpoint
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "users" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "users_tenant_select" ON "users" FOR SELECT USING ("company_id" = current_setting('app.current_tenant_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "users_tenant_insert" ON "users" FOR INSERT WITH CHECK ("company_id" = current_setting('app.current_tenant_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "users_tenant_update" ON "users" FOR UPDATE USING ("company_id" = current_setting('app.current_tenant_id', true)::uuid) WITH CHECK ("company_id" = current_setting('app.current_tenant_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "users_tenant_delete" ON "users" FOR DELETE USING ("company_id" = current_setting('app.current_tenant_id', true)::uuid);--> statement-breakpoint
ALTER TABLE "platform_credentials" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "platform_credentials" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "platform_credentials_tenant_select" ON "platform_credentials" FOR SELECT USING ("company_id" = current_setting('app.current_tenant_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "platform_credentials_tenant_insert" ON "platform_credentials" FOR INSERT WITH CHECK ("company_id" = current_setting('app.current_tenant_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "platform_credentials_tenant_update" ON "platform_credentials" FOR UPDATE USING ("company_id" = current_setting('app.current_tenant_id', true)::uuid) WITH CHECK ("company_id" = current_setting('app.current_tenant_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "platform_credentials_tenant_delete" ON "platform_credentials" FOR DELETE USING ("company_id" = current_setting('app.current_tenant_id', true)::uuid);--> statement-breakpoint
ALTER TABLE "marketing_metrics" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "marketing_metrics" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "marketing_metrics_tenant_select" ON "marketing_metrics" FOR SELECT USING ("company_id" = current_setting('app.current_tenant_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "marketing_metrics_tenant_insert" ON "marketing_metrics" FOR INSERT WITH CHECK ("company_id" = current_setting('app.current_tenant_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "marketing_metrics_tenant_update" ON "marketing_metrics" FOR UPDATE USING ("company_id" = current_setting('app.current_tenant_id', true)::uuid) WITH CHECK ("company_id" = current_setting('app.current_tenant_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "marketing_metrics_tenant_delete" ON "marketing_metrics" FOR DELETE USING ("company_id" = current_setting('app.current_tenant_id', true)::uuid);--> statement-breakpoint
ALTER TABLE "reports" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "reports" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "reports_tenant_select" ON "reports" FOR SELECT USING ("company_id" = current_setting('app.current_tenant_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "reports_tenant_insert" ON "reports" FOR INSERT WITH CHECK ("company_id" = current_setting('app.current_tenant_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "reports_tenant_update" ON "reports" FOR UPDATE USING ("company_id" = current_setting('app.current_tenant_id', true)::uuid) WITH CHECK ("company_id" = current_setting('app.current_tenant_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "reports_tenant_delete" ON "reports" FOR DELETE USING ("company_id" = current_setting('app.current_tenant_id', true)::uuid);--> statement-breakpoint
ALTER TABLE "report_templates" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "report_templates" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "report_templates_tenant_select" ON "report_templates" FOR SELECT USING ("company_id" = current_setting('app.current_tenant_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "report_templates_tenant_insert" ON "report_templates" FOR INSERT WITH CHECK ("company_id" = current_setting('app.current_tenant_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "report_templates_tenant_update" ON "report_templates" FOR UPDATE USING ("company_id" = current_setting('app.current_tenant_id', true)::uuid) WITH CHECK ("company_id" = current_setting('app.current_tenant_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "report_templates_tenant_delete" ON "report_templates" FOR DELETE USING ("company_id" = current_setting('app.current_tenant_id', true)::uuid);--> statement-breakpoint
ALTER TABLE "i18n_strings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "i18n_strings" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "i18n_strings_tenant_select" ON "i18n_strings" FOR SELECT USING ("company_id" = current_setting('app.current_tenant_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "i18n_strings_tenant_insert" ON "i18n_strings" FOR INSERT WITH CHECK ("company_id" = current_setting('app.current_tenant_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "i18n_strings_tenant_update" ON "i18n_strings" FOR UPDATE USING ("company_id" = current_setting('app.current_tenant_id', true)::uuid) WITH CHECK ("company_id" = current_setting('app.current_tenant_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "i18n_strings_tenant_delete" ON "i18n_strings" FOR DELETE USING ("company_id" = current_setting('app.current_tenant_id', true)::uuid);--> statement-breakpoint
ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "audit_logs" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "audit_logs_tenant_select" ON "audit_logs" FOR SELECT USING ("company_id" = current_setting('app.current_tenant_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "audit_logs_tenant_insert" ON "audit_logs" FOR INSERT WITH CHECK ("company_id" = current_setting('app.current_tenant_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "audit_logs_tenant_update" ON "audit_logs" FOR UPDATE USING ("company_id" = current_setting('app.current_tenant_id', true)::uuid) WITH CHECK ("company_id" = current_setting('app.current_tenant_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "audit_logs_tenant_delete" ON "audit_logs" FOR DELETE USING ("company_id" = current_setting('app.current_tenant_id', true)::uuid);