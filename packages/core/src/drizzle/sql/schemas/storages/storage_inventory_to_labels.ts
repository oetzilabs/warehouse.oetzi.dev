import { relations } from "drizzle-orm";
import { primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-valibot";
import { schema } from "../utils";
import { TB_storage_inventory } from "./storage_inventory";
import { TB_storage_labels } from "./storage_labels";

export const TB_storage_inventory_to_labels = schema.table(
  "storage_inventory_to_labels",
  (t) => ({
    inventoryId: t
      .varchar("inventory_id")
      .references(() => TB_storage_inventory.id, { onDelete: "cascade" })
      .notNull(),
    labelId: t
      .varchar("label_id")
      .references(() => TB_storage_labels.id, { onDelete: "cascade" })
      .notNull(),
  }),
  (t) => [primaryKey({ columns: [t.inventoryId, t.labelId] })],
);

export const storage_inventory_to_labels_relations = relations(TB_storage_inventory_to_labels, ({ one }) => ({
  inventory: one(TB_storage_inventory, {
    fields: [TB_storage_inventory_to_labels.inventoryId],
    references: [TB_storage_inventory.id],
  }),
  label: one(TB_storage_labels, {
    fields: [TB_storage_inventory_to_labels.labelId],
    references: [TB_storage_labels.id],
  }),
}));

export type StorageInventoryToLabelSelect = typeof TB_storage_inventory_to_labels.$inferSelect;
export type StorageInventoryToLabelInsert = typeof TB_storage_inventory_to_labels.$inferInsert;
export const StorageInventoryToLabelCreateSchema = createInsertSchema(TB_storage_inventory_to_labels);
