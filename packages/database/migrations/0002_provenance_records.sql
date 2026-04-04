CREATE TABLE "provenance_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"analysis_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"captured_at" timestamp with time zone DEFAULT now() NOT NULL,
	"record" jsonb NOT NULL
);
--> statement-breakpoint
ALTER TABLE "provenance_records" ADD CONSTRAINT "provenance_records_tenant_id_companies_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "provenance_records_tenant_analysis_idx" ON "provenance_records" USING btree ("tenant_id","analysis_id");--> statement-breakpoint
CREATE INDEX "provenance_records_captured_at_idx" ON "provenance_records" USING btree ("captured_at");