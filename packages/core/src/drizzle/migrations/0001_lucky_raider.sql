ALTER TABLE "warehouse"."orders" DROP CONSTRAINT "orders_customer_id_customers_id_fk";
--> statement-breakpoint
ALTER TABLE "warehouse"."orders" DROP CONSTRAINT "orders_sale_id_sales_id_fk";
--> statement-breakpoint
ALTER TABLE "warehouse"."orders" DROP COLUMN "customer_id";--> statement-breakpoint
ALTER TABLE "warehouse"."orders" DROP COLUMN "sale_id";