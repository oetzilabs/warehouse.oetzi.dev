import { relations } from "drizzle-orm";
import { json, text, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-valibot";
import { object, omit, partial } from "valibot";
import { prefixed_cuid2 } from "../../../../utils/custom-cuid2-valibot";
import { commonTable } from "../entity";
import { TB_storage_inventory_to_labels } from "./storage_inventory_to_labels";
import { TB_storages } from "./storages";

export const TB_storage_inventory = commonTable(
  "storage_inventory",
  {
    storageId: varchar("storage_id")
      .references(() => TB_storages.id, { onDelete: "cascade" })
      .notNull(),
    name: text("name").notNull(),
    barcode: varchar("barcode", { length: 128 }).notNull().unique(),
    bounding_box: json("bounding_box").$type<{
      x: number;
      y: number;
      width: number;
      height: number;
    }>(),
    // real dimensions in cm
    dimensions: json("dimensions").$type<{
      width: number;
      height: number;
      length: number;
    }>(),
  },
  "storageinventory",
);

export const storage_inventory_relations = relations(TB_storage_inventory, ({ one, many }) => ({
  storage: one(TB_storages, {
    fields: [TB_storage_inventory.storageId],
    references: [TB_storages.id],
  }),
  labels: many(TB_storage_inventory_to_labels),
}));

export type StorageInventorySelect = typeof TB_storage_inventory.$inferSelect;
export type StorageInventoryInsert = typeof TB_storage_inventory.$inferInsert;
export const StorageInventoryCreateSchema = omit(createInsertSchema(TB_storage_inventory), ["createdAt", "updatedAt"]);
export const StorageInventoryUpdateSchema = object({
  ...partial(omit(createInsertSchema(TB_storage_inventory), ["createdAt", "updatedAt"])).entries,
  id: prefixed_cuid2,
});
