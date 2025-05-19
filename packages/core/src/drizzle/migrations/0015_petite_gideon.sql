CREATE TABLE "warehouse"."product_labels" (
	"name" text NOT NULL,
	"description" text,
	"color" text DEFAULT '#000000',
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "warehouse"."products_to_labels" (
	"product_id" text NOT NULL,
	"label_id" text NOT NULL,
	CONSTRAINT "products_to_labels_product_id_label_id_pk" PRIMARY KEY("product_id","label_id")
);
--> statement-breakpoint
ALTER TABLE "warehouse"."products_to_labels" ADD CONSTRAINT "products_to_labels_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "warehouse"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."products_to_labels" ADD CONSTRAINT "products_to_labels_label_id_product_labels_id_fk" FOREIGN KEY ("label_id") REFERENCES "warehouse"."product_labels"("id") ON DELETE no action ON UPDATE no action;