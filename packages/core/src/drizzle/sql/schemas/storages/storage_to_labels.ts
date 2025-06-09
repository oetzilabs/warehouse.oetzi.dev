import { relations } from "drizzle-orm";
import { primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-valibot";
import { schema } from "../utils";
import { TB_storage_labels } from "./storage_labels";
import { TB_storages } from "./storages";

export const TB_storage_to_labels = schema.table(
  "storage_spaces_to_labels",
  (t) => ({
    storageId: t
      .varchar("storage_id")
      .references(() => TB_storages.id, { onDelete: "cascade" })
      .notNull(),
    labelId: t
      .varchar("label_id")
      .references(() => TB_storage_labels.id, { onDelete: "cascade" })
      .notNull(),
  }),
  (t) => [primaryKey({ columns: [t.storageId, t.labelId] })],
);

export const storage_spaces_to_labels_relations = relations(TB_storage_to_labels, ({ one }) => ({
  storage: one(TB_storages, {
    fields: [TB_storage_to_labels.storageId],
    references: [TB_storages.id],
  }),
  label: one(TB_storage_labels, {
    fields: [TB_storage_to_labels.labelId],
    references: [TB_storage_labels.id],
  }),
}));

export type StorageInventoryToLabelSelect = typeof TB_storage_to_labels.$inferSelect;
export type StorageInventoryToLabelInsert = typeof TB_storage_to_labels.$inferInsert;
export const StorageInventoryToLabelCreateSchema = createInsertSchema(TB_storage_to_labels);
