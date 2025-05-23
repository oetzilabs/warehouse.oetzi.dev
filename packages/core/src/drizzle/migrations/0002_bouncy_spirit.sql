CREATE TABLE "warehouse"."organization_suppliers" (
	"organization_id" varchar NOT NULL,
	"supplier_id" varchar NOT NULL,
	CONSTRAINT "organization_suppliers_organization_id_supplier_id_pk" PRIMARY KEY("organization_id","supplier_id")
);
--> statement-breakpoint
CREATE TABLE "warehouse"."organization_customers" (
	"organization_id" varchar NOT NULL,
	"customer_id" varchar NOT NULL,
	CONSTRAINT "organization_customers_organization_id_customer_id_pk" PRIMARY KEY("organization_id","customer_id")
);
--> statement-breakpoint
DROP TABLE "warehouse"."warehouse_suppliers" CASCADE;--> statement-breakpoint
ALTER TABLE "warehouse"."organization_suppliers" ADD CONSTRAINT "organization_suppliers_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "warehouse"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."organization_suppliers" ADD CONSTRAINT "organization_suppliers_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "warehouse"."suppliers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."organization_customers" ADD CONSTRAINT "organization_customers_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "warehouse"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."organization_customers" ADD CONSTRAINT "organization_customers_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "warehouse"."customers"("id") ON DELETE cascade ON UPDATE no action;