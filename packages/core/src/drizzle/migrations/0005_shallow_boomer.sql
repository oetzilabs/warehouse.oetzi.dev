CREATE TABLE "warehouse"."user_orders" (
	"user_id" varchar NOT NULL,
	"order_id" varchar NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "warehouse"."orders" DROP CONSTRAINT "orders_made_by_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "warehouse"."user_orders" ADD CONSTRAINT "user_orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "warehouse"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."user_orders" ADD CONSTRAINT "user_orders_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "warehouse"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."orders" DROP COLUMN "made_by_user_id";