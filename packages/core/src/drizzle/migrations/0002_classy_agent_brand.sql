CREATE TYPE "warehouse"."supplier_schedule_status" AS ENUM('scheduled', 'preparing', 'ready', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "warehouse"."supplier_schedule_type" AS ENUM('delivery', 'pickup');--> statement-breakpoint
CREATE TABLE "warehouse"."supplier_schedules" (
	"supplier_id" varchar NOT NULL,
	"schedule_id" varchar NOT NULL,
	"order_id" varchar,
	"type" "warehouse"."supplier_schedule_type" NOT NULL
);
--> statement-breakpoint
ALTER TABLE "warehouse"."supplier_schedules" ADD CONSTRAINT "supplier_schedules_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "warehouse"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."supplier_schedules" ADD CONSTRAINT "supplier_schedules_schedule_id_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "warehouse"."schedules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."supplier_schedules" ADD CONSTRAINT "supplier_schedules_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "warehouse"."orders"("id") ON DELETE no action ON UPDATE no action;