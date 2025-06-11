import { relations } from "drizzle-orm";
import { decimal, primaryKey, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-valibot";
import { object, omit, partial } from "valibot";
import { prefixed_cuid2 } from "../../../../utils/custom-cuid2-valibot"; // Adjust path as needed
import { TB_products } from "../products/products"; // Assuming this path
import { schema } from "../utils";
import { TB_suppliers } from "./suppliers";
import { TB_supplier_products } from "./suppliers_products";

export const TB_supplier_product_price_history = schema.table(
  "supplier_product_price_history",
  (t) => ({
    supplierId: t
      .varchar("supplier_id")
      .references(() => TB_suppliers.id, { onDelete: "cascade" })
      .notNull(),
    productId: t
      .varchar("product_id")
      .references(() => TB_products.id, { onDelete: "cascade" })
      .notNull(),
    effectiveDate: t.timestamp("effective_date", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
    supplierPrice: decimal("supplier_price", {
      precision: 10,
      scale: 2,
      mode: "number",
    }).notNull(),
    currency: t.text("currency").notNull(),
    // You could add fields like 'minimumOrderQuantity' at that time, 'leadTime' at that time etc.
  }),
  (table) => [primaryKey({ columns: [table.supplierId, table.productId, table.effectiveDate] })],
);

export const supplier_product_price_history_relations = relations(TB_supplier_product_price_history, ({ one }) => ({
  supplierProduct: one(TB_supplier_products, {
    fields: [TB_supplier_product_price_history.supplierId, TB_supplier_product_price_history.productId],
    references: [TB_supplier_products.supplierId, TB_supplier_products.productId],
  }),
}));

export type SupplierProductPriceHistorySelect = typeof TB_supplier_product_price_history.$inferSelect;
export type SupplierProductPriceHistoryInsert = typeof TB_supplier_product_price_history.$inferInsert;

export const SupplierProductPriceHistoryCreateSchema = object({
  ...omit(createInsertSchema(TB_supplier_product_price_history), ["effectiveDate"]).entries,
});
export const SupplierProductPriceHistoryUpdateSchema = object({
  ...partial(SupplierProductPriceHistoryCreateSchema).entries,
  supplierId: prefixed_cuid2,
  productId: prefixed_cuid2,
});
