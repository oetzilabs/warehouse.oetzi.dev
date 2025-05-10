CREATE TYPE "public"."discount_target" AS ENUM('product', 'category', 'customer');--> statement-breakpoint
CREATE TYPE "public"."discount_type" AS ENUM('percentage', 'fixed_amount', 'buy_x_get_y');--> statement-breakpoint
CREATE TABLE "warehouse"."discounts_v1" (
	"code" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"can_be_combined" boolean DEFAULT false,
	"target" "discount_target" NOT NULL,
	"type" "discount_type" NOT NULL,
	"value" numeric(10, 2),
	"minimum_quantity" numeric,
	"start_date" timestamp with time zone,
	"end_date" timestamp with time zone,
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "discounts_v1_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "warehouse"."sales_discounts" (
	"sale_id" varchar NOT NULL,
	"product_id" varchar NOT NULL,
	"discount_id" varchar NOT NULL,
	CONSTRAINT "sales_discounts_sale_id_product_id_discount_id_pk" PRIMARY KEY("sale_id","product_id","discount_id")
);
--> statement-breakpoint
CREATE TABLE "warehouse"."organization_discounts" (
	"organization_id" varchar NOT NULL,
	"discount_id" varchar NOT NULL,
	CONSTRAINT "organization_discounts_organization_id_discount_id_pk" PRIMARY KEY("organization_id","discount_id")
);
--> statement-breakpoint
ALTER TABLE "warehouse"."sales" ALTER COLUMN "total" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "warehouse"."sales_discounts" ADD CONSTRAINT "sales_discounts_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "warehouse"."sales"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."sales_discounts" ADD CONSTRAINT "sales_discounts_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "warehouse"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."sales_discounts" ADD CONSTRAINT "sales_discounts_discount_id_discounts_v1_id_fk" FOREIGN KEY ("discount_id") REFERENCES "warehouse"."discounts_v1"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."organization_discounts" ADD CONSTRAINT "organization_discounts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "warehouse"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."organization_discounts" ADD CONSTRAINT "organization_discounts_discount_id_discounts_v1_id_fk" FOREIGN KEY ("discount_id") REFERENCES "warehouse"."discounts_v1"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."products" DROP COLUMN "current_stock";