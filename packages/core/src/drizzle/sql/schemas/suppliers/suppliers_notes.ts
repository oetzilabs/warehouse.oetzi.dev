import { relations } from "drizzle-orm";
import { text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-valibot";
import { object, omit, partial } from "valibot";
import { prefixed_cuid2 } from "../../../../utils/custom-cuid2-valibot";
import { commonTable } from "../entity";
import { schema } from "../utils";
import { TB_suppliers } from "./suppliers";

export const note_type = schema.enum("note_type", ["general", "payment", "delivery", "quality", "other"]);

export const TB_supplier_notes = commonTable(
  "supplier_notes",
  {
    supplierId: text("supplier_id")
      .references(() => TB_suppliers.id)
      .notNull(),
    type: note_type("type").default("general").notNull(),
    title: text("title").notNull(),
    content: text("content").notNull(),
    tags: text("tags"),
    importance: text("importance").default("normal"),
  },
  "snot",
);

export const supplier_notes_relations = relations(TB_supplier_notes, ({ one }) => ({
  supplier: one(TB_suppliers, {
    fields: [TB_supplier_notes.supplierId],
    references: [TB_suppliers.id],
  }),
}));

export type SupplierNoteSelect = typeof TB_supplier_notes.$inferSelect;
export type SupplierNoteInsert = typeof TB_supplier_notes.$inferInsert;
export const SupplierNoteCreateSchema = createInsertSchema(TB_supplier_notes);
export const SupplierNoteUpdateSchema = object({
  ...partial(omit(SupplierNoteCreateSchema, ["createdAt", "updatedAt"])).entries,
  id: prefixed_cuid2,
});
