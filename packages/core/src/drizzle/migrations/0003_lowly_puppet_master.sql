CREATE TABLE "warehouse"."orders" (
	"title" text NOT NULL,
	"description" text,
	"metadata" json,
	"status" text DEFAULT 'pending' NOT NULL,
	"made_by_user_id" varchar NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "warehouse"."warehouse_orders" (
	"warehouse_id" varchar NOT NULL,
	"order_id" varchar NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "warehouse"."orders" ADD CONSTRAINT "orders_made_by_user_id_users_id_fk" FOREIGN KEY ("made_by_user_id") REFERENCES "warehouse"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."warehouse_orders" ADD CONSTRAINT "warehouse_orders_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "warehouse"."warehouses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."warehouse_orders" ADD CONSTRAINT "warehouse_orders_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "warehouse"."orders"("id") ON DELETE cascade ON UPDATE no action;