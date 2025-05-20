CREATE TYPE "warehouse"."brand_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TABLE "warehouse"."brands" (
	"name" text NOT NULL,
	"code" text NOT NULL,
	"description" text,
	"website" text,
	"status" "warehouse"."brand_status" DEFAULT 'active' NOT NULL,
	"logo_url" text,
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "warehouse"."products" ADD COLUMN "brand_id" text;--> statement-breakpoint
ALTER TABLE "warehouse"."products" ADD CONSTRAINT "products_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "warehouse"."brands"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."products" DROP COLUMN "is_hazardous";--> statement-breakpoint
ALTER TABLE "warehouse"."products" DROP COLUMN "requires_refrigeration";--> statement-breakpoint
ALTER TABLE "warehouse"."products" DROP COLUMN "storage_requirements";