CREATE TABLE "warehouse"."warehouse_facilities" (
	"name" text NOT NULL,
	"description" text,
	"bounding_box" json,
	"warehouse_id" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "warehouse"."warehouse_areas" DROP CONSTRAINT "warehouse_areas_warehouse_id_warehouses_id_fk";
--> statement-breakpoint
ALTER TABLE "warehouse"."warehouse_areas" ADD COLUMN "warehouse_facility_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "warehouse"."storages" ADD COLUMN "bounding_box" json NOT NULL;--> statement-breakpoint
ALTER TABLE "warehouse"."warehouse_facilities" ADD CONSTRAINT "warehouse_facilities_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "warehouse"."warehouses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."warehouse_areas" ADD CONSTRAINT "warehouse_areas_warehouse_facility_id_warehouse_facilities_id_fk" FOREIGN KEY ("warehouse_facility_id") REFERENCES "warehouse"."warehouse_facilities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."warehouse_areas" DROP COLUMN "warehouse_id";--> statement-breakpoint
ALTER TABLE "warehouse"."storages" DROP COLUMN "location";