import { relations } from "drizzle-orm";
import { decimal, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-valibot";
import { object, omit, partial } from "valibot";
import { prefixed_cuid2 } from "../../../../utils/custom-cuid2-valibot"; // Adjust path as needed
import { TB_products } from "../products/products"; // Assuming this path
import { schema } from "../utils";
import { TB_organizations } from "./organizations";
import { TB_organizations_products } from "./organizations_products";

export const TB_organization_product_price_history = schema.table(
  "organization_product_price_history",
  (t) => ({
    organizationId: t
      .varchar("organization_id")
      .references(() => TB_organizations.id, {
        onDelete: "cascade",
      })
      .notNull(),
    productId: t
      .varchar("product_id")
      .references(() => TB_products.id, {
        onDelete: "cascade",
      })
      .notNull(),
    effectiveDate: t.timestamp("effective_date", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
    sellingPrice: decimal("selling_price", {
      precision: 10,
      scale: 2,
      mode: "number",
    }).notNull(),
    currency: t.text("currency").notNull(),
    // You could add a field like 'reason' or 'changedBy' for auditing
  }),
  (table) => [
    primaryKey({
      columns: [table.organizationId, table.productId, table.effectiveDate],
    }),
  ],
);

export const organization_product_price_history_relations = relations(
  TB_organization_product_price_history,
  ({ one }) => ({
    organizationProduct: one(TB_organizations_products, {
      fields: [TB_organization_product_price_history.organizationId, TB_organization_product_price_history.productId],
      references: [TB_organizations_products.organizationId, TB_organizations_products.productId],
    }),
  }),
);

export type OrganizationProductPriceHistorySelect = typeof TB_organization_product_price_history.$inferSelect;
export type OrganizationProductPriceHistoryInsert = typeof TB_organization_product_price_history.$inferInsert;

export const OrganizationProductPriceHistoryCreateSchema = object({
  ...omit(createInsertSchema(TB_organization_product_price_history), ["effectiveDate"]).entries,
});
export const OrganizationProductPriceHistoryUpdateSchema = object({
  ...partial(OrganizationProductPriceHistoryCreateSchema).entries,
  organizationId: prefixed_cuid2,
  productId: prefixed_cuid2,
});
