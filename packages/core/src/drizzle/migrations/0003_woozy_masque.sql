ALTER TABLE "warehouse"."organization_customers" RENAME TO "org_customers";--> statement-breakpoint
ALTER TABLE "warehouse"."org_customers" DROP CONSTRAINT "organization_customers_organization_id_organizations_id_fk";
--> statement-breakpoint
ALTER TABLE "warehouse"."org_customers" DROP CONSTRAINT "organization_customers_customer_id_customers_id_fk";
--> statement-breakpoint
ALTER TABLE "warehouse"."org_customers" DROP CONSTRAINT "organization_customers_organization_id_customer_id_pk";--> statement-breakpoint
ALTER TABLE "warehouse"."org_customers" ADD CONSTRAINT "org_customers_organization_id_customer_id_pk" PRIMARY KEY("organization_id","customer_id");--> statement-breakpoint
ALTER TABLE "warehouse"."org_customers" ADD CONSTRAINT "org_customers_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "warehouse"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."org_customers" ADD CONSTRAINT "org_customers_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "warehouse"."customers"("id") ON DELETE cascade ON UPDATE no action;