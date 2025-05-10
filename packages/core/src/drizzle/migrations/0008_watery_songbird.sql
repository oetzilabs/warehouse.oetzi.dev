CREATE TYPE "public"."product_condition" AS ENUM('new', 'used', 'refurbished', 'damaged', 'expired');--> statement-breakpoint
CREATE TYPE "public"."product_status" AS ENUM('active', 'discontinued', 'out_of_stock', 'recalled', 'pending_review');--> statement-breakpoint
CREATE TYPE "public"."sale_status" AS ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."customer_status" AS ENUM('active', 'inactive', 'blocked');--> statement-breakpoint
CREATE TYPE "public"."supplier_status" AS ENUM('active', 'inactive', 'under_review', 'blacklisted');--> statement-breakpoint
CREATE TYPE "public"."contact_type" AS ENUM('primary', 'billing', 'shipping', 'technical', 'other');--> statement-breakpoint
CREATE TYPE "public"."note_type" AS ENUM('general', 'payment', 'delivery', 'quality', 'other');--> statement-breakpoint
CREATE TABLE "warehouse"."products" (
	"name" text NOT NULL,
	"description" text,
	"sku" text NOT NULL,
	"barcode" text,
	"category" text,
	"brand" text,
	"model" text,
	"current_stock" integer DEFAULT 0 NOT NULL,
	"minimum_stock" integer DEFAULT 0 NOT NULL,
	"maximum_stock" integer,
	"reorder_point" integer,
	"serial_number" text,
	"lot_number" text,
	"batch_number" text,
	"manufacturing_date" timestamp with time zone,
	"expiration_date" timestamp with time zone,
	"shelf_life_days" integer,
	"status" "product_status" DEFAULT 'active' NOT NULL,
	"condition" "product_condition" DEFAULT 'new' NOT NULL,
	"is_hazardous" boolean DEFAULT false,
	"requires_refrigeration" boolean DEFAULT false,
	"purchase_price" numeric(10, 2),
	"selling_price" numeric(10, 2) NOT NULL,
	"msrp" numeric(10, 2),
	"currency" text DEFAULT 'USD',
	"weight" json,
	"dimensions" json,
	"certifications" json,
	"safety_stock" integer,
	"customs_tariff_number" text,
	"country_of_origin" text,
	"supplier_id" text,
	"manufacturer_id" text,
	"storage_requirements" json,
	"last_received_at" timestamp with time zone,
	"last_counted_at" timestamp with time zone,
	"last_quality_check_at" timestamp with time zone,
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "warehouse"."sales" (
	"customer_id" text NOT NULL,
	"warehouse_id" text NOT NULL,
	"status" "sale_status" DEFAULT 'pending' NOT NULL,
	"note" text,
	"total" numeric(10, 2) DEFAULT '0' NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "warehouse"."sale_items" (
	"sale_id" varchar NOT NULL,
	"product_id" varchar NOT NULL,
	"quantity" integer NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	CONSTRAINT "sale_items_sale_id_product_id_pk" PRIMARY KEY("sale_id","product_id")
);
--> statement-breakpoint
CREATE TABLE "warehouse"."customers" (
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"status" "customer_status" DEFAULT 'active' NOT NULL,
	"verified_at" timestamp with time zone,
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "warehouse"."suppliers" (
	"name" text NOT NULL,
	"code" text NOT NULL,
	"tax_id" text,
	"email" text,
	"phone" text,
	"website" text,
	"status" "supplier_status" DEFAULT 'active' NOT NULL,
	"payment_terms" text,
	"bank_details" text,
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "warehouse"."supplier_products" (
	"supplier_id" varchar NOT NULL,
	"product_id" varchar NOT NULL,
	"supplier_sku" text,
	"supplier_price" numeric(10, 2),
	"is_preferred_supplier" text DEFAULT 'false',
	"min_order_quantity" numeric(10, 2),
	"lead_time" text,
	CONSTRAINT "supplier_products_supplier_id_product_id_pk" PRIMARY KEY("supplier_id","product_id")
);
--> statement-breakpoint
CREATE TABLE "warehouse"."supplier_contacts" (
	"supplier_id" varchar NOT NULL,
	"type" "contact_type" DEFAULT 'other' NOT NULL,
	"name" text NOT NULL,
	"position" text,
	"email" text,
	"phone" text,
	"mobile" text,
	"notes" text,
	"is_active" text DEFAULT 'true' NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "warehouse"."supplier_notes" (
	"supplier_id" text NOT NULL,
	"type" "note_type" DEFAULT 'general' NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"tags" text,
	"importance" text DEFAULT 'normal',
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "warehouse"."sales" ADD CONSTRAINT "sales_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "warehouse"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."sales" ADD CONSTRAINT "sales_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "warehouse"."warehouses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."sale_items" ADD CONSTRAINT "sale_items_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "warehouse"."sales"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."sale_items" ADD CONSTRAINT "sale_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "warehouse"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."supplier_products" ADD CONSTRAINT "supplier_products_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "warehouse"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."supplier_products" ADD CONSTRAINT "supplier_products_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "warehouse"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."supplier_contacts" ADD CONSTRAINT "supplier_contacts_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "warehouse"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."supplier_notes" ADD CONSTRAINT "supplier_notes_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "warehouse"."suppliers"("id") ON DELETE no action ON UPDATE no action;