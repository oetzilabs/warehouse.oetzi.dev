CREATE TABLE "warehouse"."certifications" (
	"name" text NOT NULL,
	"description" text,
	"issuer" text NOT NULL,
	"validity_period" text,
	"certification_number" text,
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "warehouse"."products_to_certifications" (
	"product_id" text NOT NULL,
	"certification_id" text NOT NULL,
	CONSTRAINT "products_to_certifications_product_id_certification_id_pk" PRIMARY KEY("product_id","certification_id")
);
--> statement-breakpoint
ALTER TABLE "warehouse"."products_to_certifications" ADD CONSTRAINT "products_to_certifications_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "warehouse"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."products_to_certifications" ADD CONSTRAINT "products_to_certifications_certification_id_certifications_id_fk" FOREIGN KEY ("certification_id") REFERENCES "warehouse"."certifications"("id") ON DELETE no action ON UPDATE no action;