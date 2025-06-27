ALTER TYPE "warehouse"."customer_order_status" ADD VALUE 'deleted';--> statement-breakpoint
ALTER TABLE "warehouse"."supplier_products" DROP COLUMN "supplier_price";