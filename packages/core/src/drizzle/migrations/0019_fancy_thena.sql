ALTER TABLE "warehouse"."products" DROP CONSTRAINT "products_supplier_id_suppliers_id_fk";
--> statement-breakpoint
ALTER TABLE "warehouse"."products" DROP COLUMN "category";--> statement-breakpoint
ALTER TABLE "warehouse"."products" DROP COLUMN "supplier_id";--> statement-breakpoint
ALTER TABLE "warehouse"."products" DROP COLUMN "manufacturer_id";