import { relations } from "drizzle-orm";
import { index, text, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-valibot";
import { object, omit, partial } from "valibot";
import { prefixed_cuid2 } from "../../../../utils/custom-cuid2-valibot";
import { commonTable } from "../entity";
import { TB_storage_to_labels } from "./storage_to_labels";

export const TB_storage_labels = commonTable(
  "storage_labels",
  {
    name: text("name").notNull(),
    color: varchar("color", { length: 7 }).notNull(), // hex color
  },
  "storage_label",
  (table) => [index("idx_storage_labels_name").on(table.name)],
);

export const storage_labels_relations = relations(TB_storage_labels, ({ many }) => ({
  storages: many(TB_storage_to_labels),
}));

export type StorageLabelSelect = typeof TB_storage_labels.$inferSelect;
export type StorageLabelInsert = typeof TB_storage_labels.$inferInsert;
export const StorageLabelCreateSchema = omit(createInsertSchema(TB_storage_labels), ["createdAt", "updatedAt"]);
export const StorageLabelUpdateSchema = object({
  ...partial(omit(createInsertSchema(TB_storage_labels), ["createdAt", "updatedAt"])).entries,
  id: prefixed_cuid2,
});
