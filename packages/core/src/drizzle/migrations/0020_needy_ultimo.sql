CREATE TABLE "warehouse"."device_types" (
	"name" text NOT NULL,
	"code" varchar NOT NULL,
	"description" text,
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "warehouse"."devices" DROP CONSTRAINT "devices_facility_id_warehouse_facilities_id_fk";
--> statement-breakpoint
ALTER TABLE "warehouse"."devices" ADD COLUMN "type_id" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "warehouse"."devices" ADD CONSTRAINT "devices_type_id_device_types_id_fk" FOREIGN KEY ("type_id") REFERENCES "warehouse"."device_types"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."devices" DROP COLUMN "type";--> statement-breakpoint
ALTER TABLE "warehouse"."devices" DROP COLUMN "facility_id";