import { relations } from "drizzle-orm";
import { index, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-valibot";
import { InferInput, object, omit, partial } from "valibot";
import { prefixed_cuid2 } from "../../../../utils/custom-cuid2-valibot";
import { commonTable } from "../entity";
import { TB_organization_suppliers } from "../organizations/organization_suppliers";
import { schema } from "../utils";
import { TB_supplier_purchases } from "./supplier_purchases";
import { TB_supplier_contacts } from "./suppliers_contacts";
import { TB_supplier_notes } from "./suppliers_notes";
import { TB_supplier_products } from "./suppliers_products";
import { TB_supplier_schedules } from "./suppliers_schedules";

export const supplier_status = schema.enum("supplier_status", ["active", "inactive", "under_review", "blacklisted"]);

export const supplier_status_enum_values = supplier_status.enumValues;

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
  (table) => [index("idx_suppliers_name").on(table.name), index("idx_suppliers_code").on(table.code)],
);

export const supplier_relations = relations(TB_suppliers, ({ many }) => ({
  products: many(TB_supplier_products),
  notes: many(TB_supplier_notes),
  contacts: many(TB_supplier_contacts),
  organizations: many(TB_organization_suppliers),
  purchases: many(TB_supplier_purchases),
  schedules: many(TB_supplier_schedules),
}));

export type SupplierSelect = typeof TB_suppliers.$inferSelect;
export type SupplierInsert = typeof TB_suppliers.$inferInsert;
export const SupplierCreateSchema = omit(createInsertSchema(TB_suppliers), [
  "createdAt",
  "updatedAt",
  "deletedAt",
  "id",
]);
export const SupplierUpdateSchema = object({
  ...partial(SupplierCreateSchema).entries,
  id: prefixed_cuid2,
});
export type SupplierCreate = InferInput<typeof SupplierCreateSchema>;
export type SupplierUpdate = InferInput<typeof SupplierUpdateSchema>;
