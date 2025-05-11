import { relations } from "drizzle-orm";
import { pgEnum, text, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-valibot";
import { object, omit, partial } from "valibot";
import { prefixed_cuid2 } from "../../../../utils/custom-cuid2-valibot";
import { commonTable } from "../entity";
import { TB_suppliers } from "./suppliers";

export const contact_type = pgEnum("contact_type", ["primary", "billing", "shipping", "technical", "other"]);

export const TB_supplier_contacts = commonTable(
  "supplier_contacts",
  {
    supplierId: varchar("supplier_id")
      .references(() => TB_suppliers.id)
      .notNull(),
    type: contact_type("type").default("other").notNull(),
    name: text("name").notNull(),
    position: text("position"),
    email: text("email"),
    phone: text("phone"),
    mobile: text("mobile"),
    notes: text("notes"),
    isActive: text("is_active").default("true").notNull(),
  },
  "scon",
);

export const supplier_contacts_relations = relations(TB_supplier_contacts, ({ one }) => ({
  supplier: one(TB_suppliers, {
    fields: [TB_supplier_contacts.supplierId],
    references: [TB_suppliers.id],
  }),
}));

export type SupplierContactSelect = typeof TB_supplier_contacts.$inferSelect;
export type SupplierContactInsert = typeof TB_supplier_contacts.$inferInsert;
export const SupplierContactCreateSchema = createInsertSchema(TB_supplier_contacts);
export const SupplierContactUpdateSchema = object({
  ...partial(omit(SupplierContactCreateSchema, ["createdAt", "updatedAt"])).entries,
  id: prefixed_cuid2,
});
