CREATE SCHEMA "warehouse";
--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('active', 'disabled', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."document_storage_queue_status" AS ENUM('pending', 'processing', 'done', 'failed');--> statement-breakpoint
CREATE TABLE "warehouse"."users" (
	"email" text NOT NULL,
	"hashed_password" text NOT NULL,
	"name" text NOT NULL,
	"image" text,
	"phone" text,
	"verified_at" timestamp with time zone,
	"status" "user_status" DEFAULT 'active',
	"has_finished_onboarding" boolean DEFAULT false NOT NULL,
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
	"current_warehouse_id" varchar
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
CREATE TABLE "warehouse"."storages" (
	"warehouse_id" varchar NOT NULL,
	"type_id" varchar NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"capacity" integer NOT NULL,
	"current_occupancy" integer DEFAULT 0,
	"location" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
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
CREATE TABLE "warehouse"."documents" (
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
CREATE TABLE "warehouse"."document_storage_offers" (
	"name" text NOT NULL,
	"description" text,
	"price" numeric DEFAULT 0 NOT NULL,
	"max_size" numeric DEFAULT 0 NOT NULL,
	"max_queue_size" numeric DEFAULT 0 NOT NULL,
	"shareable" boolean DEFAULT false NOT NULL,
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
CREATE TABLE "warehouse"."documents_storage_queue" (
	"document_id" varchar NOT NULL,
	"storage_id" varchar NOT NULL,
	"status" "document_storage_queue_status" DEFAULT 'pending' NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
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
CREATE TABLE "document_storage_offers_feature_sets" (
	"storage_offer_id" varchar NOT NULL,
	"feature_set_id" varchar NOT NULL,
	CONSTRAINT "document_storage_offers_feature_sets_storage_offer_id_feature_set_id_pk" PRIMARY KEY("storage_offer_id","feature_set_id")
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
	"warehouse_id" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "warehouse"."warehouse_storages" (
	"warehouse_id" varchar NOT NULL,
	"storage_id" varchar NOT NULL,
	CONSTRAINT "warehouse_storages_warehouse_id_storage_id_pk" PRIMARY KEY("warehouse_id","storage_id")
);
--> statement-breakpoint
CREATE TABLE "warehouse"."users_warehouses" (
	"user_id" varchar NOT NULL,
	"warehouse_id" varchar NOT NULL,
	CONSTRAINT "users_warehouses_user_id_warehouse_id_pk" PRIMARY KEY("user_id","warehouse_id")
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
CREATE TABLE "warehouse"."organization_addresses" (
	"organization_id" varchar NOT NULL,
	"address_id" varchar NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "warehouse"."organization_users" (
	"organization_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organization_users_user_id_organization_id_pk" PRIMARY KEY("user_id","organization_id")
);
--> statement-breakpoint
CREATE TABLE "warehouse"."organizations_warehouses" (
	"organization_id" varchar NOT NULL,
	"warehouse_id" varchar NOT NULL,
	CONSTRAINT "organizations_warehouses_organization_id_warehouse_id_pk" PRIMARY KEY("organization_id","warehouse_id")
);
--> statement-breakpoint
CREATE TABLE "warehouse"."organizations_storages" (
	"organization_id" varchar NOT NULL,
	"storage_id" varchar NOT NULL,
	CONSTRAINT "organizations_storages_organization_id_storage_id_pk" PRIMARY KEY("organization_id","storage_id")
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
ALTER TABLE "warehouse"."session" ADD CONSTRAINT "session_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "warehouse"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."session" ADD CONSTRAINT "session_current_organization_id_organizations_id_fk" FOREIGN KEY ("current_organization_id") REFERENCES "warehouse"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."session" ADD CONSTRAINT "session_current_warehouse_id_warehouses_id_fk" FOREIGN KEY ("current_warehouse_id") REFERENCES "warehouse"."warehouses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."storages" ADD CONSTRAINT "storages_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "warehouse"."warehouses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."storages" ADD CONSTRAINT "storages_type_id_storage_types_id_fk" FOREIGN KEY ("type_id") REFERENCES "warehouse"."storage_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."documents" ADD CONSTRAINT "documents_storage_id_document_storages_id_fk" FOREIGN KEY ("storage_id") REFERENCES "warehouse"."document_storages"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "warehouse"."document_storages" ADD CONSTRAINT "document_storages_offer_id_document_storage_offers_id_fk" FOREIGN KEY ("offer_id") REFERENCES "warehouse"."document_storage_offers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."offer_features" ADD CONSTRAINT "offer_features_offer_id_document_storage_offers_id_fk" FOREIGN KEY ("offer_id") REFERENCES "warehouse"."document_storage_offers"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "warehouse"."offer_features" ADD CONSTRAINT "offer_features_feature_set_id_feature_sets_id_fk" FOREIGN KEY ("feature_set_id") REFERENCES "warehouse"."feature_sets"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "warehouse"."documents_storage_queue" ADD CONSTRAINT "documents_storage_queue_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "warehouse"."documents"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "warehouse"."documents_storage_queue" ADD CONSTRAINT "documents_storage_queue_storage_id_document_storages_id_fk" FOREIGN KEY ("storage_id") REFERENCES "warehouse"."document_storages"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "document_storage_offers_feature_sets" ADD CONSTRAINT "document_storage_offers_feature_sets_storage_offer_id_document_storage_offers_id_fk" FOREIGN KEY ("storage_offer_id") REFERENCES "warehouse"."document_storage_offers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_storage_offers_feature_sets" ADD CONSTRAINT "document_storage_offers_feature_sets_feature_set_id_feature_sets_id_fk" FOREIGN KEY ("feature_set_id") REFERENCES "warehouse"."feature_sets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."warehouses" ADD CONSTRAINT "warehouses_address_addresses_id_fk" FOREIGN KEY ("address") REFERENCES "warehouse"."addresses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."warehouses" ADD CONSTRAINT "warehouses_warehouse_type_id_warehouse_types_id_fk" FOREIGN KEY ("warehouse_type_id") REFERENCES "warehouse"."warehouse_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."warehouses" ADD CONSTRAINT "warehouses_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "warehouse"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."warehouse_addresses" ADD CONSTRAINT "warehouse_addresses_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "warehouse"."warehouses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."warehouse_addresses" ADD CONSTRAINT "warehouse_addresses_address_id_addresses_id_fk" FOREIGN KEY ("address_id") REFERENCES "warehouse"."addresses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."warehouse_areas" ADD CONSTRAINT "warehouse_areas_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "warehouse"."warehouses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."warehouse_storages" ADD CONSTRAINT "warehouse_storages_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "warehouse"."warehouses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."warehouse_storages" ADD CONSTRAINT "warehouse_storages_storage_id_storages_id_fk" FOREIGN KEY ("storage_id") REFERENCES "warehouse"."storages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."users_warehouses" ADD CONSTRAINT "users_warehouses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "warehouse"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."users_warehouses" ADD CONSTRAINT "users_warehouses_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "warehouse"."warehouses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."organizations" ADD CONSTRAINT "organizations_address_addresses_id_fk" FOREIGN KEY ("address") REFERENCES "warehouse"."addresses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."organizations" ADD CONSTRAINT "organizations_owner_users_id_fk" FOREIGN KEY ("owner") REFERENCES "warehouse"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."organization_addresses" ADD CONSTRAINT "organization_addresses_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "warehouse"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."organization_addresses" ADD CONSTRAINT "organization_addresses_address_id_addresses_id_fk" FOREIGN KEY ("address_id") REFERENCES "warehouse"."addresses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."organization_users" ADD CONSTRAINT "organization_users_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "warehouse"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."organization_users" ADD CONSTRAINT "organization_users_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "warehouse"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."organizations_warehouses" ADD CONSTRAINT "organizations_warehouses_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "warehouse"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."organizations_warehouses" ADD CONSTRAINT "organizations_warehouses_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "warehouse"."warehouses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."organizations_storages" ADD CONSTRAINT "organizations_storages_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "warehouse"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."organizations_storages" ADD CONSTRAINT "organizations_storages_storage_id_document_storages_id_fk" FOREIGN KEY ("storage_id") REFERENCES "warehouse"."document_storages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."websockets" ADD CONSTRAINT "websockets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "warehouse"."users"("id") ON DELETE cascade ON UPDATE no action;