import { relations } from "drizzle-orm";
import { json, text, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-valibot";
import { InferInput, object, omit, partial } from "valibot";
import { prefixed_cuid2 } from "../../../../utils/custom-cuid2-valibot";
import { TB_customers } from "../customers/customers";
import { commonTable } from "../entity";
import { TB_sales } from "../sales/sales";
import { TB_user_orders } from "../users/user_orders";
import { TB_users } from "../users/users";
import { schema } from "../utils";
import { TB_warehouse_orders } from "../warehouses/warehouse_orders";
import { TB_order_products } from "./order_products";

export const order_status = schema.enum("order_status", ["pending", "processing", "completed", "cancelled"]);

export const TB_orders = commonTable(
  "orders",
  {
    status: order_status("status").notNull().default("pending"),
    title: text("title").notNull(),
    description: text("description"),
    customerId: text("customer_id")
      .references(() => TB_customers.id)
      .notNull(),
    saleId: text("sale_id").references(() => TB_sales.id, { onDelete: "set null" }),
  },
  "ord",
);

export const order_relations = relations(TB_orders, ({ one, many }) => ({
  whs: many(TB_warehouse_orders),
  users: many(TB_user_orders),
  products: many(TB_order_products),
  customer: one(TB_customers, {
    fields: [TB_orders.customerId],
    references: [TB_customers.id],
  }),
  sale: one(TB_sales, {
    fields: [TB_orders.saleId],
    references: [TB_sales.id],
  }),
}));

export type OrderSelect = typeof TB_orders.$inferSelect;
export type OrderInsert = typeof TB_orders.$inferInsert;
export const OrderCreateSchema = omit(createInsertSchema(TB_orders), ["createdAt", "updatedAt"]);
export type OrderCreate = InferInput<typeof OrderCreateSchema>;
export const OrderUpdateSchema = object({
  ...partial(omit(createInsertSchema(TB_orders), ["createdAt", "updatedAt"])).entries,
  id: prefixed_cuid2,
});
export type OrderUpdate = InferInput<typeof OrderUpdateSchema>;
