import { relations } from "drizzle-orm";
import { integer, json, text, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-valibot";
import { object, omit, partial } from "valibot";
import { prefixed_cuid2 } from "../../../../utils/custom-cuid2-valibot";
import { commonTable } from "../entity";
import { TB_storage_spaces_to_labels } from "./storage_inventory_to_labels";
import { TB_storage_sections } from "./storage_section";
import { TB_storage_spaces_to_products } from "./storage_spaces_to_products";

export const TB_storage_spaces = commonTable(
  "storage_spaces",
  {
    sectionId: varchar("section_id")
      .references(() => TB_storage_sections.id, { onDelete: "cascade" })
      .notNull(),
    name: text("name").notNull(),
    barcode: varchar("barcode", { length: 128 }).notNull().unique(),
    // real dimensions in cm
    dimensions: json("dimensions").$type<{
      width: number;
      height: number;
      length: number;
    }>(),
    productCapacity: integer("product_capacity").notNull().default(0),
  },
  "storagespace",
);

export const storage_space_relations = relations(TB_storage_spaces, ({ one, many }) => ({
  section: one(TB_storage_sections, {
    fields: [TB_storage_spaces.sectionId],
    references: [TB_storage_sections.id],
  }),
  labels: many(TB_storage_spaces_to_labels),
  prs: many(TB_storage_spaces_to_products),
}));

export type StorageSpaceSelect = typeof TB_storage_spaces.$inferSelect;
export type StorageSpaceInsert = typeof TB_storage_spaces.$inferInsert;
export const StorageSpaceCreateSchema = omit(createInsertSchema(TB_storage_spaces), ["createdAt", "updatedAt"]);
export const StorageSpaceUpdateSchema = object({
  ...partial(omit(createInsertSchema(TB_storage_spaces), ["createdAt", "updatedAt"])).entries,
  id: prefixed_cuid2,
});
