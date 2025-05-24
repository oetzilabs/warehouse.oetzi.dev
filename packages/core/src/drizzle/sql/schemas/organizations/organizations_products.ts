import { relations } from "drizzle-orm";
import { primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-valibot";
import { object, partial } from "valibot";
import { prefixed_cuid2 } from "../../../../utils/custom-cuid2-valibot";
import { TB_products } from "../products/products";
import { schema } from "../utils";
import { TB_organizations } from "./organizations";

export const TB_organizations_products = schema.table(
  "organizations_products",
  (t) => ({
    organizationId: t
      .varchar("organization_id")
      .references(() => TB_organizations.id, { onDelete: "cascade" })
      .notNull(),
    productId: t
      .varchar("product_id")
      .references(() => TB_products.id, { onDelete: "cascade" })
      .notNull(),
  }),
  (table) => [primaryKey({ columns: [table.organizationId, table.productId] })],
);

export const organizations_products_relations = relations(TB_organizations_products, ({ one }) => ({
  organization: one(TB_organizations, {
    fields: [TB_organizations_products.organizationId],
    references: [TB_organizations.id],
  }),
  product: one(TB_products, {
    fields: [TB_organizations_products.productId],
    references: [TB_products.id],
  }),
}));

export type OrganizationProductSelect = typeof TB_organizations_products.$inferSelect;
export type OrganizationProductInsert = typeof TB_organizations_products.$inferInsert;
export const OrganizationProductCreateSchema = createInsertSchema(TB_organizations_products);
export const OrganizationProductUpdateSchema = object({
  ...partial(OrganizationProductCreateSchema).entries,
  id: prefixed_cuid2,
});
