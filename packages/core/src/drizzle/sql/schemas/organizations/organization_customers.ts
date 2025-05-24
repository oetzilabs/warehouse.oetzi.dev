import { relations } from "drizzle-orm";
import { primaryKey, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-valibot";
import { object, omit, partial } from "valibot";
import { prefixed_cuid2 } from "../../../../utils/custom-cuid2-valibot";
import { TB_customers } from "../customers/customers";
import { commonTable } from "../entity";
import { TB_organizations } from "../organizations/organizations";
import { schema } from "../utils";

export const TB_organization_customers = schema.table(
  "org_customers",
  {
    organization_id: varchar("organization_id")
      .references(() => TB_organizations.id, { onDelete: "cascade" })
      .notNull(),
    customer_id: varchar("customer_id")
      .references(() => TB_customers.id, { onDelete: "cascade" })
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.organization_id, table.customer_id] })],
);

export const organization_customers_relation = relations(TB_organization_customers, ({ one }) => ({
  organization: one(TB_organizations, {
    fields: [TB_organization_customers.organization_id],
    references: [TB_organizations.id],
  }),
  customer: one(TB_customers, {
    fields: [TB_organization_customers.customer_id],
    references: [TB_customers.id],
  }),
}));

export type OrganizationCustomerInsert = typeof TB_organization_customers.$inferInsert;
export type OrganizationCustomerSelect = typeof TB_organization_customers.$inferSelect;

export const OrganizationCustomerCreateSchema = createInsertSchema(TB_organization_customers);
export const OrganizationCustomerUpdateSchema = OrganizationCustomerCreateSchema;
