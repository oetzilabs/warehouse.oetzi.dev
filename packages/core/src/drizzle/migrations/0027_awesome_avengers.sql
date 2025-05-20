CREATE TABLE "warehouse"."products_to_storage_conditions" (
	"product_id" varchar NOT NULL,
	"condition_id" varchar NOT NULL,
	CONSTRAINT "products_to_storage_conditions_product_id_condition_id_pk" PRIMARY KEY("product_id","condition_id")
);
--> statement-breakpoint
CREATE TABLE "warehouse"."storage_conditions" (
	"name" text NOT NULL,
	"description" text,
	"temperature_min" numeric(5, 2),
	"temperature_max" numeric(5, 2),
	"humidity_min" numeric(5, 2),
	"humidity_max" numeric(5, 2),
	"light_level_min" numeric(5, 2),
	"light_level_max" numeric(5, 2),
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "warehouse"."products_to_storage_conditions" ADD CONSTRAINT "products_to_storage_conditions_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "warehouse"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."products_to_storage_conditions" ADD CONSTRAINT "products_to_storage_conditions_condition_id_storage_conditions_id_fk" FOREIGN KEY ("condition_id") REFERENCES "warehouse"."storage_conditions"("id") ON DELETE cascade ON UPDATE no action;