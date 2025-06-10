import { relations } from "drizzle-orm";
import { integer, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-valibot";
import { InferInput, object, partial } from "valibot";
import { commonTable } from "../entity";
import { TB_products } from "../products/products";
import { schema } from "../utils";
import { TB_supplier_purchases } from "./supplier_purchases";

export const TB_supplier_purchase_products = commonTable(
  "supplier_purchase_products",
  {
    supplierPurchaseId: varchar("supplier_purchase_id")
      .references(() => TB_supplier_purchases.id, { onDelete: "cascade" })
      .notNull(),
    productId: varchar("product_id")
      .references(() => TB_products.id, { onDelete: "cascade" })
      .notNull(),
    quantity: integer("quantity").notNull().default(1),
  },
  "spurchp",
);

export const supplier_purchase_products_relations = relations(TB_supplier_purchase_products, ({ one }) => ({
  supplierPurchase: one(TB_supplier_purchases, {
    fields: [TB_supplier_purchase_products.supplierPurchaseId],
    references: [TB_supplier_purchases.id],
  }),
  product: one(TB_products, {
    fields: [TB_supplier_purchase_products.productId],
    references: [TB_products.id],
  }),
}));

export type SupplierPurchaseProductSelect = typeof TB_supplier_purchase_products.$inferSelect;
export type SupplierPurchaseProductInsert = typeof TB_supplier_purchase_products.$inferInsert;
export const SupplierPurchaseProductCreateSchema = createInsertSchema(TB_supplier_purchase_products);
export type SupplierPurchaseProductCreate = InferInput<typeof SupplierPurchaseProductCreateSchema>;
export const SupplierPurchaseProductUpdateSchema = object({
  ...partial(SupplierPurchaseProductCreateSchema).entries,
});
