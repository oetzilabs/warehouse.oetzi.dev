import { relations } from "drizzle-orm";
import { primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-valibot";
import { object, partial } from "valibot";
import { prefixed_cuid2 } from "../../../../utils/custom-cuid2-valibot";
import { TB_customers } from "../customers/customers";
import { TB_orders } from "../orders/orders";
import { TB_suppliers } from "../suppliers/suppliers";
import { schema } from "../utils";
import { TB_organizations } from "./organizations";

export const TB_organizations_customerorders = schema.table(
  "organizations_customerorders",
  (t) => ({
    organization_id: t
      .varchar("organization_id")
      .references(() => TB_organizations.id, { onDelete: "cascade" })
      .notNull(),
    order_id: t
      .varchar("order_id")
      .references(() => TB_orders.id, { onDelete: "cascade" })
      .notNull(),
    customer_id: t
      .varchar("customer_id")
      .references(() => TB_customers.id, { onDelete: "cascade" })
      .notNull(),
  }),
  (table) => [primaryKey({ columns: [table.organization_id, table.order_id, table.customer_id] })],
);

export const TB_organizations_supplierorders = schema.table(
  "organizations_supplierorders",
  (t) => ({
    organization_id: t
      .varchar("organization_id")
      .references(() => TB_organizations.id, { onDelete: "cascade" })
      .notNull(),
    order_id: t
      .varchar("order_id")
      .references(() => TB_orders.id, { onDelete: "cascade" })
      .notNull(),
    supplier_id: t
      .varchar("supplier_id")
      .references(() => TB_suppliers.id, { onDelete: "cascade" })
      .notNull(),
  }),
  (table) => [primaryKey({ columns: [table.organization_id, table.order_id, table.supplier_id] })],
);

export const organizations_customerorders_relations = relations(TB_organizations_customerorders, ({ one }) => ({
  organization: one(TB_organizations, {
    fields: [TB_organizations_customerorders.organization_id],
    references: [TB_organizations.id],
  }),
  order: one(TB_orders, {
    fields: [TB_organizations_customerorders.order_id],
    references: [TB_orders.id],
  }),
  customer: one(TB_customers, {
    fields: [TB_organizations_customerorders.customer_id],
    references: [TB_customers.id],
  }),
}));

export const organizations_supplierorders_relations = relations(TB_organizations_supplierorders, ({ one }) => ({
  organization: one(TB_organizations, {
    fields: [TB_organizations_supplierorders.organization_id],
    references: [TB_organizations.id],
  }),
  order: one(TB_orders, {
    fields: [TB_organizations_supplierorders.order_id],
    references: [TB_orders.id],
  }),
  supplier: one(TB_suppliers, {
    fields: [TB_organizations_supplierorders.supplier_id],
    references: [TB_suppliers.id],
  }),
}));

export type OrganizationCustomerOrderSelect = typeof TB_organizations_customerorders.$inferSelect;
export type OrganizationCustomerOrderInsert = typeof TB_organizations_customerorders.$inferInsert;
export const OrganizationCustomerOrderCreateSchema = createInsertSchema(TB_organizations_customerorders);
export const OrganizationCustomerOrderUpdateSchema = object({
  ...partial(OrganizationCustomerOrderCreateSchema).entries,
  id: prefixed_cuid2,
});

export type OrganizationSupplierOrderSelect = typeof TB_organizations_supplierorders.$inferSelect;
export type OrganizationSupplierOrderInsert = typeof TB_organizations_supplierorders.$inferInsert;
export const OrganizationSupplierOrderCreateSchema = createInsertSchema(TB_organizations_supplierorders);
export const OrganizationSupplierOrderUpdateSchema = object({
  ...partial(OrganizationSupplierOrderCreateSchema).entries,
  id: prefixed_cuid2,
});
