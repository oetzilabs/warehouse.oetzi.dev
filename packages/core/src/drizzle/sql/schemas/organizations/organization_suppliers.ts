import { relations } from "drizzle-orm";
import { primaryKey, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-valibot";
import { object, omit, partial } from "valibot";
import { prefixed_cuid2 } from "../../../../utils/custom-cuid2-valibot";
import { commonTable } from "../entity";
import { TB_organizations } from "../organizations/organizations";
import { TB_suppliers } from "../suppliers/suppliers";
import { schema } from "../utils";

export const TB_organization_suppliers = schema.table(
  "organization_suppliers",
  {
    organization_id: varchar("organization_id")
      .references(() => TB_organizations.id, { onDelete: "cascade" })
      .notNull(),
    supplier_id: varchar("supplier_id")
      .references(() => TB_suppliers.id, { onDelete: "cascade" })
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.organization_id, table.supplier_id] })],
);

export const organization_suppliers_relation = relations(TB_organization_suppliers, ({ one }) => ({
  organization: one(TB_organizations, {
    fields: [TB_organization_suppliers.organization_id],
    references: [TB_organizations.id],
  }),
  supplier: one(TB_suppliers, {
    fields: [TB_organization_suppliers.supplier_id],
    references: [TB_suppliers.id],
  }),
}));

export type OrganizationSupplierInsert = typeof TB_organization_suppliers.$inferInsert;
export type OrganizationSupplierSelect = typeof TB_organization_suppliers.$inferSelect;

export const OrganizationSupplierCreateSchema = createInsertSchema(TB_organization_suppliers);
export const OrganizationSupplierUpdateSchema = OrganizationSupplierCreateSchema;
