ALTER TABLE "warehouse"."warehouse_storages" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "warehouse"."warehouse_storages" CASCADE;--> statement-breakpoint
ALTER TABLE "warehouse"."storages" DROP CONSTRAINT "storages_warehouse_id_warehouses_id_fk";
--> statement-breakpoint
ALTER TABLE "warehouse"."storages" ADD COLUMN "warehouse_area_id" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "warehouse"."storages" ADD CONSTRAINT "storages_warehouse_area_id_warehouse_areas_id_fk" FOREIGN KEY ("warehouse_area_id") REFERENCES "warehouse"."warehouse_areas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."storages" DROP COLUMN "warehouse_id";