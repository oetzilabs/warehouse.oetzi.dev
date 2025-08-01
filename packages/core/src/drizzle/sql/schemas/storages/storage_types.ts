import { relations } from "drizzle-orm";
import { index, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-valibot";
import { object, omit, partial } from "valibot";
import { prefixed_cuid2 } from "../../../../utils/custom-cuid2-valibot";
import { commonTable } from "../entity";
import { TB_storages } from "./storages";

export const TB_storage_types = commonTable(
  "storage_types",
  {
    name: text("name").notNull(),
    description: text("description"),
    code: text("code").notNull(),
  },
  "storagetype",
  (table) => [index("idx_storage_name").on(table.name), index("idx_storage_code").on(table.code)],
);

export const storage_type_relations = relations(TB_storage_types, ({ many }) => ({
  storages: many(TB_storages),
}));

export type StorageTypeSelect = typeof TB_storage_types.$inferSelect;
export type StorageTypeInsert = typeof TB_storage_types.$inferInsert;
export const StorageTypeCreateSchema = omit(createInsertSchema(TB_storage_types), ["createdAt", "updatedAt"]);
export const StorageTypeUpdateSchema = object({
  ...partial(omit(createInsertSchema(TB_storage_types), ["createdAt", "updatedAt"])).entries,
  id: prefixed_cuid2,
});
