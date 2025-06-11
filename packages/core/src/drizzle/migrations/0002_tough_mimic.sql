ALTER TABLE "warehouse"."products" ALTER COLUMN "barcode" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "warehouse"."sales" ALTER COLUMN "barcode" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "warehouse"."customer_orders" ALTER COLUMN "barcode" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "warehouse"."products" ADD CONSTRAINT "products_barcode_unique" UNIQUE("barcode");--> statement-breakpoint
ALTER TABLE "warehouse"."sales" ADD CONSTRAINT "sales_barcode_unique" UNIQUE("barcode");--> statement-breakpoint
ALTER TABLE "warehouse"."customer_orders" ADD CONSTRAINT "customer_orders_barcode_unique" UNIQUE("barcode");--> statement-breakpoint
ALTER TABLE "warehouse"."supplier_purchases" ADD CONSTRAINT "supplier_purchases_barcode_unique" UNIQUE("barcode");