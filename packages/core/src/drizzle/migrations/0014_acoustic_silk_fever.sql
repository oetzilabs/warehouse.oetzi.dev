CREATE TABLE "warehouse"."users_warehouses" (
	"user_id" varchar NOT NULL,
	"warehouse_id" varchar NOT NULL,
	CONSTRAINT "users_warehouses_user_id_warehouse_id_pk" PRIMARY KEY("user_id","warehouse_id")
);
--> statement-breakpoint
ALTER TABLE "warehouse"."users_warehouses" ADD CONSTRAINT "users_warehouses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "warehouse"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."users_warehouses" ADD CONSTRAINT "users_warehouses_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "warehouse"."warehouses"("id") ON DELETE cascade ON UPDATE no action;