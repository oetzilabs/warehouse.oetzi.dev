CREATE TABLE "warehouse"."storage_inventory" (
	"storage_id" varchar NOT NULL,
	"name" text NOT NULL,
	"barcode" varchar(128) NOT NULL,
	"bounding_box" json,
	"dimensions" json,
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "storage_inventory_barcode_unique" UNIQUE("barcode")
);
--> statement-breakpoint
CREATE TABLE "warehouse"."storage_inventory_to_labels" (
	"inventory_id" varchar NOT NULL,
	"label_id" varchar NOT NULL,
	CONSTRAINT "storage_inventory_to_labels_inventory_id_label_id_pk" PRIMARY KEY("inventory_id","label_id")
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
ALTER TABLE "warehouse"."storage_inventory" ADD CONSTRAINT "storage_inventory_storage_id_storages_id_fk" FOREIGN KEY ("storage_id") REFERENCES "warehouse"."storages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."storage_inventory_to_labels" ADD CONSTRAINT "storage_inventory_to_labels_inventory_id_storage_inventory_id_fk" FOREIGN KEY ("inventory_id") REFERENCES "warehouse"."storage_inventory"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."storage_inventory_to_labels" ADD CONSTRAINT "storage_inventory_to_labels_label_id_storage_labels_id_fk" FOREIGN KEY ("label_id") REFERENCES "warehouse"."storage_labels"("id") ON DELETE cascade ON UPDATE no action;