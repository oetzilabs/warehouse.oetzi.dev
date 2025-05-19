import { relations } from "drizzle-orm";
import { primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-valibot";
import { TB_discounts_v1 } from "../discounts";
import { TB_products } from "../products/products";
import { schema } from "../utils";
import { TB_sales } from "./sales";

export const TB_sales_discounts = schema.table(
  "sales_discounts",
  (t) => ({
    saleId: t
      .varchar("sale_id")
      .references(() => TB_sales.id)
      .notNull(),
    productId: t
      .varchar("product_id")
      .references(() => TB_products.id)
      .notNull(),
    discountId: t
      .varchar("discount_id")
      .references(() => TB_discounts_v1.id)
      .notNull(),
  }),
  (table) => [primaryKey({ columns: [table.saleId, table.productId, table.discountId] })],
);

export const sales_discounts_relations = relations(TB_sales_discounts, ({ one }) => ({
  sale: one(TB_sales, {
    fields: [TB_sales_discounts.saleId],
    references: [TB_sales.id],
  }),
  product: one(TB_products, {
    fields: [TB_sales_discounts.productId],
    references: [TB_products.id],
  }),
  discount: one(TB_discounts_v1, {
    fields: [TB_sales_discounts.discountId],
    references: [TB_discounts_v1.id],
  }),
}));

export type SaleDiscountSelect = typeof TB_sales_discounts.$inferSelect;
export type SaleDiscountInsert = typeof TB_sales_discounts.$inferInsert;
export const SaleDiscountCreateSchema = createInsertSchema(TB_sales_discounts);
export const SaleDiscountUpdateSchema = SaleDiscountCreateSchema;
