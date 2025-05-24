CREATE TABLE "warehouse"."organizations_products" (
	"organization_id" varchar NOT NULL,
	"product_id" varchar NOT NULL,
	CONSTRAINT "organizations_products_organization_id_product_id_pk" PRIMARY KEY("organization_id","product_id")
);
--> statement-breakpoint
ALTER TABLE "warehouse"."organizations_products" ADD CONSTRAINT "organizations_products_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "warehouse"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."organizations_products" ADD CONSTRAINT "organizations_products_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "warehouse"."products"("id") ON DELETE cascade ON UPDATE no action;