import { relations } from "drizzle-orm";
import { integer, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-valibot";
import { InferInput } from "valibot";
import { commonTable } from "../entity";
import { TB_products } from "../products/products";
import { TB_orders } from "./orders";

export const TB_order_products = commonTable(
  "order_products",
  {
    orderId: varchar("order_id")
      .references(() => TB_orders.id, { onDelete: "cascade" })
      .notNull(),
    productId: varchar("product_id")
      .references(() => TB_products.id, { onDelete: "cascade" })
      .notNull(),
    quantity: integer("quantity").notNull().default(0),
  },
  "ordprod",
);

export const order_products_relations = relations(TB_order_products, ({ one }) => ({
  order: one(TB_orders, {
    fields: [TB_order_products.orderId],
    references: [TB_orders.id],
  }),
  product: one(TB_products, {
    fields: [TB_order_products.productId],
    references: [TB_products.id],
  }),
}));

export type OrderProductSelect = typeof TB_order_products.$inferSelect;
export type OrderProductInsert = typeof TB_order_products.$inferInsert;
export const OrderProductCreateSchema = createInsertSchema(TB_order_products);
export type OrderProductCreate = InferInput<typeof OrderProductCreateSchema>;
