CREATE TABLE "warehouse"."storage_products" (
	"product_id" text NOT NULL,
	"storage_id" text NOT NULL,
	CONSTRAINT "storage_products_product_id_storage_id_pk" PRIMARY KEY("product_id","storage_id")
);
--> statement-breakpoint
ALTER TABLE "warehouse"."storage_products" ADD CONSTRAINT "storage_products_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "warehouse"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."storage_products" ADD CONSTRAINT "storage_products_storage_id_storages_id_fk" FOREIGN KEY ("storage_id") REFERENCES "warehouse"."storages"("id") ON DELETE no action ON UPDATE no action;