CREATE TABLE "warehouse"."warehouse_storages" (
	"warehouse_id" varchar NOT NULL,
	"storage_id" varchar NOT NULL,
	CONSTRAINT "warehouse_storages_warehouse_id_storage_id_pk" PRIMARY KEY("warehouse_id","storage_id")
);
--> statement-breakpoint
ALTER TABLE "warehouse"."warehouse_storages" ADD CONSTRAINT "warehouse_storages_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "warehouse"."warehouses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."warehouse_storages" ADD CONSTRAINT "warehouse_storages_storage_id_storages_id_fk" FOREIGN KEY ("storage_id") REFERENCES "warehouse"."storages"("id") ON DELETE cascade ON UPDATE no action;