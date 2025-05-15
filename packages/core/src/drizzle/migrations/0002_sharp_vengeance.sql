ALTER TABLE "warehouse"."storage_inventory" RENAME TO "storage_spaces";--> statement-breakpoint
ALTER TABLE "warehouse"."storage_inventory_to_labels" RENAME TO "storage_spaces_to_labels";--> statement-breakpoint
ALTER TABLE "warehouse"."storage_spaces_to_labels" RENAME COLUMN "inventory_id" TO "storage_space_id";--> statement-breakpoint
ALTER TABLE "warehouse"."storage_spaces" DROP CONSTRAINT "storage_inventory_barcode_unique";--> statement-breakpoint
ALTER TABLE "warehouse"."storage_spaces" DROP CONSTRAINT "storage_inventory_storage_id_storages_id_fk";
--> statement-breakpoint
ALTER TABLE "warehouse"."storage_spaces_to_labels" DROP CONSTRAINT "storage_inventory_to_labels_inventory_id_storage_inventory_id_fk";
--> statement-breakpoint
ALTER TABLE "warehouse"."storage_spaces_to_labels" DROP CONSTRAINT "storage_inventory_to_labels_label_id_storage_labels_id_fk";
--> statement-breakpoint
ALTER TABLE "warehouse"."storage_spaces_to_labels" DROP CONSTRAINT "storage_inventory_to_labels_inventory_id_label_id_pk";--> statement-breakpoint
ALTER TABLE "warehouse"."storage_spaces_to_labels" ADD CONSTRAINT "storage_spaces_to_labels_storage_space_id_label_id_pk" PRIMARY KEY("storage_space_id","label_id");--> statement-breakpoint
ALTER TABLE "warehouse"."storage_spaces" ADD CONSTRAINT "storage_spaces_storage_id_storages_id_fk" FOREIGN KEY ("storage_id") REFERENCES "warehouse"."storages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."storage_spaces_to_labels" ADD CONSTRAINT "storage_spaces_to_labels_storage_space_id_storage_spaces_id_fk" FOREIGN KEY ("storage_space_id") REFERENCES "warehouse"."storage_spaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."storage_spaces_to_labels" ADD CONSTRAINT "storage_spaces_to_labels_label_id_storage_labels_id_fk" FOREIGN KEY ("label_id") REFERENCES "warehouse"."storage_labels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."storage_spaces" ADD CONSTRAINT "storage_spaces_barcode_unique" UNIQUE("barcode");