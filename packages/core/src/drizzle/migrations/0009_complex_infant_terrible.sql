CREATE TYPE "public"."document_storage_type" AS ENUM('local', 'remote:s3', 'remote:http');--> statement-breakpoint
CREATE TABLE "warehouse"."document_storages" (
	"name" text NOT NULL,
	"description" text,
	"path" text NOT NULL,
	"type" "document_storage_type" DEFAULT 'remote:s3' NOT NULL,
	"organization_id" varchar NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "warehouse"."warehouses" RENAME COLUMN "type" TO "warehouse_type_id";--> statement-breakpoint
ALTER TABLE "warehouse"."warehouses" DROP CONSTRAINT "warehouses_type_warehouse_types_id_fk";
--> statement-breakpoint
ALTER TABLE "warehouse"."document_storages" ADD CONSTRAINT "document_storages_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "warehouse"."organizations"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "warehouse"."warehouses" ADD CONSTRAINT "warehouses_warehouse_type_id_warehouse_types_id_fk" FOREIGN KEY ("warehouse_type_id") REFERENCES "warehouse"."warehouse_types"("id") ON DELETE cascade ON UPDATE no action;