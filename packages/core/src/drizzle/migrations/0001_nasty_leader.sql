CREATE TABLE "warehouse"."storage_sections" (
	"storage_id" varchar NOT NULL,
	"name" text NOT NULL,
	"barcode" varchar(128) NOT NULL,
	"dimensions" json,
	"product_capacity" integer DEFAULT 0 NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "storage_sections_barcode_unique" UNIQUE("barcode")
);
--> statement-breakpoint
ALTER TABLE "warehouse"."storage_spaces" DROP CONSTRAINT "storage_spaces_storage_id_storages_id_fk";
--> statement-breakpoint
ALTER TABLE "warehouse"."storage_spaces" ADD COLUMN "section_id" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "warehouse"."storage_sections" ADD CONSTRAINT "storage_sections_storage_id_storages_id_fk" FOREIGN KEY ("storage_id") REFERENCES "warehouse"."storages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."storage_spaces" ADD CONSTRAINT "storage_spaces_section_id_storage_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "warehouse"."storage_sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."storage_spaces" DROP COLUMN "storage_id";