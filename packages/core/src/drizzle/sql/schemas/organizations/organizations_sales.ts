import { relations } from "drizzle-orm";
import { primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-valibot";
import { object, partial } from "valibot";
import { prefixed_cuid2 } from "../../../../utils/custom-cuid2-valibot";
import { TB_sales } from "../sales/sales";
import { schema } from "../utils";
import { TB_organizations } from "./organizations";

export const TB_organizations_sales = schema.table(
  "organizations_sales",
  (t) => ({
    organizationId: t
      .varchar("organization_id")
      .references(() => TB_organizations.id, { onDelete: "cascade" })
      .notNull(),
    saleId: t
      .varchar("sale_id")
      .references(() => TB_sales.id, { onDelete: "cascade" })
      .notNull(),
  }),
  (table) => [primaryKey({ columns: [table.organizationId, table.saleId] })],
);

export const organizations_sales_relations = relations(TB_organizations_sales, ({ one }) => ({
  organization: one(TB_organizations, {
    fields: [TB_organizations_sales.organizationId],
    references: [TB_organizations.id],
  }),
  sale: one(TB_sales, {
    fields: [TB_organizations_sales.saleId],
    references: [TB_sales.id],
  }),
}));

export type OrganizationSaleSelect = typeof TB_organizations_sales.$inferSelect;
export type OrganizationSaleInsert = typeof TB_organizations_sales.$inferInsert;
export const OrganizationSaleCreateSchema = createInsertSchema(TB_organizations_sales);
export const OrganizationSaleUpdateSchema = object({
  ...partial(OrganizationSaleCreateSchema).entries,
  id: prefixed_cuid2,
});
