import { relations } from "drizzle-orm";
import { decimal, primaryKey, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-valibot";
import { object, partial } from "valibot";
import { prefixed_cuid2 } from "../../../../utils/custom-cuid2-valibot";
import { TB_products } from "../products";
import { schema } from "../utils";
import { TB_suppliers } from "./suppliers";

export const TB_supplier_products = schema.table(
  "supplier_products",
  (t) => ({
    supplierId: t
      .varchar("supplier_id")
      .references(() => TB_suppliers.id)
      .notNull(),
    productId: t
      .varchar("product_id")
      .references(() => TB_products.id)
      .notNull(),
    supplierSku: text("supplier_sku"),
    supplierPrice: decimal("supplier_price", { precision: 10, scale: 2 }),
    isPreferredSupplier: text("is_preferred_supplier").default("false"),
    minOrderQuantity: decimal("min_order_quantity", { precision: 10, scale: 2 }),
    leadTime: text("lead_time"),
  }),
  (table) => [primaryKey({ columns: [table.supplierId, table.productId] })],
);

export const supplier_products_relations = relations(TB_supplier_products, ({ one }) => ({
  supplier: one(TB_suppliers, {
    fields: [TB_supplier_products.supplierId],
    references: [TB_suppliers.id],
  }),
  product: one(TB_products, {
    fields: [TB_supplier_products.productId],
    references: [TB_products.id],
  }),
}));

export type SupplierProductSelect = typeof TB_supplier_products.$inferSelect;
export type SupplierProductInsert = typeof TB_supplier_products.$inferInsert;
export const SupplierProductCreateSchema = createInsertSchema(TB_supplier_products);
export const SupplierProductUpdateSchema = object({
  ...partial(SupplierProductCreateSchema).entries,
  supplierId: prefixed_cuid2,
  productId: prefixed_cuid2,
});
