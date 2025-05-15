import { relations } from "drizzle-orm";
import { primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-valibot";
import { schema } from "../utils";
import { TB_storage_labels } from "./storage_labels";
import { TB_storage_spaces } from "./storage_space";

export const TB_storage_spaces_to_labels = schema.table(
  "storage_spaces_to_labels",
  (t) => ({
    storageSpaceId: t
      .varchar("storage_space_id")
      .references(() => TB_storage_spaces.id, { onDelete: "cascade" })
      .notNull(),
    labelId: t
      .varchar("label_id")
      .references(() => TB_storage_labels.id, { onDelete: "cascade" })
      .notNull(),
  }),
  (t) => [primaryKey({ columns: [t.storageSpaceId, t.labelId] })],
);

export const storage_spaces_to_labels_relations = relations(TB_storage_spaces_to_labels, ({ one }) => ({
  space: one(TB_storage_spaces, {
    fields: [TB_storage_spaces_to_labels.storageSpaceId],
    references: [TB_storage_spaces.id],
  }),
  label: one(TB_storage_labels, {
    fields: [TB_storage_spaces_to_labels.labelId],
    references: [TB_storage_labels.id],
  }),
}));

export type StorageInventoryToLabelSelect = typeof TB_storage_spaces_to_labels.$inferSelect;
export type StorageInventoryToLabelInsert = typeof TB_storage_spaces_to_labels.$inferInsert;
export const StorageInventoryToLabelCreateSchema = createInsertSchema(TB_storage_spaces_to_labels);
