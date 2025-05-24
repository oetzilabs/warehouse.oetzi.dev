ALTER TABLE "warehouse"."organization_suppliers" RENAME TO "org_suppliers";--> statement-breakpoint
ALTER TABLE "warehouse"."org_suppliers" DROP CONSTRAINT "organization_suppliers_organization_id_organizations_id_fk";
--> statement-breakpoint
ALTER TABLE "warehouse"."org_suppliers" DROP CONSTRAINT "organization_suppliers_supplier_id_suppliers_id_fk";
--> statement-breakpoint
ALTER TABLE "warehouse"."org_suppliers" DROP CONSTRAINT "organization_suppliers_organization_id_supplier_id_pk";--> statement-breakpoint
ALTER TABLE "warehouse"."org_suppliers" ADD CONSTRAINT "org_suppliers_organization_id_supplier_id_pk" PRIMARY KEY("organization_id","supplier_id");--> statement-breakpoint
ALTER TABLE "warehouse"."org_suppliers" ADD CONSTRAINT "org_suppliers_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "warehouse"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."org_suppliers" ADD CONSTRAINT "org_suppliers_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "warehouse"."suppliers"("id") ON DELETE cascade ON UPDATE no action;