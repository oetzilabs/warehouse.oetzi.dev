CREATE TABLE "warehouse"."storage_space_to_products" (
	"product_id" varchar NOT NULL,
	"storage_space_id" varchar NOT NULL,
	CONSTRAINT "storage_space_to_products_product_id_storage_space_id_pk" PRIMARY KEY("product_id","storage_space_id")
);
--> statement-breakpoint
DROP TABLE "warehouse"."storage_products" CASCADE;--> statement-breakpoint
ALTER TABLE "warehouse"."storage_space_to_products" ADD CONSTRAINT "storage_space_to_products_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "warehouse"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."storage_space_to_products" ADD CONSTRAINT "storage_space_to_products_storage_space_id_storage_spaces_id_fk" FOREIGN KEY ("storage_space_id") REFERENCES "warehouse"."storage_spaces"("id") ON DELETE no action ON UPDATE no action;