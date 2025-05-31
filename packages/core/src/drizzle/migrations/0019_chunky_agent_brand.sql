CREATE TABLE "warehouse"."images" (
	"url" text NOT NULL,
	"alt" text,
	"title" text,
	"description" text,
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "warehouse"."product_to_images" (
	"product_id" varchar NOT NULL,
	"image_id" text NOT NULL,
	CONSTRAINT "product_to_images_product_id_image_id_pk" PRIMARY KEY("product_id","image_id")
);
--> statement-breakpoint
ALTER TABLE "warehouse"."product_to_images" ADD CONSTRAINT "product_to_images_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "warehouse"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."product_to_images" ADD CONSTRAINT "product_to_images_image_id_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "warehouse"."images"("id") ON DELETE no action ON UPDATE no action;