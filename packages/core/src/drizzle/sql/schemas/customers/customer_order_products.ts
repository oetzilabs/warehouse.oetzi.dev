import { relations } from "drizzle-orm";
import { integer, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-valibot";
import { InferInput, object, partial } from "valibot";
import { commonTable } from "../entity";
import { TB_products } from "../products/products";
import { schema } from "../utils";
import { TB_customer_orders } from "./customer_orders";

export const TB_customer_order_products = commonTable(
  "customer_order_products",
  {
    customerOrderId: varchar("customer_order_id")
      .references(() => TB_customer_orders.id, { onDelete: "cascade" })
      .notNull(),
    productId: varchar("product_id")
      .references(() => TB_products.id, { onDelete: "cascade" })
      .notNull(),
    quantity: integer("quantity").notNull().default(1),
  },
  "cordp",
);

export const customer_order_products_relations = relations(TB_customer_order_products, ({ one }) => ({
  customerOrder: one(TB_customer_orders, {
    fields: [TB_customer_order_products.customerOrderId],
    references: [TB_customer_orders.id],
  }),
  product: one(TB_products, {
    fields: [TB_customer_order_products.productId],
    references: [TB_products.id],
  }),
}));

export type CustomerOrderProductSelect = typeof TB_customer_order_products.$inferSelect;
export type CustomerOrderProductInsert = typeof TB_customer_order_products.$inferInsert;
export const CustomerOrderProductCreateSchema = createInsertSchema(TB_customer_order_products);
export type CustomerOrderProductCreate = InferInput<typeof CustomerOrderProductCreateSchema>;
export const CustomerOrderProductUpdateSchema = object({
  ...partial(CustomerOrderProductCreateSchema).entries,
});
