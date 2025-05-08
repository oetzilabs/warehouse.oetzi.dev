CREATE TABLE "warehouse"."warehouse_areas" (
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
ALTER TABLE "warehouse"."warehouse_areas" ADD CONSTRAINT "warehouse_areas_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "warehouse"."warehouses"("id") ON DELETE cascade ON UPDATE no action;