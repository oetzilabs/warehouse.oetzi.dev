import { relations } from "drizzle-orm";
import { integer, json, text, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-valibot";
import { object, omit, partial } from "valibot";
import { prefixed_cuid2 } from "../../../../utils/custom-cuid2-valibot";
import { commonTable } from "../entity";
import { TB_storage_spaces } from "./storage_space";
import { TB_storages } from "./storages";

export const TB_storage_sections = commonTable(
  "storage_sections",
  {
    storageId: varchar("storage_id")
      .references(() => TB_storages.id, { onDelete: "cascade" })
      .notNull(),
    name: text("name").notNull(),
    barcode: varchar("barcode", { length: 128 }).notNull().unique(),
    // real dimensions in cm
    dimensions: json("dimensions").$type<{
      width: number;
      height: number;
      length: number;
    }>(),
  },
  "storagesection",
);

export const storage_section_relations = relations(TB_storage_sections, ({ one, many }) => ({
  storage: one(TB_storages, {
    fields: [TB_storage_sections.storageId],
    references: [TB_storages.id],
  }),
  spaces: many(TB_storage_spaces),
}));

export type StorageSectionSelect = typeof TB_storage_sections.$inferSelect;
export type StorageSectionInsert = typeof TB_storage_sections.$inferInsert;
export const StorageSectionCreateSchema = omit(createInsertSchema(TB_storage_sections), ["createdAt", "updatedAt"]);
export const StorageSectionUpdateSchema = object({
  ...partial(omit(createInsertSchema(TB_storage_sections), ["createdAt", "updatedAt"])).entries,
  id: prefixed_cuid2,
});
