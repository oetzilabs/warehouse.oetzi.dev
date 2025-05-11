import { relations } from "drizzle-orm";
import { decimal, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-valibot";
import { TB_products } from "../products";
import { schema } from "../utils";
import { TB_sales } from "./sales";
import { TB_sales_discounts } from "./sales_discounts";

export const TB_sale_items = schema.table(
  "sale_items",
  (t) => ({
    saleId: t
      .varchar("sale_id")
      .references(() => TB_sales.id)
      .notNull(),
    productId: t
      .varchar("product_id")
      .references(() => TB_products.id)
      .notNull(),
    quantity: t.integer("quantity").notNull(),
    price: decimal("price", { precision: 10, scale: 2, mode: "number" }).notNull(),
  }),
  (table) => [primaryKey({ columns: [table.saleId, table.productId] })],
);
export const sale_items_relations = relations(TB_sale_items, ({ one, many }) => ({
  sale: one(TB_sales, {
    fields: [TB_sale_items.saleId],
    references: [TB_sales.id],
  }),
  product: one(TB_products, {
    fields: [TB_sale_items.productId],
    references: [TB_products.id],
  }),
  salesDiscounts: many(TB_sales_discounts),
}));

export type SaleItemSelect = typeof TB_sale_items.$inferSelect;
export type SaleItemInsert = typeof TB_sale_items.$inferInsert;
export const SaleItemCreateSchema = createInsertSchema(TB_sale_items);
export const SaleItemUpdateSchema = SaleItemCreateSchema;
