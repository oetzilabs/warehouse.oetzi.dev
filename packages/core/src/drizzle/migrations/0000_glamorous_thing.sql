CREATE SCHEMA "warehouse";
--> statement-breakpoint
CREATE TYPE "warehouse"."user_status" AS ENUM('active', 'disabled', 'suspended');--> statement-breakpoint
CREATE TYPE "warehouse"."message_type" AS ENUM('draft', 'normal');--> statement-breakpoint
CREATE TYPE "warehouse"."device_status" AS ENUM('online', 'offline', 'unresponsive', 'unknown', 'shutting-down', 'rebooting', 'maintenance', 'error');--> statement-breakpoint
CREATE TYPE "warehouse"."brand_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TYPE "warehouse"."certificate_types" AS ENUM('digital', 'physical');--> statement-breakpoint
CREATE TYPE "warehouse"."reoccurrence_type" AS ENUM('none', 'daily', 'weekly', 'biweekly', 'monthly', 'semimonthly', 'quarterly', 'yearly', 'custom');--> statement-breakpoint
CREATE TYPE "warehouse"."discount_target" AS ENUM('product', 'category', 'customer');--> statement-breakpoint
CREATE TYPE "warehouse"."discount_type" AS ENUM('percentage', 'fixed_amount', 'buy_x_get_y');--> statement-breakpoint
CREATE TYPE "warehouse"."sale_status" AS ENUM('created', 'draft', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'deleted');--> statement-breakpoint
CREATE TYPE "warehouse"."customer_status" AS ENUM('active', 'inactive', 'blocked');--> statement-breakpoint
CREATE TYPE "warehouse"."schedule_status" AS ENUM('scheduled', 'preparing', 'ready', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "warehouse"."schedule_type" AS ENUM('delivery', 'pickup');--> statement-breakpoint
CREATE TYPE "warehouse"."customer_order_status" AS ENUM('pending', 'processing', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "warehouse"."supplier_status" AS ENUM('active', 'inactive', 'under_review', 'blacklisted');--> statement-breakpoint
CREATE TYPE "warehouse"."contact_type" AS ENUM('primary', 'billing', 'shipping', 'technical', 'other');--> statement-breakpoint
CREATE TYPE "warehouse"."note_type" AS ENUM('general', 'payment', 'delivery', 'quality', 'other');--> statement-breakpoint
CREATE TYPE "warehouse"."supplier_schedule_status" AS ENUM('scheduled', 'preparing', 'ready', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "warehouse"."supplier_schedule_type" AS ENUM('delivery', 'pickup');--> statement-breakpoint
CREATE TYPE "warehouse"."supplier_purchase_status" AS ENUM('draft', 'pending', 'processing', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "warehouse"."document_storage_queue_status" AS ENUM('pending', 'processing', 'done', 'failed');--> statement-breakpoint
CREATE TYPE "warehouse"."storage_variant" AS ENUM('horizontal', 'vertical');--> statement-breakpoint
CREATE TYPE "warehouse"."payment_method_type" AS ENUM('cash', 'card', 'bank_account');--> statement-breakpoint
CREATE TYPE "warehouse"."payment_status" AS ENUM('pending', 'completed', 'failed', 'refunded');--> statement-breakpoint
CREATE TYPE "warehouse"."product_condition" AS ENUM('new', 'used', 'refurbished', 'damaged', 'expired');--> statement-breakpoint
CREATE TYPE "warehouse"."product_status" AS ENUM('active', 'discontinued', 'out_of_stock', 'recalled', 'pending_review');--> statement-breakpoint
CREATE TABLE "warehouse"."users" (
	"email" text NOT NULL,
	"hashed_password" text NOT NULL,
	"name" text NOT NULL,
	"image" text,
	"phone" text,
	"verified_at" timestamp with time zone,
	"status" "warehouse"."user_status" DEFAULT 'active',
	"has_finished_onboarding" boolean DEFAULT false NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "warehouse"."users_warehouses" (
	"user_id" varchar NOT NULL,
	"warehouse_id" varchar NOT NULL,
	CONSTRAINT "users_warehouses_user_id_warehouse_id_pk" PRIMARY KEY("user_id","warehouse_id")
);
--> statement-breakpoint
CREATE TABLE "warehouse"."user_payment_methods" (
	"user_id" varchar NOT NULL,
	"payment_method_id" varchar NOT NULL,
	CONSTRAINT "user_payment_methods_user_id_payment_method_id_pk" PRIMARY KEY("user_id","payment_method_id")
);
--> statement-breakpoint
CREATE TABLE "warehouse"."user_orders" (
	"user_id" varchar NOT NULL,
	"customer_order_id" varchar NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "warehouse"."messages" (
	"title" text NOT NULL,
	"content" text NOT NULL,
	"sender" text NOT NULL,
	"recipient" text NOT NULL,
	"type" "warehouse"."message_type" DEFAULT 'normal',
	"sent_at" timestamp with time zone,
	"read_at" timestamp with time zone,
	"archived_at" timestamp with time zone,
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "warehouse"."devices" (
	"name" text NOT NULL,
	"description" text,
	"status" "warehouse"."device_status" DEFAULT 'unknown' NOT NULL,
	"type_id" varchar NOT NULL,
	"organization_id" varchar NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "warehouse"."device_types" (
	"name" text NOT NULL,
	"code" varchar NOT NULL,
	"description" text,
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "warehouse"."session" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"user_id" varchar NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"access_token" text NOT NULL,
	"current_organization_id" varchar,
	"current_warehouse_id" varchar,
	"current_warehouse_facility_id" varchar
);
--> statement-breakpoint
CREATE TABLE "warehouse"."addresses" (
	"street" text NOT NULL,
	"house_number" text NOT NULL,
	"additional" text,
	"postal_code" text NOT NULL,
	"city" text NOT NULL,
	"state" text,
	"country" text NOT NULL,
	"lat" numeric NOT NULL,
	"lon" numeric NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "warehouse"."tax_rates" (
	"rate" numeric NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "warehouse"."tax_groups" (
	"name" text NOT NULL,
	"description" text,
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "warehouse"."tax_group_coutryrates" (
	"country_code" varchar NOT NULL,
	"tax_group_id" varchar NOT NULL,
	"tax_rate_id" varchar NOT NULL,
	"effective_date" timestamp DEFAULT now() NOT NULL,
	"expiration_date" timestamp,
	CONSTRAINT "tax_group_coutryrates_tax_group_id_tax_rate_id_pk" PRIMARY KEY("tax_group_id","tax_rate_id")
);
--> statement-breakpoint
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
CREATE TABLE "warehouse"."certificates" (
	"type" "warehouse"."certificate_types" DEFAULT 'digital' NOT NULL,
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
CREATE TABLE "warehouse"."notifications" (
	"title" text NOT NULL,
	"content" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "warehouse"."schedules" (
	"schedule_start" timestamp NOT NULL,
	"schedule_end" timestamp NOT NULL,
	"reoccurrence" "warehouse"."reoccurrence_type" DEFAULT 'none' NOT NULL,
	"interval" integer DEFAULT 0 NOT NULL,
	"until" timestamp,
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "warehouse"."discounts_v1" (
	"code" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"can_be_combined" boolean DEFAULT false,
	"target" "warehouse"."discount_target" NOT NULL,
	"type" "warehouse"."discount_type" NOT NULL,
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
CREATE TABLE "warehouse"."products" (
	"name" text NOT NULL,
	"description" text,
	"sku" text NOT NULL,
	"barcode" text NOT NULL,
	"brand_id" text,
	"weight" json,
	"dimensions" json,
	"customs_tariff_number" text,
	"country_of_origin" text,
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "products_barcode_unique" UNIQUE("barcode")
);
--> statement-breakpoint
CREATE TABLE "warehouse"."product_labels" (
	"name" text NOT NULL,
	"description" text,
	"color" text DEFAULT '#000000',
	"image" text,
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
CREATE TABLE "warehouse"."products_to_certifications" (
	"product_id" text NOT NULL,
	"certification_id" text NOT NULL,
	CONSTRAINT "products_to_certifications_product_id_certification_id_pk" PRIMARY KEY("product_id","certification_id")
);
--> statement-breakpoint
CREATE TABLE "warehouse"."products_to_storage_conditions" (
	"product_id" varchar NOT NULL,
	"condition_id" varchar NOT NULL,
	CONSTRAINT "products_to_storage_conditions_product_id_condition_id_pk" PRIMARY KEY("product_id","condition_id")
);
--> statement-breakpoint
CREATE TABLE "warehouse"."product_to_images" (
	"product_id" varchar NOT NULL,
	"image_id" text NOT NULL,
	CONSTRAINT "product_to_images_product_id_image_id_pk" PRIMARY KEY("product_id","image_id")
);
--> statement-breakpoint
CREATE TABLE "warehouse"."sales" (
	"customer_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"status" "warehouse"."sale_status" DEFAULT 'draft' NOT NULL,
	"note" text,
	"barcode" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "sales_barcode_unique" UNIQUE("barcode")
);
--> statement-breakpoint
CREATE TABLE "warehouse"."sale_items" (
	"sale_id" varchar NOT NULL,
	"product_id" varchar NOT NULL,
	"quantity" integer NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"currency" text NOT NULL,
	CONSTRAINT "sale_items_sale_id_product_id_pk" PRIMARY KEY("sale_id","product_id")
);
--> statement-breakpoint
CREATE TABLE "warehouse"."sales_discounts" (
	"sale_id" varchar NOT NULL,
	"product_id" varchar NOT NULL,
	"discount_id" varchar NOT NULL,
	CONSTRAINT "sales_discounts_sale_id_product_id_discount_id_pk" PRIMARY KEY("sale_id","product_id","discount_id")
);
--> statement-breakpoint
CREATE TABLE "warehouse"."customers" (
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"image" text,
	"status" "warehouse"."customer_status" DEFAULT 'active' NOT NULL,
	"verified_at" timestamp with time zone,
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "warehouse"."customer_notes" (
	"customer_id" text NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "warehouse"."customer_schedules" (
	"customer_id" varchar NOT NULL,
	"schedule_id" varchar NOT NULL,
	"order_id" varchar,
	"type" "warehouse"."schedule_type" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "warehouse"."customer_orders" (
	"status" "warehouse"."customer_order_status" DEFAULT 'pending' NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"barcode" varchar NOT NULL,
	"sale_id" varchar,
	"organization_id" varchar NOT NULL,
	"customer_id" varchar NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "customer_orders_barcode_unique" UNIQUE("barcode")
);
--> statement-breakpoint
CREATE TABLE "warehouse"."customer_order_products" (
	"customer_order_id" varchar NOT NULL,
	"product_id" varchar NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "warehouse"."customer_preferred_pickuptimes" (
	"customer_id" varchar NOT NULL,
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone,
	"notes" varchar,
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "warehouse"."customer_preferred_deliverytimes" (
	"customer_id" varchar NOT NULL,
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone,
	"notes" varchar,
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "warehouse"."catalogs" (
	"name" text NOT NULL,
	"description" text,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"barcode" varchar NOT NULL,
	"owner_id" varchar NOT NULL,
	"organization_id" varchar NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "catalogs_barcode_unique" UNIQUE("barcode")
);
--> statement-breakpoint
CREATE TABLE "warehouse"."catalog_products" (
	"catalog_id" text NOT NULL,
	"product_id" text NOT NULL,
	"discount" numeric(10, 2) DEFAULT 0 NOT NULL,
	CONSTRAINT "catalog_products_catalog_id_product_id_pk" PRIMARY KEY("catalog_id","product_id")
);
--> statement-breakpoint
CREATE TABLE "warehouse"."suppliers" (
	"name" text NOT NULL,
	"code" text NOT NULL,
	"tax_id" text,
	"email" text,
	"phone" text,
	"website" text,
	"status" "warehouse"."supplier_status" DEFAULT 'active' NOT NULL,
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
CREATE TABLE "warehouse"."supplier_product_price_history" (
	"supplier_id" varchar NOT NULL,
	"product_id" varchar NOT NULL,
	"effective_date" timestamp with time zone DEFAULT now() NOT NULL,
	"supplier_price" numeric(10, 2) NOT NULL,
	"currency" text NOT NULL,
	CONSTRAINT "supplier_product_price_history_supplier_id_product_id_effective_date_pk" PRIMARY KEY("supplier_id","product_id","effective_date")
);
--> statement-breakpoint
CREATE TABLE "warehouse"."supplier_contacts" (
	"supplier_id" varchar NOT NULL,
	"type" "warehouse"."contact_type" DEFAULT 'other' NOT NULL,
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
	"type" "warehouse"."note_type" DEFAULT 'general' NOT NULL,
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
CREATE TABLE "warehouse"."supplier_schedules" (
	"supplier_id" varchar NOT NULL,
	"schedule_id" varchar NOT NULL,
	"purchase_id" varchar,
	"type" "warehouse"."supplier_schedule_type" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "warehouse"."supplier_purchases" (
	"status" "warehouse"."supplier_purchase_status" DEFAULT 'pending' NOT NULL,
	"barcode" varchar NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"organization_id" varchar NOT NULL,
	"supplier_id" varchar NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "supplier_purchases_barcode_unique" UNIQUE("barcode")
);
--> statement-breakpoint
CREATE TABLE "warehouse"."supplier_purchase_products" (
	"supplier_purchase_id" varchar NOT NULL,
	"product_id" varchar NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "warehouse"."documents" (
	"name" text NOT NULL,
	"path" text NOT NULL,
	"preview_path" text,
	"type" text DEFAULT 'unknown' NOT NULL,
	"size" numeric DEFAULT 0 NOT NULL,
	"storage_id" varchar NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "warehouse"."document_storages" (
	"name" text NOT NULL,
	"description" text,
	"offer_id" varchar NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "warehouse"."documents_storage_queue" (
	"document_id" varchar NOT NULL,
	"storage_id" varchar NOT NULL,
	"status" "warehouse"."document_storage_queue_status" DEFAULT 'pending' NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "warehouse"."document_storage_offers" (
	"name" text NOT NULL,
	"description" text,
	"price" numeric DEFAULT 0 NOT NULL,
	"max_size" numeric DEFAULT 0 NOT NULL,
	"max_queue_size" numeric DEFAULT 0 NOT NULL,
	"shareable" boolean DEFAULT false NOT NULL,
	"disabled" boolean DEFAULT false NOT NULL,
	"requires_payment_method" boolean DEFAULT true NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "warehouse"."offer_features" (
	"offer_id" varchar NOT NULL,
	"feature_set_id" varchar NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "warehouse"."document_storage_offers_feature_sets" (
	"storage_offer_id" varchar NOT NULL,
	"feature_set_id" varchar NOT NULL,
	CONSTRAINT "document_storage_offers_feature_sets_storage_offer_id_feature_set_id_pk" PRIMARY KEY("storage_offer_id","feature_set_id")
);
--> statement-breakpoint
CREATE TABLE "warehouse"."feature_sets" (
	"name" text NOT NULL,
	"description" text,
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "warehouse"."document_feature" (
	"name" text NOT NULL,
	"description" text,
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "warehouse"."document_storage_feature_feature_sets" (
	"feature_id" varchar NOT NULL,
	"feature_set_id" varchar NOT NULL,
	CONSTRAINT "document_storage_feature_feature_sets_feature_id_feature_set_id_pk" PRIMARY KEY("feature_id","feature_set_id")
);
--> statement-breakpoint
CREATE TABLE "warehouse"."warehouses" (
	"name" text NOT NULL,
	"description" text,
	"address" varchar,
	"warehouse_type_id" varchar,
	"dimensions" json,
	"owner_id" varchar,
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "warehouse"."warehouse_facilities" (
	"name" text NOT NULL,
	"description" text,
	"bounding_box" json,
	"warehouse_id" text NOT NULL,
	"ownerId" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "warehouse"."warehouse_addresses" (
	"warehouse_id" varchar NOT NULL,
	"address_id" varchar NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "warehouse"."warehouse_types" (
	"name" text NOT NULL,
	"description" text,
	"code" text NOT NULL,
	"image" text,
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "warehouse"."warehouse_areas" (
	"name" text NOT NULL,
	"description" text,
	"bounding_box" json NOT NULL,
	"warehouse_facility_id" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "warehouse"."warehouse_products" (
	"warehouse_id" varchar NOT NULL,
	"product_id" varchar NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "warehouse"."storages" (
	"parent_id" varchar,
	"warehouse_area_id" varchar,
	"type_id" varchar NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"capacity" integer NOT NULL,
	"variant" "warehouse"."storage_variant" DEFAULT 'horizontal' NOT NULL,
	"barcode" varchar(128),
	"bounding_box" json NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "storages_barcode_unique" UNIQUE("barcode")
);
--> statement-breakpoint
CREATE TABLE "warehouse"."storage_types" (
	"name" text NOT NULL,
	"description" text,
	"code" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "warehouse"."storage_spaces_to_labels" (
	"storage_id" varchar NOT NULL,
	"label_id" varchar NOT NULL,
	CONSTRAINT "storage_spaces_to_labels_storage_id_label_id_pk" PRIMARY KEY("storage_id","label_id")
);
--> statement-breakpoint
CREATE TABLE "warehouse"."storage_labels" (
	"name" text NOT NULL,
	"color" varchar(7) NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
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
CREATE TABLE "warehouse"."storage_to_products" (
	"id" varchar NOT NULL,
	"product_id" varchar NOT NULL,
	"storage_id" varchar NOT NULL,
	CONSTRAINT "storage_to_products_id_product_id_storage_id_pk" PRIMARY KEY("id","product_id","storage_id")
);
--> statement-breakpoint
CREATE TABLE "warehouse"."payment_methods" (
	"type" "warehouse"."payment_method_type" NOT NULL,
	"provider" text DEFAULT 'stripe' NOT NULL,
	"disabled" boolean DEFAULT false NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "warehouse"."payment_history" (
	"user_id" text NOT NULL,
	"payment_method_id" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"status" "warehouse"."payment_status" DEFAULT 'pending' NOT NULL,
	"transaction_id" text,
	"description" text,
	"processed_at" timestamp with time zone,
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "warehouse"."organizations" (
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"image" text,
	"location" text,
	"description" text,
	"phone" text,
	"email" text,
	"website" text,
	"uid" text,
	"address" varchar,
	"owner" varchar NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "warehouse"."org_discounts" (
	"organization_id" varchar NOT NULL,
	"discount_id" varchar NOT NULL,
	CONSTRAINT "org_discounts_organization_id_discount_id_pk" PRIMARY KEY("organization_id","discount_id")
);
--> statement-breakpoint
CREATE TABLE "warehouse"."org_addresses" (
	"organization_id" varchar NOT NULL,
	"address_id" varchar NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "warehouse"."org_users" (
	"organization_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "org_users_user_id_organization_id_pk" PRIMARY KEY("user_id","organization_id")
);
--> statement-breakpoint
CREATE TABLE "warehouse"."organizations_warehouses" (
	"organization_id" varchar NOT NULL,
	"warehouse_id" varchar NOT NULL,
	CONSTRAINT "organizations_warehouses_organization_id_warehouse_id_pk" PRIMARY KEY("organization_id","warehouse_id")
);
--> statement-breakpoint
CREATE TABLE "warehouse"."organizations_products" (
	"organization_id" varchar NOT NULL,
	"product_id" varchar NOT NULL,
	"status" "warehouse"."product_status" DEFAULT 'active' NOT NULL,
	"condition" "warehouse"."product_condition" DEFAULT 'new' NOT NULL,
	"minimum_stock" integer DEFAULT 0 NOT NULL,
	"maximum_stock" integer,
	"reorder_point" integer,
	"default_tax_group_id" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "organizations_products_organization_id_product_id_pk" PRIMARY KEY("organization_id","product_id")
);
--> statement-breakpoint
CREATE TABLE "warehouse"."organization_product_price_history" (
	"organization_id" varchar NOT NULL,
	"product_id" varchar NOT NULL,
	"effective_date" timestamp with time zone DEFAULT now() NOT NULL,
	"selling_price" numeric(10, 2) NOT NULL,
	"currency" text NOT NULL,
	CONSTRAINT "organization_product_price_history_organization_id_product_id_effective_date_pk" PRIMARY KEY("organization_id","product_id","effective_date")
);
--> statement-breakpoint
CREATE TABLE "warehouse"."organizations_storages" (
	"organization_id" varchar NOT NULL,
	"storage_id" varchar NOT NULL,
	CONSTRAINT "organizations_storages_organization_id_storage_id_pk" PRIMARY KEY("organization_id","storage_id")
);
--> statement-breakpoint
CREATE TABLE "warehouse"."organizations_documents" (
	"organization_id" varchar NOT NULL,
	"document_id" varchar NOT NULL,
	CONSTRAINT "organizations_documents_organization_id_document_id_pk" PRIMARY KEY("organization_id","document_id")
);
--> statement-breakpoint
CREATE TABLE "warehouse"."org_suppliers" (
	"organization_id" varchar NOT NULL,
	"supplier_id" varchar NOT NULL,
	CONSTRAINT "org_suppliers_organization_id_supplier_id_pk" PRIMARY KEY("organization_id","supplier_id")
);
--> statement-breakpoint
CREATE TABLE "warehouse"."org_customers" (
	"organization_id" varchar NOT NULL,
	"customer_id" varchar NOT NULL,
	CONSTRAINT "org_customers_organization_id_customer_id_pk" PRIMARY KEY("organization_id","customer_id")
);
--> statement-breakpoint
CREATE TABLE "warehouse"."organizations_sales" (
	"organization_id" varchar NOT NULL,
	"sale_id" varchar NOT NULL,
	CONSTRAINT "organizations_sales_organization_id_sale_id_pk" PRIMARY KEY("organization_id","sale_id")
);
--> statement-breakpoint
CREATE TABLE "warehouse"."organizations_notifications" (
	"organization_id" varchar NOT NULL,
	"notification_id" varchar NOT NULL,
	"read_at" timestamp,
	CONSTRAINT "organizations_notifications_organization_id_notification_id_pk" PRIMARY KEY("organization_id","notification_id")
);
--> statement-breakpoint
CREATE TABLE "warehouse"."websockets" (
	"user_id" varchar,
	"connection_id" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "warehouse"."users_warehouses" ADD CONSTRAINT "users_warehouses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "warehouse"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."users_warehouses" ADD CONSTRAINT "users_warehouses_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "warehouse"."warehouses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."user_payment_methods" ADD CONSTRAINT "user_payment_methods_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "warehouse"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."user_payment_methods" ADD CONSTRAINT "user_payment_methods_payment_method_id_payment_methods_id_fk" FOREIGN KEY ("payment_method_id") REFERENCES "warehouse"."payment_methods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."user_orders" ADD CONSTRAINT "user_orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "warehouse"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."user_orders" ADD CONSTRAINT "user_orders_customer_order_id_customer_orders_id_fk" FOREIGN KEY ("customer_order_id") REFERENCES "warehouse"."customer_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."devices" ADD CONSTRAINT "devices_type_id_device_types_id_fk" FOREIGN KEY ("type_id") REFERENCES "warehouse"."device_types"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."devices" ADD CONSTRAINT "devices_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "warehouse"."organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."session" ADD CONSTRAINT "session_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "warehouse"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."session" ADD CONSTRAINT "session_current_organization_id_organizations_id_fk" FOREIGN KEY ("current_organization_id") REFERENCES "warehouse"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."session" ADD CONSTRAINT "session_current_warehouse_id_warehouses_id_fk" FOREIGN KEY ("current_warehouse_id") REFERENCES "warehouse"."warehouses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."session" ADD CONSTRAINT "session_current_warehouse_facility_id_warehouse_facilities_id_fk" FOREIGN KEY ("current_warehouse_facility_id") REFERENCES "warehouse"."warehouse_facilities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."tax_group_coutryrates" ADD CONSTRAINT "tax_group_coutryrates_tax_group_id_tax_groups_id_fk" FOREIGN KEY ("tax_group_id") REFERENCES "warehouse"."tax_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."tax_group_coutryrates" ADD CONSTRAINT "tax_group_coutryrates_tax_rate_id_tax_rates_id_fk" FOREIGN KEY ("tax_rate_id") REFERENCES "warehouse"."tax_rates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."products" ADD CONSTRAINT "products_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "warehouse"."brands"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."products_to_labels" ADD CONSTRAINT "products_to_labels_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "warehouse"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."products_to_labels" ADD CONSTRAINT "products_to_labels_label_id_product_labels_id_fk" FOREIGN KEY ("label_id") REFERENCES "warehouse"."product_labels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."products_to_certifications" ADD CONSTRAINT "products_to_certifications_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "warehouse"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."products_to_certifications" ADD CONSTRAINT "products_to_certifications_certification_id_certificates_id_fk" FOREIGN KEY ("certification_id") REFERENCES "warehouse"."certificates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."products_to_storage_conditions" ADD CONSTRAINT "products_to_storage_conditions_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "warehouse"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."products_to_storage_conditions" ADD CONSTRAINT "products_to_storage_conditions_condition_id_storage_conditions_id_fk" FOREIGN KEY ("condition_id") REFERENCES "warehouse"."storage_conditions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."product_to_images" ADD CONSTRAINT "product_to_images_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "warehouse"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."product_to_images" ADD CONSTRAINT "product_to_images_image_id_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "warehouse"."images"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."sales" ADD CONSTRAINT "sales_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "warehouse"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."sales" ADD CONSTRAINT "sales_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "warehouse"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."sale_items" ADD CONSTRAINT "sale_items_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "warehouse"."sales"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."sale_items" ADD CONSTRAINT "sale_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "warehouse"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."sales_discounts" ADD CONSTRAINT "sales_discounts_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "warehouse"."sales"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."sales_discounts" ADD CONSTRAINT "sales_discounts_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "warehouse"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."sales_discounts" ADD CONSTRAINT "sales_discounts_discount_id_discounts_v1_id_fk" FOREIGN KEY ("discount_id") REFERENCES "warehouse"."discounts_v1"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."customer_notes" ADD CONSTRAINT "customer_notes_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "warehouse"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."customer_schedules" ADD CONSTRAINT "customer_schedules_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "warehouse"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."customer_schedules" ADD CONSTRAINT "customer_schedules_schedule_id_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "warehouse"."schedules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."customer_schedules" ADD CONSTRAINT "customer_schedules_order_id_customer_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "warehouse"."customer_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."customer_orders" ADD CONSTRAINT "customer_orders_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "warehouse"."sales"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."customer_orders" ADD CONSTRAINT "customer_orders_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "warehouse"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."customer_orders" ADD CONSTRAINT "customer_orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "warehouse"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."customer_order_products" ADD CONSTRAINT "customer_order_products_customer_order_id_customer_orders_id_fk" FOREIGN KEY ("customer_order_id") REFERENCES "warehouse"."customer_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."customer_order_products" ADD CONSTRAINT "customer_order_products_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "warehouse"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."customer_preferred_pickuptimes" ADD CONSTRAINT "customer_preferred_pickuptimes_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "warehouse"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."customer_preferred_deliverytimes" ADD CONSTRAINT "customer_preferred_deliverytimes_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "warehouse"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."catalogs" ADD CONSTRAINT "catalogs_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "warehouse"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."catalogs" ADD CONSTRAINT "catalogs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "warehouse"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."catalog_products" ADD CONSTRAINT "catalog_products_catalog_id_catalogs_id_fk" FOREIGN KEY ("catalog_id") REFERENCES "warehouse"."catalogs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."catalog_products" ADD CONSTRAINT "catalog_products_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "warehouse"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."supplier_products" ADD CONSTRAINT "supplier_products_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "warehouse"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."supplier_products" ADD CONSTRAINT "supplier_products_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "warehouse"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."supplier_product_price_history" ADD CONSTRAINT "supplier_product_price_history_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "warehouse"."suppliers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."supplier_product_price_history" ADD CONSTRAINT "supplier_product_price_history_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "warehouse"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."supplier_contacts" ADD CONSTRAINT "supplier_contacts_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "warehouse"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."supplier_notes" ADD CONSTRAINT "supplier_notes_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "warehouse"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."supplier_schedules" ADD CONSTRAINT "supplier_schedules_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "warehouse"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."supplier_schedules" ADD CONSTRAINT "supplier_schedules_schedule_id_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "warehouse"."schedules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."supplier_schedules" ADD CONSTRAINT "supplier_schedules_purchase_id_supplier_purchases_id_fk" FOREIGN KEY ("purchase_id") REFERENCES "warehouse"."supplier_purchases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."supplier_purchases" ADD CONSTRAINT "supplier_purchases_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "warehouse"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."supplier_purchases" ADD CONSTRAINT "supplier_purchases_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "warehouse"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."supplier_purchase_products" ADD CONSTRAINT "supplier_purchase_products_supplier_purchase_id_supplier_purchases_id_fk" FOREIGN KEY ("supplier_purchase_id") REFERENCES "warehouse"."supplier_purchases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."supplier_purchase_products" ADD CONSTRAINT "supplier_purchase_products_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "warehouse"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."documents" ADD CONSTRAINT "documents_storage_id_document_storages_id_fk" FOREIGN KEY ("storage_id") REFERENCES "warehouse"."document_storages"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "warehouse"."document_storages" ADD CONSTRAINT "document_storages_offer_id_document_storage_offers_id_fk" FOREIGN KEY ("offer_id") REFERENCES "warehouse"."document_storage_offers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."documents_storage_queue" ADD CONSTRAINT "documents_storage_queue_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "warehouse"."documents"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "warehouse"."documents_storage_queue" ADD CONSTRAINT "documents_storage_queue_storage_id_document_storages_id_fk" FOREIGN KEY ("storage_id") REFERENCES "warehouse"."document_storages"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "warehouse"."offer_features" ADD CONSTRAINT "offer_features_offer_id_document_storage_offers_id_fk" FOREIGN KEY ("offer_id") REFERENCES "warehouse"."document_storage_offers"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "warehouse"."offer_features" ADD CONSTRAINT "offer_features_feature_set_id_feature_sets_id_fk" FOREIGN KEY ("feature_set_id") REFERENCES "warehouse"."feature_sets"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "warehouse"."document_storage_offers_feature_sets" ADD CONSTRAINT "document_storage_offers_feature_sets_storage_offer_id_document_storage_offers_id_fk" FOREIGN KEY ("storage_offer_id") REFERENCES "warehouse"."document_storage_offers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."document_storage_offers_feature_sets" ADD CONSTRAINT "document_storage_offers_feature_sets_feature_set_id_feature_sets_id_fk" FOREIGN KEY ("feature_set_id") REFERENCES "warehouse"."feature_sets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."document_storage_feature_feature_sets" ADD CONSTRAINT "document_storage_feature_feature_sets_feature_id_document_feature_id_fk" FOREIGN KEY ("feature_id") REFERENCES "warehouse"."document_feature"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."document_storage_feature_feature_sets" ADD CONSTRAINT "document_storage_feature_feature_sets_feature_set_id_feature_sets_id_fk" FOREIGN KEY ("feature_set_id") REFERENCES "warehouse"."feature_sets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."warehouses" ADD CONSTRAINT "warehouses_address_addresses_id_fk" FOREIGN KEY ("address") REFERENCES "warehouse"."addresses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."warehouses" ADD CONSTRAINT "warehouses_warehouse_type_id_warehouse_types_id_fk" FOREIGN KEY ("warehouse_type_id") REFERENCES "warehouse"."warehouse_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."warehouses" ADD CONSTRAINT "warehouses_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "warehouse"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."warehouse_facilities" ADD CONSTRAINT "warehouse_facilities_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "warehouse"."warehouses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."warehouse_facilities" ADD CONSTRAINT "warehouse_facilities_ownerId_users_id_fk" FOREIGN KEY ("ownerId") REFERENCES "warehouse"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."warehouse_addresses" ADD CONSTRAINT "warehouse_addresses_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "warehouse"."warehouses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."warehouse_addresses" ADD CONSTRAINT "warehouse_addresses_address_id_addresses_id_fk" FOREIGN KEY ("address_id") REFERENCES "warehouse"."addresses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."warehouse_areas" ADD CONSTRAINT "warehouse_areas_warehouse_facility_id_warehouse_facilities_id_fk" FOREIGN KEY ("warehouse_facility_id") REFERENCES "warehouse"."warehouse_facilities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."warehouse_products" ADD CONSTRAINT "warehouse_products_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "warehouse"."warehouses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."warehouse_products" ADD CONSTRAINT "warehouse_products_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "warehouse"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."storages" ADD CONSTRAINT "storages_parent_id_storages_id_fk" FOREIGN KEY ("parent_id") REFERENCES "warehouse"."storages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."storages" ADD CONSTRAINT "storages_warehouse_area_id_warehouse_areas_id_fk" FOREIGN KEY ("warehouse_area_id") REFERENCES "warehouse"."warehouse_areas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."storages" ADD CONSTRAINT "storages_type_id_storage_types_id_fk" FOREIGN KEY ("type_id") REFERENCES "warehouse"."storage_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."storage_spaces_to_labels" ADD CONSTRAINT "storage_spaces_to_labels_storage_id_storages_id_fk" FOREIGN KEY ("storage_id") REFERENCES "warehouse"."storages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."storage_spaces_to_labels" ADD CONSTRAINT "storage_spaces_to_labels_label_id_storage_labels_id_fk" FOREIGN KEY ("label_id") REFERENCES "warehouse"."storage_labels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."storage_to_products" ADD CONSTRAINT "storage_to_products_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "warehouse"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."storage_to_products" ADD CONSTRAINT "storage_to_products_storage_id_storages_id_fk" FOREIGN KEY ("storage_id") REFERENCES "warehouse"."storages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."payment_history" ADD CONSTRAINT "payment_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "warehouse"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."payment_history" ADD CONSTRAINT "payment_history_payment_method_id_payment_methods_id_fk" FOREIGN KEY ("payment_method_id") REFERENCES "warehouse"."payment_methods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."organizations" ADD CONSTRAINT "organizations_address_addresses_id_fk" FOREIGN KEY ("address") REFERENCES "warehouse"."addresses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."organizations" ADD CONSTRAINT "organizations_owner_users_id_fk" FOREIGN KEY ("owner") REFERENCES "warehouse"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."org_discounts" ADD CONSTRAINT "org_discounts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "warehouse"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."org_discounts" ADD CONSTRAINT "org_discounts_discount_id_discounts_v1_id_fk" FOREIGN KEY ("discount_id") REFERENCES "warehouse"."discounts_v1"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."org_addresses" ADD CONSTRAINT "org_addresses_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "warehouse"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."org_addresses" ADD CONSTRAINT "org_addresses_address_id_addresses_id_fk" FOREIGN KEY ("address_id") REFERENCES "warehouse"."addresses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."org_users" ADD CONSTRAINT "org_users_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "warehouse"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."org_users" ADD CONSTRAINT "org_users_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "warehouse"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."organizations_warehouses" ADD CONSTRAINT "organizations_warehouses_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "warehouse"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."organizations_warehouses" ADD CONSTRAINT "organizations_warehouses_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "warehouse"."warehouses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."organizations_products" ADD CONSTRAINT "organizations_products_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "warehouse"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."organizations_products" ADD CONSTRAINT "organizations_products_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "warehouse"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."organizations_products" ADD CONSTRAINT "organizations_products_default_tax_group_id_tax_groups_id_fk" FOREIGN KEY ("default_tax_group_id") REFERENCES "warehouse"."tax_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."organization_product_price_history" ADD CONSTRAINT "organization_product_price_history_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "warehouse"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."organization_product_price_history" ADD CONSTRAINT "organization_product_price_history_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "warehouse"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."organizations_storages" ADD CONSTRAINT "organizations_storages_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "warehouse"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."organizations_storages" ADD CONSTRAINT "organizations_storages_storage_id_document_storages_id_fk" FOREIGN KEY ("storage_id") REFERENCES "warehouse"."document_storages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."organizations_documents" ADD CONSTRAINT "organizations_documents_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "warehouse"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."organizations_documents" ADD CONSTRAINT "organizations_documents_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "warehouse"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."org_suppliers" ADD CONSTRAINT "org_suppliers_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "warehouse"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."org_suppliers" ADD CONSTRAINT "org_suppliers_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "warehouse"."suppliers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."org_customers" ADD CONSTRAINT "org_customers_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "warehouse"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."org_customers" ADD CONSTRAINT "org_customers_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "warehouse"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."organizations_sales" ADD CONSTRAINT "organizations_sales_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "warehouse"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."organizations_sales" ADD CONSTRAINT "organizations_sales_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "warehouse"."sales"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."organizations_notifications" ADD CONSTRAINT "organizations_notifications_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "warehouse"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."organizations_notifications" ADD CONSTRAINT "organizations_notifications_notification_id_notifications_id_fk" FOREIGN KEY ("notification_id") REFERENCES "warehouse"."notifications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."websockets" ADD CONSTRAINT "websockets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "warehouse"."users"("id") ON DELETE cascade ON UPDATE no action;