CREATE TYPE "warehouse"."device_status" AS ENUM('online', 'offline', 'unresponsive', 'unknown', 'shutting-down', 'rebooting', 'maintenance', 'error');--> statement-breakpoint
CREATE TABLE "warehouse"."devices" (
	"name" text NOT NULL,
	"description" text,
	"status" "warehouse"."device_status" DEFAULT 'unknown' NOT NULL,
	"facility_id" varchar,
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "warehouse"."devices" ADD CONSTRAINT "devices_facility_id_warehouse_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "warehouse"."warehouse_facilities"("id") ON DELETE set null ON UPDATE no action;