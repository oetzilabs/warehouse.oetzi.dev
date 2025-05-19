CREATE TABLE "warehouse"."warehouse_suppliers" (
	"warehouse_id" varchar NOT NULL,
	"supplier_id" varchar NOT NULL,
	CONSTRAINT "warehouse_suppliers_warehouse_id_supplier_id_pk" PRIMARY KEY("warehouse_id","supplier_id")
);
--> statement-breakpoint
ALTER TABLE "warehouse"."warehouse_suppliers" ADD CONSTRAINT "warehouse_suppliers_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "warehouse"."warehouses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."warehouse_suppliers" ADD CONSTRAINT "warehouse_suppliers_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "warehouse"."suppliers"("id") ON DELETE cascade ON UPDATE no action;