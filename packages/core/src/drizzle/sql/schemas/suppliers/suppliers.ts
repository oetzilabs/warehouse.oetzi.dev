import { relations } from "drizzle-orm";
import { pgEnum, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-valibot";
import { object, omit, partial } from "valibot";
import { prefixed_cuid2 } from "../../../../utils/custom-cuid2-valibot";
import { commonTable } from "../entity";
import { TB_products } from "../products";
import { TB_supplier_contacts } from "./suppliers_contacts";
import { TB_supplier_notes } from "./suppliers_notes";

export const supplier_status = pgEnum("supplier_status", ["active", "inactive", "under_review", "blacklisted"]);

export const TB_suppliers = commonTable(
  "suppliers",
  {
    name: text("name").notNull(),
    code: text("code").notNull(),
    tax_id: text("tax_id"),
    email: text("email"),
    phone: text("phone"),
    website: text("website"),
    status: supplier_status("status").default("active").notNull(),
    payment_terms: text("payment_terms"),
    bank_details: text("bank_details"),
  },
  "sup",
);

export const supplier_relations = relations(TB_suppliers, ({ many }) => ({
  products: many(TB_products),
  notes: many(TB_supplier_notes),
  contacts: many(TB_supplier_contacts),
}));

export type SupplierSelect = typeof TB_suppliers.$inferSelect;
export type SupplierInsert = typeof TB_suppliers.$inferInsert;
export const SupplierCreateSchema = createInsertSchema(TB_suppliers);
export const SupplierUpdateSchema = object({
  ...partial(omit(SupplierCreateSchema, ["createdAt", "updatedAt"])).entries,
  id: prefixed_cuid2,
});
